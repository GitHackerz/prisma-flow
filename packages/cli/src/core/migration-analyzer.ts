import { exec } from 'child_process'
import util from 'util'
import { PrismaProject, detectPrismaProject, ProjectStatus } from './prisma-detector'
import { detectDrift } from './drift-detector'
import fs from 'fs/promises'
import path from 'path'

const execAsync = util.promisify(exec)

export async function getMigrationDetails(cwd: string, name: string) {
    const project = await detectPrismaProject(cwd)
    if (!project) return null
    
    const migration = project.migrations.find(m => m.name === name)
    if (!migration) return null
    
    // Read SQL content
    let sql = ''
    try {
        sql = await fs.readFile(migration.sqlPath, 'utf-8')
    } catch {
        sql = '-- Could not read migration file'
    }
    
    // Analyze risks
    const risks = []
    const upSql = sql.toUpperCase()
    if (upSql.includes('DROP TABLE')) risks.push('Drops Table')
    if (upSql.includes('DROP COLUMN')) risks.push('Drops Column')
    if (upSql.includes('ALTER TABLE')) risks.push('Alters Table')
    if (upSql.includes('DELETE FROM')) risks.push('Deletes Data')

    return {
        ...migration,
        sql,
        risks
    }
}

async function getMigrationStatusMap(cwd: string, schemaPath: string): Promise<Map<string, 'applied' | 'pending' | 'failed'>> {
    const map = new Map<string, 'applied' | 'pending' | 'failed'>()
    
    try {
        // If this succeeds, all migrations are applied
        await execAsync(`npx prisma migrate status --schema="${schemaPath}"`, { cwd })
        return map // all default to applied in the caller logic if we change the default
    } catch (e: any) {
        const stdout = e.stdout || ''
        
        // Parse pending migrations
        if (stdout.includes('have not yet been applied')) {
            const lines = stdout.split('\n')
            let capturing = false
            for (const line of lines) {
                if (line.includes('have not yet been applied')) {
                    capturing = true
                    continue
                }
                if (capturing) {
                    const trimmed = line.trim()
                    if (!trimmed) continue
                    if (trimmed.includes('More information')) break
                    
                    // The line is usually the migration name
                    map.set(trimmed, 'pending')
                }
            }
        }
        
        // Parse failed migrations (if any - prisma usually stops at the first failed one)
        // "Migration X failed"
        // TODO: Handle failed state parsing if needed
    }
    return map
}

export async function getMigrations(cwd: string) {
    const project = await detectPrismaProject(cwd)
    if (!project) return []
    
    const statusMap = await getMigrationStatusMap(cwd, project.schemaPath)
    
    return project.migrations.map(m => {
        const status = statusMap.get(m.name) || 'applied'
        return {
            ...m,
            status: status
        }
    })
}

export async function getProjectStatus(cwd: string): Promise<ProjectStatus> {
    const project = await detectPrismaProject(cwd)
    if (!project) {
        throw new Error('No Prisma project found')
    }

    let connected = false
    let hasDrift = false
    
    // Check connection first
    try {
        // Simple connection check using version or just list
        // Using migrate status --exit-code could be better but 'migrate status' is fine
        await execAsync(`npx prisma migrate status --schema="${project.schemaPath}"`, { cwd })
        connected = true
    } catch (e: any) {
        if (e.message.includes('Can\'t reach database server') || (e.stdout && e.stdout.includes('P1001'))) {
            connected = false
        } else {
            // If it failed but NOT because of connection (e.g. pending migrations), we are still connected
            connected = true
        }
    }

    const migrations = await getMigrations(cwd)
    
    const pendingCount = migrations.filter(m => m.status === 'pending').length
    const failedCount = migrations.filter(m => m.status === 'failed').length
    const appliedCount = migrations.filter(m => m.status === 'applied').length

    // Detect drift if connected
    if (connected) {
        try {
            const drift = await detectDrift(cwd)
            // If we have pending migrations, migrate diff might just be showing those.
            // But we consider it drift if there are changes.
            // A clearer definition of drift is "Changes in DB that are NOT in Schema" OR "Changes in Schema NOT in DB" (which is pending).
            // For now, if drift array > 0, we flag it.
            // But if there IS real drift (extra table) AND pending migration, we want to know.
            // It's hard to distinguish without parsing the SQL.
            
            // For MVP:
            hasDrift = drift.length > 0 && pendingCount === 0;
            
        } catch (e) {
            // ignore drift check error
        }
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (failedCount > 0) riskLevel = 'high'
    if (hasDrift) riskLevel = 'medium'

    return {
        connected,
        appliedCount: connected ? appliedCount : 0,
        pendingCount: connected ? pendingCount : migrations.length,
        failedCount,
        hasDrift,
        riskLevel,
        lastSync: new Date()
    }
}