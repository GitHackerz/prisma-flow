/**
 * Environment Comparator — compares migration state across named environments
 * (e.g. development vs staging vs production).
 *
 * Sources of truth:
 *  - Locally: read DATABASE_URL / per-env URLs from prismaflow.config.ts
 *  - Run `prisma migrate status --schema <schema>` per env
 *  - Diff applied migration lists
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { EnvironmentComparison, MigrationHistoryDiff } from '@prisma-flow/shared'
import { EnvironmentComparisonError } from '@prisma-flow/shared'

const execAsync = promisify(execFile)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse `prisma migrate status` output for applied/pending migration names.
 * Output format:
 *   Migrations history
 *   The following migrations have been applied:
 *     20230101000000_init
 *   The following migrations have not yet been applied:
 *     20230201000000_add_users
 */
function parseStatusOutput(output: string): {
  applied: string[]
  pending: string[]
  failed: string[]
} {
  const applied: string[] = []
  const pending: string[] = []
  const failed: string[] = []

  let section: 'applied' | 'pending' | 'failed' | null = null

  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (/have been applied/i.test(trimmed)) {
      section = 'applied'
      continue
    }
    if (/have not yet been applied/i.test(trimmed)) {
      section = 'pending'
      continue
    }
    if (/failed/i.test(trimmed)) {
      section = 'failed'
      continue
    }
    if (/^\d{14}_/.test(trimmed)) {
      if (section === 'applied') applied.push(trimmed)
      else if (section === 'pending') pending.push(trimmed)
      else if (section === 'failed') failed.push(trimmed)
    }
  }

  return { applied, pending, failed }
}

async function queryMigrationStatus(
  envName: string,
  databaseUrl: string,
  schemaPath: string,
  cwd: string,
): Promise<{ applied: string[]; pending: string[]; failed: string[]; reachable: boolean }> {
  try {
    const env = { ...process.env, DATABASE_URL: databaseUrl }
    const { stdout } = await execAsync(
      'npx',
      ['prisma', 'migrate', 'status', '--schema', schemaPath],
      { cwd, env, timeout: 30_000 },
    )
    return { ...parseStatusOutput(stdout), reachable: true }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    // Handle non-zero exit with parsed output (pending migrations)
    if ('stdout' in (err as object)) {
      const output = (err as { stdout: string }).stdout ?? ''
      if (output.length > 0) {
        return { ...parseStatusOutput(output), reachable: true }
      }
    }
    if (
      error.message.includes('P1001') ||
      error.message.includes('Connection refused') ||
      error.message.includes("Can't reach database server")
    ) {
      return { applied: [], pending: [], failed: [], reachable: false }
    }
    throw new EnvironmentComparisonError(envName, 'source', error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface EnvironmentState {
  name: string
  databaseUrl: string
  applied: string[]
  pending: string[]
  failed: string[]
  reachable: boolean
}

/**
 * Fetch migration states for all supplied environments.
 */
export async function fetchEnvironmentStates(
  environments: Array<{ name: string; databaseUrl: string }>,
  schemaPath: string,
  cwd: string,
): Promise<EnvironmentState[]> {
  const states: EnvironmentState[] = []

  for (const env of environments) {
    const status = await queryMigrationStatus(env.name, env.databaseUrl, schemaPath, cwd)
    states.push({ name: env.name, databaseUrl: env.databaseUrl, ...status })
  }

  return states
}

/**
 * Produce a diff between two environment migration states.
 */
export function diffEnvironments(
  source: EnvironmentState,
  target: EnvironmentState,
): MigrationHistoryDiff {
  const sourceSet = new Set(source.applied)
  const targetSet = new Set(target.applied)

  const onlyInSource = source.applied.filter((m) => !targetSet.has(m))
  const onlyInTarget = target.applied.filter((m) => !sourceSet.has(m))

  // Find divergence point — last common migration
  let divergencePoint: string | undefined
  for (let i = Math.min(source.applied.length, target.applied.length) - 1; i >= 0; i--) {
    if (source.applied[i] === target.applied[i]) {
      divergencePoint = source.applied[i]
      break
    }
  }

  return {
    sourceEnv: source.name,
    targetEnv: target.name,
    sourceApplied: source.applied.length,
    targetApplied: target.applied.length,
    onlyInSource,
    onlyInTarget,
    ...(divergencePoint !== undefined ? { divergencePoint } : {}),
    inSync: onlyInSource.length === 0 && onlyInTarget.length === 0,
  }
}

/**
 * Compare all environments against the first one (the "reference").
 * Returns a full EnvironmentComparison with per-pair diffs.
 */
export async function compareEnvironments(
  environments: Array<{ name: string; databaseUrl: string }>,
  schemaPath: string,
  cwd: string,
): Promise<EnvironmentComparison> {
  if (environments.length < 2) {
    throw new EnvironmentComparisonError(
      'configuration',
      'comparison',
      new Error('At least 2 environments are required for comparison'),
    )
  }

  const states = await fetchEnvironmentStates(environments, schemaPath, cwd)
  const reference = states[0]!

  const diffs: MigrationHistoryDiff[] = []
  for (let i = 1; i < states.length; i++) {
    diffs.push(diffEnvironments(reference, states[i]!))
  }

  const allInSync = diffs.every((d) => d.inSync)

  return {
    referenceEnv: reference.name,
    environments: states.map((s) => ({
      name: s.name,
      reachable: s.reachable,
      appliedCount: s.applied.length,
      pendingCount: s.pending.length,
      failedCount: s.failed.length,
    })),
    diffs,
    allInSync,
    comparedAt: new Date().toISOString(),
  }
}
