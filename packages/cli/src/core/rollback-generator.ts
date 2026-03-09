/**
 * Rollback Generator — produces SQL to undo a previously applied migration.
 *
 * Strategy:
 *  1. Parse forward SQL statements
 *  2. For each reversible statement, emit its inverse
 *  3. Return in reverse order (undo last statement first)
 *
 * Limitations (documented):
 *  - DROP TABLE is irreversible without a schema snapshot
 *  - TRUNCATE / DELETE are irreversible without data backups
 *  - We mark these as "manual" steps in the plan
 */

import fs from 'node:fs/promises'
import type { RollbackPlan, RollbackStep } from '@prisma-flow/shared'
import { RollbackError } from '@prisma-flow/shared'
import { splitStatements } from './simulator.js'

// ─────────────────────────────────────────────────────────────────────────────
// Statement inverter
// ─────────────────────────────────────────────────────────────────────────────

function invertStatement(sql: string): { sql: string; automated: boolean; warning?: string } {
  const trimmed = sql.trim()

  // CREATE TABLE → DROP TABLE IF EXISTS
  const createTable = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i)
  if (createTable) {
    return {
      sql: `DROP TABLE IF EXISTS "${createTable[1]}";`,
      automated: true,
    }
  }

  // CREATE INDEX → DROP INDEX
  const createIndex = trimmed.match(
    /^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i,
  )
  if (createIndex) {
    return {
      sql: `DROP INDEX IF EXISTS "${createIndex[1]}";`,
      automated: true,
    }
  }

  // ALTER TABLE … ADD COLUMN → ALTER TABLE … DROP COLUMN
  const addColumn = trimmed.match(
    /^ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD\s+COLUMN\s+["'`]?(\w+)["'`]?/i,
  )
  if (addColumn) {
    return {
      sql: `ALTER TABLE "${addColumn[1]}" DROP COLUMN "${addColumn[2]}";`,
      automated: true,
    }
  }

  // ALTER TABLE … DROP COLUMN — irreversible
  const dropColumn = trimmed.match(
    /^ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+DROP\s+COLUMN\s+["'`]?(\w+)["'`]?/i,
  )
  if (dropColumn) {
    return {
      sql: `-- MANUAL: Restore column "${dropColumn[2]}" on table "${dropColumn[1]}" from backup`,
      automated: false,
      warning: `DROP COLUMN is irreversible — column "${dropColumn[2]}" data is lost unless backed up`,
    }
  }

  // ALTER TABLE … ADD CONSTRAINT → ALTER TABLE … DROP CONSTRAINT
  const addConstraint = trimmed.match(
    /^ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD\s+CONSTRAINT\s+["'`]?(\w+)["'`]?/i,
  )
  if (addConstraint) {
    return {
      sql: `ALTER TABLE "${addConstraint[1]}" DROP CONSTRAINT "${addConstraint[2]}";`,
      automated: true,
    }
  }

  // DROP TABLE — irreversible
  const dropTable = trimmed.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i)
  if (dropTable) {
    return {
      sql: `-- MANUAL: Recreate table "${dropTable[1]}" and restore data from backup`,
      automated: false,
      warning: `DROP TABLE is irreversible — table "${dropTable[1]}" and all its data are gone unless backed up`,
    }
  }

  // TRUNCATE — irreversible
  if (/^TRUNCATE/i.test(trimmed)) {
    return {
      sql: '-- MANUAL: Restore truncated rows from backup',
      automated: false,
      warning: 'TRUNCATE is irreversible — all rows are deleted',
    }
  }

  // DELETE — irreversible
  if (/^DELETE\s+FROM/i.test(trimmed)) {
    return {
      sql: '-- MANUAL: Restore deleted rows from backup',
      automated: false,
      warning: 'DELETE is irreversible — rows are gone unless backed up',
    }
  }

  // INSERT — inverse is DELETE (we don't know which rows)
  if (/^INSERT\s+INTO/i.test(trimmed)) {
    return {
      sql: '-- MANUAL: DELETE the rows inserted by this migration (unknown primary keys)',
      automated: false,
      warning: 'INSERT rollback requires knowing inserted primary keys',
    }
  }

  // UPDATE — irreversible without snapshot
  if (/^UPDATE\s+/i.test(trimmed)) {
    return {
      sql: '-- MANUAL: Restore original column values from backup',
      automated: false,
      warning: 'UPDATE rollback requires a snapshot of pre-update values',
    }
  }

  // Unrecognised — flag as manual
  return {
    sql: `-- MANUAL: Undo: ${trimmed.slice(0, 80)}`,
    automated: false,
    warning: 'Unrecognised statement — manual rollback required',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a rollback plan for a single migration SQL file.
 */
export async function generateRollbackPlan(
  migrationName: string,
  sqlFilePath: string,
): Promise<RollbackPlan> {
  let sql: string
  try {
    sql = await fs.readFile(sqlFilePath, 'utf-8')
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    throw new RollbackError(migrationName, `Cannot read SQL file: ${error.message}`)
  }

  const statements = splitStatements(sql)
  const steps: RollbackStep[] = []

  // Process forward statements and collect inverse steps
  for (let i = 0; i < statements.length; i++) {
    const fwd = statements[i]
    if (!fwd) continue
    const inv = invertStatement(fwd)
    steps.push({
      index: i,
      forwardSql: fwd,
      rollbackSql: inv.sql,
      automated: inv.automated,
      ...(inv.warning !== undefined ? { warning: inv.warning } : {}),
    })
  }

  // Reverse so we undo the last operation first
  const reversedSteps = [...steps].reverse()

  const manualSteps = reversedSteps.filter((s) => !s.automated)
  const hasManualSteps = manualSteps.length > 0
  const warnings = reversedSteps.flatMap((s) => (s.warning ? [s.warning] : []))

  return {
    migrationName,
    steps: reversedSteps,
    hasManualSteps,
    warnings,
    generatedAt: new Date().toISOString(),
    automated: !hasManualSteps,
  }
}

/**
 * Return the full rollback SQL as a string (automated steps only unless includeManual=true).
 */
export function renderRollbackSql(plan: RollbackPlan, includeManual = true): string {
  const header = [
    `-- Rollback plan for migration: ${plan.migrationName}`,
    `-- Generated at: ${plan.generatedAt}`,
    `-- Steps: ${plan.steps.length} (${plan.hasManualSteps ? 'contains MANUAL steps' : 'fully automated'})`,
    plan.warnings.length > 0
      ? `-- Warnings:\n${plan.warnings.map((w) => `--   ! ${w}`).join('\n')}`
      : null,
    '',
  ]
    .filter(Boolean)
    .join('\n')

  const body = plan.steps
    .filter((s) => includeManual || s.automated)
    .map((s) => s.rollbackSql)
    .join('\n')

  return `${header}${body}`
}
