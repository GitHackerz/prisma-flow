import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

export interface Migration {
  name: string;
  timestamp: Date;
  status: 'applied' | 'pending' | 'failed';
  sqlPath: string;
}

export interface PrismaProject {
  schemaPath: string;
  migrationsPath: string;
  databaseUrl: string;
  migrations: Migration[];
  schemaContent: string;
}

export async function detectPrismaProject(cwd: string): Promise<PrismaProject | null> {
  // 1. Look for schema.prisma
  const possiblePaths = [
    path.join(cwd, 'prisma', 'schema.prisma'),
    path.join(cwd, 'schema.prisma')
  ]

  let schemaPath = ''
  for (const p of possiblePaths) {
    try {
      await fs.access(p)
      schemaPath = p
      break
    } catch {
      continue
    }
  }

  if (!schemaPath) {
    return null
  }

  // 2. Read schema content
  const schemaContent = await fs.readFile(schemaPath, 'utf-8')

  // 3. Find .env and Database URL
  let databaseUrl = ''
  try {
    const envPath = path.join(cwd, '.env')
    const envContent = await fs.readFile(envPath, 'utf-8')
    const envConfig = dotenv.parse(envContent)
    
    // Naive check for DATABASE_URL in schema or just pick from env
    // Usually schema has `env("DATABASE_URL")`
    // We'll just grab DATABASE_URL from .env for now
    databaseUrl = envConfig.DATABASE_URL || ''
  } catch (e) {
    // .env might not exist or readable
  }

  // 4. List migrations
  const migrationsPath = path.join(path.dirname(schemaPath), 'migrations')
  let migrations: Migration[] = []

  try {
    const entries = await fs.readdir(migrationsPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'migration_lock.toml') {
        const migrationPath = path.join(migrationsPath, entry.name)
        const sqlPath = path.join(migrationPath, 'migration.sql')
        
        try {
            await fs.access(sqlPath)
            // Name format: YYYYMMDDHHMMSS_name
            const parts = entry.name.split('_')
            const timestampStr = parts[0]
            // Basic parsing
            const year = parseInt(timestampStr.slice(0, 4))
            const month = parseInt(timestampStr.slice(4, 6)) - 1
            const day = parseInt(timestampStr.slice(6, 8))
            const hour = parseInt(timestampStr.slice(8, 10))
            const minute = parseInt(timestampStr.slice(10, 12))
            const second = parseInt(timestampStr.slice(12, 14))
            
            const timestamp = new Date(Date.UTC(year, month, day, hour, minute, second))
            
            migrations.push({
                name: entry.name,
                timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
                status: 'pending', // Default to pending, status analyzer will fix
                sqlPath: sqlPath
            })
        } catch {
            // Not a valid migration folder
        }
      }
    }
  } catch (e) {
    // Migrations folder might not exist
  }
  
  // Sort by timestamp desc
  migrations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    schemaPath,
    migrationsPath,
    databaseUrl,
    migrations,
    schemaContent
  }
}

export interface ProjectStatus {
    connected: boolean;
    appliedCount: number;
    pendingCount: number;
    failedCount: number;
    hasDrift: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    lastSync: Date;
}
