import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { promisify } from 'node:util'
import type { MigrationRiskScore, ProjectStatus, RiskFactor, RiskLevel } from '@prisma-flow/shared'
import { logger } from '../logger.js'
import { type DriftDetectionResult, detectDrift } from './drift-detector.js'
import { type Migration, detectPrismaProject } from './prisma-detector.js'

export type { DriftDetectionResult }

const execFileAsync = promisify(execFile)

// ─── Risk Engine ──────────────────────────────────────────────────────────────

interface RiskPattern {
  pattern: RegExp
  /** Legacy label for backward compat */
  label: string
  severity: RiskLevel
  description: string
  recommendation: string
  /** Weight for composite score (0-100 scale) */
  weight: number
}

const RISK_PATTERNS: RiskPattern[] = [
  {
    pattern: /DROP\s+TABLE/i,
    label: 'Drops table — irreversible data loss',
    severity: 'high',
    description: 'Drops an entire table and all its data permanently.',
    recommendation: 'Ensure data has been migrated or backed up before applying.',
    weight: 40,
  },
  {
    pattern: /TRUNCATE/i,
    label: 'Truncates table — full data loss',
    severity: 'high',
    description: 'Removes all rows from a table. Cannot be rolled back with standard SQL.',
    recommendation: 'Export table data before applying this migration.',
    weight: 35,
  },
  {
    pattern: /DROP\s+COLUMN/i,
    label: 'Drops column — potential data loss',
    severity: 'high',
    description: 'Removes a column and all data stored in it.',
    recommendation: 'Verify no application code reads this column before deploying.',
    weight: 30,
  },
  {
    pattern: /ALTER\s+COLUMN.+NOT\s+NULL/i,
    label: 'Adds NOT NULL constraint',
    severity: 'high',
    description: 'Adding a NOT NULL constraint will fail if any existing rows have NULL values.',
    recommendation: 'Backfill NULL values before adding the constraint.',
    weight: 25,
  },
  {
    pattern: /ALTER\s+TABLE.+TYPE|ALTER\s+COLUMN.+TYPE/i,
    label: 'Changes column type',
    severity: 'high',
    description: 'Changing a column type can cause data loss or conversion failures.',
    recommendation: 'Test type conversion on a staging database first.',
    weight: 25,
  },
  {
    pattern: /DELETE\s+FROM/i,
    label: 'Bulk data deletion',
    severity: 'medium',
    description: 'Deletes rows from a table. Scope depends on the WHERE clause.',
    recommendation: 'Review the WHERE clause carefully and test on staging first.',
    weight: 20,
  },
  {
    pattern: /DROP\s+CONSTRAINT/i,
    label: 'Removes constraint — may allow invalid data',
    severity: 'medium',
    description: 'Removing a constraint allows data that was previously rejected.',
    recommendation: 'Audit existing data for constraint violations after applying.',
    weight: 15,
  },
  {
    pattern: /DROP\s+INDEX/i,
    label: 'Removes index — may impact performance',
    severity: 'low',
    description: 'Dropping an index can degrade query performance on the affected table.',
    recommendation: 'Monitor query performance after applying in production.',
    weight: 10,
  },
  {
    pattern: /ALTER\s+TABLE/i,
    label: 'Alters table structure',
    severity: 'low',
    description: 'Modifies table structure. Long-running on large tables.',
    recommendation: 'Consider table size and run during low-traffic windows.',
    weight: 8,
  },
]

/** Extract a table name from a SQL statement (best-effort). */
function extractTableName(sql: string): string | undefined {
  const match = sql.match(/(?:DROP|TRUNCATE|ALTER)\s+TABLE\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i)
  return match?.[2]
}

export function analyzeMigrationRisks(sql: string): string[] {
  return RISK_PATTERNS.filter(({ pattern }) => pattern.test(sql)).map(({ label }) => label)
}

export function scoreMigrationRisk(sql: string): MigrationRiskScore {
  const matchedPatterns = RISK_PATTERNS.filter(({ pattern }) => pattern.test(sql))

  const factors: RiskFactor[] = matchedPatterns.map((p) => {
    const affectedTable = extractTableName(sql)
    return {
      pattern: p.pattern.source,
      severity: p.severity,
      description: p.description,
      ...(affectedTable !== undefined ? { affectedTable } : {}),
      recommendation: p.recommendation,
    }
  })

  // Composite score: sum of matched weights, capped at 100
  const rawScore = matchedPatterns.reduce((acc, p) => acc + p.weight, 0)
  const score = Math.min(100, rawScore)

  let level: RiskLevel = 'low'
  if (score >= 50) level = 'high'
  else if (score >= 20) level = 'medium'

  return { score, level, factors }
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
  const riskScore = scoreMigrationRisk(sql)

  return { ...migration, sql, risks, riskScore }
}

export async function getMigrations(
  cwd: string,
): Promise<(Migration & { risks: string[]; riskScore: MigrationRiskScore })[]> {
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
      const riskScore = scoreMigrationRisk(sql)
      return { ...m, status, risks, riskScore }
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
  const migrationsPending = migrations.filter((m) => m.status === 'pending').length
  const migrationsFailed = migrations.filter((m) => m.status === 'failed').length
  const migrationsApplied = migrations.filter((m) => m.status === 'applied').length

  // ── Drift detection ───────────────────────────────────────────────────────
  let driftResult: DriftDetectionResult = { items: [], status: 'clean' }
  if (connected) {
    driftResult = await detectDrift(cwd)
  }
  const hasDrift = driftResult.status === 'drifted'

  // ── Risk level ────────────────────────────────────────────────────────────
  let riskLevel: RiskLevel = 'low'
  if (migrationsFailed > 0) riskLevel = 'high'
  else if (hasDrift) riskLevel = 'medium'
  else if (migrationsPending > 0) riskLevel = 'low'

  // Elevate risk if any migration has a high-risk score
  if (riskLevel !== 'high') {
    const maxScore = Math.max(0, ...migrations.map((m) => m.riskScore.score))
    if (maxScore >= 50) riskLevel = 'high'
    else if (maxScore >= 20 && riskLevel === 'low') riskLevel = 'medium'
  }

  return {
    connected,
    migrationsApplied: connected ? migrationsApplied : 0,
    migrationsPending: connected ? migrationsPending : migrations.length,
    migrationsFailed,
    driftDetected: hasDrift,
    driftCount: driftResult.items.length,
    riskLevel,
    lastSync: new Date().toISOString(),
    ...(project.provider ? { provider: project.provider } : {}),
    schemaPath: project.schemaPath,
  }
}
