import { Hono } from 'hono'
import { detectDrift } from '../../core/drift-detector.js'
import { applyRepairs, generateRepairSuggestions } from '../../core/drift-recovery.js'
import { detectPrismaProject } from '../../core/prisma-detector.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/repair — list repair suggestions for current drift */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const driftResult = await detectDrift(projectPath)
    if (driftResult.status === 'error') {
      return c.json(
        { success: false, error: driftResult.errorMessage ?? 'Drift detection failed' },
        502,
      )
    }

    const suggestions = generateRepairSuggestions(driftResult.items, project.migrationsPath)
    return c.json({
      success: true,
      data: { drifted: driftResult.status === 'drifted', suggestions },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

/** POST /api/repair — apply auto-repair steps */
app.post('/apply', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const driftResult = await detectDrift(projectPath)
    if (driftResult.status === 'error') {
      return c.json(
        { success: false, error: driftResult.errorMessage ?? 'Drift detection failed' },
        502,
      )
    }

    const suggestions = generateRepairSuggestions(driftResult.items, project.migrationsPath)
    const results = await applyRepairs(suggestions, project.schemaPath, projectPath)
    return c.json({ success: true, data: results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
