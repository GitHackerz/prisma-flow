import fs from 'node:fs/promises'
import path from 'node:path'
import type { DatabaseProvider, Migration } from '@prisma-flow/shared'
import dotenv from 'dotenv'

export type { Migration }

export interface PrismaProject {
  schemaPath: string
  migrationsPath: string
  databaseUrl: string
  migrations: Migration[]
  schemaContent: string
  provider: DatabaseProvider | null
}

/**
 * Parse the database provider from the Prisma schema `datasource` block.
 */
function detectProviderFromSchema(schemaContent: string): DatabaseProvider | null {
  const match = schemaContent.match(/datasource\s+\w+\s*\{[^}]*provider\s*=\s*"([^"]+)"/s)
  if (!match) return null
  const raw = match[1]?.toLowerCase()
  const providerMap: Record<string, DatabaseProvider> = {
    postgresql: 'postgresql',
    postgres: 'postgresql',
    mysql: 'mysql',
    sqlite: 'sqlite',
    sqlserver: 'sqlserver',
    mongodb: 'mongodb',
  }
  return providerMap[raw ?? ''] ?? null
}

async function tryAccess(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function findSchemaPath(cwd: string): Promise<string | null> {
  // Standard locations (Prisma 5.15+ supports prisma/schema/ directory)
  const candidates = [path.join(cwd, 'prisma', 'schema.prisma'), path.join(cwd, 'schema.prisma')]

  for (const p of candidates) {
    if (await tryAccess(p)) return p
  }

  // Multi-file schema directory (Prisma >= 5.15)
  const schemaDir = path.join(cwd, 'prisma', 'schema')
  if (await tryAccess(schemaDir)) {
    const entries = await fs.readdir(schemaDir).catch(() => [] as string[])
    const prismaFiles = entries.filter((e) => e.endsWith('.prisma'))
    if (prismaFiles.length > 0) {
      // Return the directory itself — callers must concatenate files for getDMMF
      return schemaDir
    }
  }

  return null
}

/**
 * Read the schema content — handles both single-file and multi-file schemas.
 */
async function readSchemaContent(schemaPath: string): Promise<string> {
  try {
    const stat = await fs.stat(schemaPath)
    if (stat.isDirectory()) {
      const files = (await fs.readdir(schemaPath)).filter((f) => f.endsWith('.prisma')).sort()
      const parts = await Promise.all(
        files.map((f) => fs.readFile(path.join(schemaPath, f), 'utf-8')),
      )
      return parts.join('\n')
    }
    return fs.readFile(schemaPath, 'utf-8')
  } catch {
    return ''
  }
}

export async function detectPrismaProject(cwd: string): Promise<PrismaProject | null> {
  const schemaPath = await findSchemaPath(cwd)
  if (!schemaPath) return null

  const schemaContent = await readSchemaContent(schemaPath)

  // Read DATABASE_URL from .env — try project root first, then cwd/.env
  let databaseUrl = ''
  for (const envFile of [path.join(cwd, '.env'), path.join(cwd, 'prisma', '.env')]) {
    try {
      const envContent = await fs.readFile(envFile, 'utf-8')
      const parsed = dotenv.parse(envContent)
      if (parsed.DATABASE_URL) {
        databaseUrl = parsed.DATABASE_URL
        break
      }
    } catch {
      /* no .env — that is fine */
    }
  }

  // Determine migrations directory relative to schema
  const schemaDir = (await fs
    .stat(schemaPath)
    .then((s) => s.isDirectory())
    .catch(() => false))
    ? schemaPath
    : path.dirname(schemaPath)
  const migrationsPath = path.join(schemaDir, 'migrations')

  const migrations: Migration[] = []

  try {
    const entries = await fs.readdir(migrationsPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'migration_lock.toml') continue

      const migrationDir = path.join(migrationsPath, entry.name)
      const sqlPath = path.join(migrationDir, 'migration.sql')

      if (!(await tryAccess(sqlPath))) continue

      // Migration directory format: YYYYMMDDHHMMSS_description
      const timestampStr = entry.name.slice(0, 14)
      const year = Number.parseInt(timestampStr.slice(0, 4), 10)
      const month = Number.parseInt(timestampStr.slice(4, 6), 10) - 1
      const day = Number.parseInt(timestampStr.slice(6, 8), 10)
      const hour = Number.parseInt(timestampStr.slice(8, 10), 10)
      const minute = Number.parseInt(timestampStr.slice(10, 12), 10)
      const second = Number.parseInt(timestampStr.slice(12, 14), 10)

      const timestamp = new Date(Date.UTC(year, month, day, hour, minute, second))

      migrations.push({
        name: entry.name,
        timestamp: (Number.isNaN(timestamp.getTime()) ? new Date() : timestamp).toISOString(),
        status: 'pending', // overridden by getMigrations() after status check
        sqlPath,
      })
    }
  } catch {
    /* migrations folder may not exist yet */
  }

  // Sort ascending by timestamp (oldest first) so callers can reverse if needed
  migrations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const provider = detectProviderFromSchema(schemaContent)

  return { schemaPath, migrationsPath, databaseUrl, migrations, schemaContent, provider }
}
