import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { promisify } from 'node:util'
import { logger } from '../logger.js'
import { detectDrift } from './drift-detector.js'
import { type Migration, type ProjectStatus, detectPrismaProject } from './prisma-detector.js'

const execFileAsync = promisify(execFile)

// ─── Risk keywords ────────────────────────────────────────────────────────────

const RISK_PATTERNS: Array<{ pattern: string; label: string }> = [
  { pattern: 'DROP TABLE', label: 'Drops table — irreversible data loss' },
  { pattern: 'DROP COLUMN', label: 'Drops column — potential data loss' },
  { pattern: 'DELETE FROM', label: 'Bulk data deletion' },
  { pattern: 'TRUNCATE', label: 'Truncates table — full data loss' },
  { pattern: 'ALTER TABLE', label: 'Alters table structure' },
  { pattern: 'DROP INDEX', label: 'Removes index — may impact performance' },
  { pattern: 'DROP CONSTRAINT', label: 'Removes constraint — may allow invalid data' },
]

export function analyzeMigrationRisks(sql: string): string[] {
  const upper = sql.toUpperCase()
  return RISK_PATTERNS.filter(({ pattern }) => upper.includes(pattern)).map(({ label }) => label)
}

// ─── Migration status parsing ─────────────────────────────────────────────────

/**
 * Run `prisma migrate status` safely using execFile (no shell) and parse the
 * output to build a map of migration name → status.
 *
 * Handles three states:
 *   applied  – every migration is applied (exit 0, empty stdout section)
 *   pending  – listed under "have not yet been applied"
 *   failed   – listed under "failed to apply" or "rolled back"
 */
async function getMigrationStatusMap(
  cwd: string,
  schemaPath: string,
): Promise<Map<string, Migration['status']>> {
  const map = new Map<string, Migration['status']>()

  let stdout = ''
  try {
    const result = await execFileAsync(
      'npx',
      ['prisma', 'migrate', 'status', '--schema', schemaPath],
      { cwd, timeout: 30_000 },
    )
    stdout = result.stdout
    // Exit 0 → all migrations applied; map stays empty (callers default to 'applied')
    return map
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    stdout = error.stdout ?? ''
    const stderr = error.stderr ?? ''

    // Connection failure — nothing we can parse
    if (
      stderr.includes('P1001') ||
      stderr.includes("Can't reach database server") ||
      stderr.includes('Connection refused')
    ) {
      throw new Error('DATABASE_UNREACHABLE')
    }

    logger.debug({ stdout, stderr }, 'prisma migrate status exited non-zero — parsing output')
  }

  const lines = stdout.split('\n')
  let mode: 'none' | 'pending' | 'failed' = 'none'

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Section headers
    if (line.includes('have not yet been applied')) {
      mode = 'pending'
      continue
    }
    if (line.match(/failed to apply|rolled back|migration.*failed/i)) {
      mode = 'failed'
      continue
    }
    // End of a section
    if (line === '' || line.startsWith('─') || line.startsWith('The following')) {
      mode = 'none'
      continue
    }

    if (mode === 'none') continue

    // Migration entries look like: "20231201120000_add_users"
    // They may be indented or prefixed with "• " or "- "
    const cleaned = line.replace(/^[•\-*]\s*/, '').trim()
    if (cleaned.match(/^\d{14}/)) {
      map.set(cleaned, mode === 'pending' ? 'pending' : 'failed')
    }
  }

  return map
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getMigrationDetails(cwd: string, name: string) {
  const project = await detectPrismaProject(cwd)
  if (!project) return null

  const migration = project.migrations.find((m) => m.name === name)
  if (!migration) return null

  let sql = ''
  try {
    sql = await fs.readFile(migration.sqlPath, 'utf-8')
  } catch {
    sql = '-- Could not read migration file'
  }

  const risks = analyzeMigrationRisks(sql)

  return { ...migration, sql, risks }
}

export async function getMigrations(cwd: string): Promise<(Migration & { risks: string[] })[]> {
  const project = await detectPrismaProject(cwd)
  if (!project) return []

  let statusMap: Map<string, Migration['status']>
  try {
    statusMap = await getMigrationStatusMap(cwd, project.schemaPath)
  } catch {
    statusMap = new Map()
  }

  return Promise.all(
    project.migrations.map(async (m) => {
      const status = statusMap.get(m.name) ?? 'applied'
      let sql = ''
      try {
        sql = await fs.readFile(m.sqlPath, 'utf-8')
      } catch {
        /* ignore */
      }
      const risks = analyzeMigrationRisks(sql)
      return { ...m, status, risks }
    }),
  )
}

export async function getProjectStatus(cwd: string): Promise<ProjectStatus> {
  const project = await detectPrismaProject(cwd)
  if (!project) throw new Error('No Prisma project found')

  // ── Connection check ──────────────────────────────────────────────────────
  let connected = false
  try {
    await execFileAsync('npx', ['prisma', 'migrate', 'status', '--schema', project.schemaPath], {
      cwd,
      timeout: 30_000,
    })
    connected = true
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; message?: string }
    const stderr = error.stderr ?? ''
    if (
      stderr.includes('P1001') ||
      stderr.includes("Can't reach database server") ||
      stderr.includes('Connection refused')
    ) {
      connected = false
    } else {
      // Non-zero exit due to pending/failed migrations — still connected
      connected = true
    }
  }

  const migrations = await getMigrations(cwd)
  const pendingCount = migrations.filter((m) => m.status === 'pending').length
  const failedCount = migrations.filter((m) => m.status === 'failed').length
  const appliedCount = migrations.filter((m) => m.status === 'applied').length

  // ── Drift detection ───────────────────────────────────────────────────────
  // Always report real drift independently of pending migrations.
  // Pending migrations are "schema ahead of DB"; genuine drift is "DB diverged
  // from the migration history" — both can coexist and both matter.
  let driftItems: Awaited<ReturnType<typeof detectDrift>> = []
  let hasDrift = false
  if (connected) {
    try {
      driftItems = await detectDrift(cwd)
      hasDrift = driftItems.length > 0
    } catch {
      // drift check errors are non-fatal
    }
  }

  // ── Risk level ────────────────────────────────────────────────────────────
  let riskLevel: ProjectStatus['riskLevel'] = 'low'
  if (failedCount > 0) riskLevel = 'high'
  else if (hasDrift) riskLevel = 'medium'
  else if (pendingCount > 0) riskLevel = 'low' // pending is expected, not risky by default

  return {
    connected,
    appliedCount: connected ? appliedCount : 0,
    pendingCount: connected ? pendingCount : migrations.length,
    failedCount,
    hasDrift,
    driftCount: driftItems.length,
    riskLevel,
    lastSync: new Date(),
  }
}
