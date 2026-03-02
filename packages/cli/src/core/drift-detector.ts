import { execFile } from 'child_process'
import { promisify } from 'util'
import { detectPrismaProject } from './prisma-detector.js'
import { logger } from '../logger.js'

const execFileAsync = promisify(execFile)

export interface DriftItem {
  sql: string
  type: 'table-missing' | 'table-extra' | 'column-mismatch' | 'index-change' | 'constraint-change' | 'unknown'
  description: string
}

export function classifyDriftSql(sql: string): DriftItem['type'] {
  const upper = sql.toUpperCase().trimStart()
  if (upper.startsWith('CREATE TABLE')) return 'table-missing'
  if (upper.startsWith('DROP TABLE')) return 'table-extra'
  if (upper.startsWith('CREATE INDEX') || upper.startsWith('DROP INDEX')) return 'index-change'
  if (upper.startsWith('ALTER INDEX')) return 'index-change'
  // Check CONSTRAINT before generic ALTER TABLE so "ALTER TABLE ... ADD CONSTRAINT ..."
  // is classified as a constraint change, not a column mismatch.
  if (upper.includes('CONSTRAINT')) return 'constraint-change'
  if (upper.startsWith('ALTER TABLE')) return 'column-mismatch'
  return 'unknown'
}

function labelDriftType(type: DriftItem['type']): string {
  const labels: Record<DriftItem['type'], string> = {
    'table-missing':    'Table missing in database',
    'table-extra':      'Table exists in database but not in schema',
    'column-mismatch':  'Column or table structure mismatch',
    'index-change':     'Index difference detected',
    'constraint-change':'Constraint difference detected',
    'unknown':          'Unknown schema change',
  }
  return labels[type]
}

/**
 * Parse SQL diff output into individual statements, correctly handling
 * semicolons inside string literals and line/block comments.
 */
export function parseSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingleQuote = false
  let inLineComment = false
  let inBlockComment = false
  let i = 0

  while (i < sql.length) {
    const ch = sql[i]!
    const next = sql[i + 1] ?? ''

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      i++
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i += 2 } else i++
      continue
    }
    if (!inSingleQuote && ch === '-' && next === '-') { inLineComment = true; i += 2; continue }
    if (!inSingleQuote && ch === '/' && next === '*') { inBlockComment = true; i += 2; continue }
    if (ch === "'" && !inBlockComment && !inLineComment) inSingleQuote = !inSingleQuote

    if (ch === ';' && !inSingleQuote) {
      const trimmed = current.trim()
      if (trimmed.length > 0) statements.push(trimmed)
      current = ''
      i++
      continue
    }
    current += ch
    i++
  }

  const trimmed = current.trim()
  if (trimmed.length > 0) statements.push(trimmed)
  return statements
}

/**
 * Detect schema drift by comparing the local Prisma schema model against the
 * live database datasource.  Uses execFile (NOT exec) with an explicit argument
 * array to prevent command injection via user-controlled schema paths.
 */
export async function detectDrift(cwd: string): Promise<DriftItem[]> {
  const project = await detectPrismaProject(cwd)
  if (!project) return []

  try {
    const { stdout } = await execFileAsync(
      'npx',
      [
        'prisma', 'migrate', 'diff',
        '--from-schema-datamodel', project.schemaPath,
        '--to-schema-datasource',  project.schemaPath,
        '--script',
      ],
      { cwd, timeout: 30_000 },
    )

    const output = stdout.trim()
    if (!output) return []

    return parseSqlStatements(output)
      .filter((s) => !s.toUpperCase().trimStart().startsWith('--'))
      .map((sql) => {
        const type = classifyDriftSql(sql)
        return { sql, type, description: labelDriftType(type) }
      })
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    const stderr = error.stderr ?? ''
    if (
      stderr.includes('P1001') ||
      stderr.includes("Can't reach database server") ||
      stderr.includes('Connection refused')
    ) {
      logger.debug('Drift detection skipped: database unreachable')
      return []
    }
    logger.warn({ err }, 'Drift detection failed')
    return []
  }
}
