import { Hono } from 'hono'
import { getMigrations } from '../../core/migration-analyzer.js'
import { detectPrismaProject } from '../../core/prisma-detector.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/risks — return risk scores for all migrations */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) {
      return c.json({ success: false, error: 'No Prisma project found' }, 404)
    }
    const migrations = await getMigrations(projectPath)
    const risks = migrations.map((m) => ({
      name: m.name,
      timestamp: m.timestamp,
      riskScore: m.riskScore,
    }))
    return c.json({ success: true, data: risks })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

/** GET /api/risks/:migration — risk score for a single migration */
app.get('/:migration', async (c) => {
  const projectPath = c.get('projectPath') as string
  const migrationQuery = c.req.param('migration')
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const migrations = await getMigrations(projectPath)
    const match = migrations.find(
      (m) => m.name === migrationQuery || m.name.startsWith(migrationQuery),
    )
    if (!match) return c.json({ success: false, error: 'Migration not found' }, 404)

    return c.json({ success: true, data: match.riskScore })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
