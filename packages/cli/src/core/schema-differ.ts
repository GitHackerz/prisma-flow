/**
 * Schema Differ — produce a human-readable and structured diff between
 * two Prisma schema files (or the current schema vs the DB state via `prisma migrate diff`).
 *
 * Outputs a list of `SchemaDiff` items describing each model/field change.
 */

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { promisify } from 'node:util'
import type { SchemaDiff, SchemaDiffType } from '@prisma-flow/shared'

const execAsync = promisify(execFile)

// ─────────────────────────────────────────────────────────────────────────────
// Prisma schema text parser (lightweight — regex-based, not full AST)
// ─────────────────────────────────────────────────────────────────────────────

interface ModelField {
  name: string
  type: string
  modifiers: string[]
}

interface ParsedModel {
  name: string
  fields: ModelField[]
}

function parseModels(schema: string): Map<string, ParsedModel> {
  const models = new Map<string, ParsedModel>()

  // Match each model block
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = modelRegex.exec(schema)) !== null) {
    const [, modelName, body] = match
    if (!modelName || !body) continue

    const fields: ModelField[] = []
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      // Skip blank lines and decorators
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@')) continue

      const parts = trimmed.split(/\s+/)
      if (!parts[0] || !parts[1]) continue
      // Skip prisma directives like @@...
      if (parts[0].startsWith('@@')) continue

      fields.push({
        name: parts[0],
        type: parts[1],
        modifiers: parts.slice(2),
      })
    }

    models.set(modelName, { name: modelName, fields })
  }

  return models
}

// ─────────────────────────────────────────────────────────────────────────────
// Differ
// ─────────────────────────────────────────────────────────────────────────────

export function diffSchemaText(beforeSchema: string, afterSchema: string): SchemaDiff[] {
  const before = parseModels(beforeSchema)
  const after = parseModels(afterSchema)

  const diffs: SchemaDiff[] = []

  // Models added
  for (const [name] of after) {
    if (!before.has(name)) {
      diffs.push({
        type: 'model_added' as SchemaDiffType,
        modelName: name,
        description: `Model "${name}" added`,
        breaking: false,
      })
    }
  }

  // Models removed
  for (const [name] of before) {
    if (!after.has(name)) {
      diffs.push({
        type: 'model_removed' as SchemaDiffType,
        modelName: name,
        description: `Model "${name}" removed — all data will be lost`,
        breaking: true,
      })
    }
  }

  // Field-level diffs for shared models
  for (const [name, afterModel] of after) {
    const beforeModel = before.get(name)
    if (!beforeModel) continue

    const beforeFields = new Map(beforeModel.fields.map((f) => [f.name, f]))
    const afterFields = new Map(afterModel.fields.map((f) => [f.name, f]))

    // Fields added
    for (const [fieldName, field] of afterFields) {
      if (!beforeFields.has(fieldName)) {
        const isRequired = !field.type.endsWith('?') && !field.modifiers.includes('?')
        diffs.push({
          type: 'field_added' as SchemaDiffType,
          modelName: name,
          fieldName,
          newType: field.type,
          description: `Field "${name}.${fieldName}" (${field.type}) added`,
          breaking: isRequired, // required field on existing table = breaking
        })
      }
    }

    // Fields removed
    for (const [fieldName, field] of beforeFields) {
      if (!afterFields.has(fieldName)) {
        diffs.push({
          type: 'field_removed' as SchemaDiffType,
          modelName: name,
          fieldName,
          oldType: field.type,
          description: `Field "${name}.${fieldName}" (${field.type}) removed — data will be lost`,
          breaking: true,
        })
      }
    }

    // Fields changed
    for (const [fieldName, afterField] of afterFields) {
      const beforeField = beforeFields.get(fieldName)
      if (!beforeField) continue

      if (beforeField.type !== afterField.type) {
        diffs.push({
          type: 'field_type_changed' as SchemaDiffType,
          modelName: name,
          fieldName,
          oldType: beforeField.type,
          newType: afterField.type,
          description: `Field "${name}.${fieldName}" type changed: ${beforeField.type} → ${afterField.type}`,
          breaking: true,
        })
      }
    }
  }

  return diffs
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Diff two schema files on disk.
 */
export async function diffSchemaFiles(
  beforePath: string,
  afterPath: string,
): Promise<SchemaDiff[]> {
  const [before, after] = await Promise.all([
    fs.readFile(beforePath, 'utf-8'),
    fs.readFile(afterPath, 'utf-8'),
  ])
  return diffSchemaText(before, after)
}

/**
 * Use `prisma migrate diff` to get the SQL diff between the schema file and
 * the live database, then parse it into SchemaDiff items.
 */
export async function diffSchemaVsDatabase(
  schemaPath: string,
  databaseUrl: string,
  cwd: string,
): Promise<{ sql: string; diffs: SchemaDiff[] }> {
  const env = { ...process.env, DATABASE_URL: databaseUrl }

  try {
    const { stdout } = await execAsync(
      'npx',
      [
        'prisma',
        'migrate',
        'diff',
        '--from-schema-datamodel',
        schemaPath,
        '--to-database-url',
        databaseUrl,
        '--script',
      ],
      { cwd, env, timeout: 30_000 },
    )

    // Parse the SQL diff output into structured diffs
    const diffs = parseSqlDiff(stdout)
    return { sql: stdout, diffs }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    // If exit code indicates no diff, return empty
    if ('stdout' in (err as object)) {
      const stdout = (err as { stdout: string }).stdout ?? ''
      if (stdout.includes('The migration is empty')) {
        return { sql: '', diffs: [] }
      }
    }
    throw error
  }
}

/**
 * Parse SQL output from `prisma migrate diff --script` into SchemaDiff items.
 */
function parseSqlDiff(sql: string): SchemaDiff[] {
  const diffs: SchemaDiff[] = []

  for (const line of sql.split('\n')) {
    const trimmed = line.trim()

    const dropTable = trimmed.match(/DROP TABLE\s+"?(\w+)"?/i)
    if (dropTable) {
      diffs.push({
        type: 'model_removed',
        modelName: dropTable[1] ?? 'unknown',
        description: `Table "${dropTable[1]}" will be dropped`,
        breaking: true,
      })
      continue
    }

    const createTable = trimmed.match(/CREATE TABLE\s+"?(\w+)"?/i)
    if (createTable) {
      diffs.push({
        type: 'model_added',
        modelName: createTable[1] ?? 'unknown',
        description: `Table "${createTable[1]}" will be created`,
        breaking: false,
      })
      continue
    }

    const addColumn = trimmed.match(/ALTER TABLE\s+"?(\w+)"?\s+ADD COLUMN\s+"?(\w+)"?\s+(\w+)/i)
    if (addColumn) {
      diffs.push({
        type: 'field_added',
        modelName: addColumn[1] ?? 'unknown',
        fieldName: addColumn[2] ?? 'unknown',
        newType: addColumn[3] ?? 'unknown',
        description: `Column "${addColumn[2]}" added to "${addColumn[1]}"`,
        breaking: false,
      })
      continue
    }

    const dropColumn = trimmed.match(/ALTER TABLE\s+"?(\w+)"?\s+DROP COLUMN\s+"?(\w+)"?/i)
    if (dropColumn) {
      diffs.push({
        type: 'field_removed',
        modelName: dropColumn[1] ?? 'unknown',
        fieldName: dropColumn[2] ?? 'unknown',
        description: `Column "${dropColumn[2]}" dropped from "${dropColumn[1]}" — data lost`,
        breaking: true,
      })
    }
  }

  return diffs
}
