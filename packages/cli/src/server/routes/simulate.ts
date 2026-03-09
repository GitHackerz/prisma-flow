import path from 'node:path'
import { Hono } from 'hono'
import { detectPrismaProject } from '../../core/prisma-detector.js'
import { simulate } from '../../core/simulator.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/simulate/:migration — dry-run a migration */
app.get('/:migration', async (c) => {
  const projectPath = c.get('projectPath') as string
  const migrationQuery = c.req.param('migration')
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const match = project.migrations.find(
      (m) => m.name === migrationQuery || m.name.startsWith(migrationQuery),
    )
    if (!match) return c.json({ success: false, error: 'Migration not found' }, 404)

    const sqlFile = path.join(project.migrationsPath, match.name, 'migration.sql')
    const dbPath =
      project.provider === 'sqlite' && project.databaseUrl
        ? project.databaseUrl.replace(/^file:/, '')
        : undefined

    const result = await simulate(match.name, sqlFile, dbPath)
    return c.json({ success: true, data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
