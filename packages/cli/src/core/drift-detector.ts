import { exec } from 'child_process'
import util from 'util'
import { detectPrismaProject } from './prisma-detector'

const execAsync = util.promisify(exec)

export async function detectDrift(cwd: string) {
    const project = await detectPrismaProject(cwd)
    if (!project) return []
    
    try {
        // Compare schema with db
        // --from-schema-datamodel: The local schema
        // --to-schema-datasource: The live db
        // --script: Generate SQL script
        const { stdout } = await execAsync(`npx prisma migrate diff --from-schema-datamodel="${project.schemaPath}" --to-schema-datasource="${project.schemaPath}" --script`, { cwd })
        
        if (!stdout.trim()) return []
        
        // Return list of SQL statements
        // Basic split by semicolon, can be improved
        return stdout.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))
            .map(s => {
                // Add simple description based on SQL
                let type = 'unknown'
                if (s.toUpperCase().startsWith('CREATE TABLE')) type = 'Table Missing in DB'
                else if (s.toUpperCase().startsWith('DROP TABLE')) type = 'Table Extra in DB'
                else if (s.toUpperCase().startsWith('ALTER TABLE')) type = 'Column Mismatch'
                
                return {
                    sql: s,
                    type
                }
            })
    } catch (e) {
        // If connection fails, we can't detect drift
        // console.error(e)
        return []
    }
}
