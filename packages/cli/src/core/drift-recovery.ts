/**
 * Drift Recovery Engine — analyses database drift and produces actionable
 * repair suggestions.
 *
 * Sources of drift (from detectDrift):
 *  - Schema-only drift: column/table exists in DB but not in schema
 *  - Migration-only drift: migration in history but SQL not applied
 *
 * Recovery strategies:
 *  - APPLY_MIGRATION: run the missing migration
 *  - SQUASH: rebase drift into a new migration
 *  - MANUAL_SQL: provide raw SQL for user to run
 *  - IGNORE: documented, safe to ignore
 */

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import type { DriftItem, DriftRecoverySuggestion, DriftRepairStrategy } from '@prisma-flow/shared'
import { DriftRepairError } from '@prisma-flow/shared'

const execAsync = promisify(execFile)

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate repair suggestions for a list of drift items.
 */
export function generateRepairSuggestions(
  driftItems: DriftItem[],
  migrationsDir: string,
): DriftRecoverySuggestion[] {
  const suggestions: DriftRecoverySuggestion[] = []

  for (const item of driftItems) {
    const strategy = pickStrategy(item)
    const repairSql = generateRepairSql(item, strategy)
    suggestions.push({
      driftItem: item,
      strategy,
      description: describeStrategy(item, strategy),
      ...(repairSql !== undefined ? { sql: repairSql } : {}),
      automated: strategy !== 'MANUAL_SQL',
      risk: assessRisk(item),
    })
  }

  return suggestions
}

function pickStrategy(item: DriftItem): DriftRepairStrategy {
  switch (item.type) {
    case 'missing_migration':
      return 'APPLY_MIGRATION'
    case 'extra_column':
    case 'extra_table':
      // Extra objects in DB — could squash or ignore
      return 'SQUASH'
    case 'modified_migration':
      // Migration SQL was changed after apply — complex
      return 'MANUAL_SQL'
    default:
      return 'MANUAL_SQL'
  }
}

function describeStrategy(item: DriftItem, strategy: DriftRepairStrategy): string {
  switch (strategy) {
    case 'APPLY_MIGRATION':
      return `Apply missing migration "${item.migrationName ?? item.identifier}" to the database`
    case 'SQUASH':
      return `Create a new migration that incorporates the "${item.identifier}" drift (extra ${item.type.replace('extra_', '')} in DB)`
    case 'MANUAL_SQL':
      return `Manually review and apply SQL to reconcile "${item.identifier}" — automated repair not safe`
    case 'IGNORE':
      return `"${item.identifier}" is safe to ignore (documentation-only drift)`
    default:
      return `Review drift for "${item.identifier}"`
  }
}

function generateRepairSql(item: DriftItem, strategy: DriftRepairStrategy): string | undefined {
  if (strategy === 'APPLY_MIGRATION' && item.migrationName) {
    return `-- Run: npx prisma migrate resolve --applied "${item.migrationName}"`
  }

  if (strategy === 'SQUASH' && item.type === 'extra_table') {
    return `-- Extra table detected. To squash into schema:\n-- 1. Add the model to prisma/schema.prisma\n-- 2. Run: npx prisma migrate dev --name squash_${item.identifier}`
  }

  if (strategy === 'SQUASH' && item.type === 'extra_column') {
    const identifier = item.identifier ?? 'unknown.unknown'
    const [table, column] = identifier.split('.')
    return `-- Extra column ${column} on ${table}. To squash:\n-- 1. Add field to model in prisma/schema.prisma\n-- 2. Run: npx prisma migrate dev --name squash_${column}_on_${table}`
  }

  if (item.sql) {
    return `-- Suggested SQL (review carefully before running):\n${item.sql}`
  }

  return undefined
}

function assessRisk(item: DriftItem): 'low' | 'medium' | 'high' {
  if (item.type === 'modified_migration') return 'high'
  if (item.type === 'extra_table') return 'medium'
  if (item.type === 'extra_column') return 'low'
  if (item.type === 'missing_migration') return 'medium'
  return 'medium'
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply repair (automated steps only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to auto-repair APPLY_MIGRATION drift items by running
 * `prisma migrate resolve --applied <name>`.
 *
 * Returns a report of successes and failures.
 */
export async function applyRepairs(
  suggestions: DriftRecoverySuggestion[],
  schemaPath: string,
  cwd: string,
): Promise<Array<{ migrationName: string; success: boolean; error?: string }>> {
  const results: Array<{ migrationName: string; success: boolean; error?: string }> = []

  for (const suggestion of suggestions) {
    if (suggestion.strategy !== 'APPLY_MIGRATION') continue
    if (!suggestion.driftItem.migrationName) continue

    const name = suggestion.driftItem.migrationName
    try {
      await execAsync(
        'npx',
        ['prisma', 'migrate', 'resolve', '--applied', name, '--schema', schemaPath],
        { cwd, timeout: 30_000 },
      )
      results.push({ migrationName: name, success: true })
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      results.push({ migrationName: name, success: false, error: error.message })
    }
  }

  return results
}

/**
 * Generate a squash migration for SQUASH strategy items.
 * Copies missed SQL into a new timestamped migration.
 */
export async function generateSquashMigration(
  migrationsDir: string,
  driftItems: DriftItem[],
  migrationName = 'squash_drift',
): Promise<string> {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)

  const dirName = `${timestamp}_${migrationName}`
  const migDir = path.join(migrationsDir, dirName)

  try {
    await fs.mkdir(migDir, { recursive: true })

    const sqlLines = [
      `-- Squash migration generated by PrismaFlow at ${new Date().toISOString()}`,
      `-- Addresses ${driftItems.length} drift item(s)`,
      '',
    ]

    for (const item of driftItems) {
      sqlLines.push(`-- Drift: ${item.type} — ${item.identifier}`)
      if (item.sql) {
        sqlLines.push(item.sql)
        sqlLines.push('')
      } else {
        sqlLines.push(`-- TODO: Add SQL to reconcile "${item.identifier}"`)
        sqlLines.push('')
      }
    }

    const sqlPath = path.join(migDir, 'migration.sql')
    await fs.writeFile(sqlPath, sqlLines.join('\n'), 'utf-8')

    return sqlPath
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    throw new DriftRepairError(`Failed to generate squash migration: ${error.message}`, error)
  }
}
