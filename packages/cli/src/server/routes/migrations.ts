import { Hono } from 'hono'
import { getMigrationDetails, getMigrations } from '../../core/migration-analyzer.js'

type Variables = { projectPath: string; requestId: string }

const app = new Hono<{ Variables: Variables }>()

// GET /api/migrations?page=1&limit=20
app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, Number.parseInt(c.req.query('limit') ?? '20', 10)))

    const all = await getMigrations(projectPath)
    const total = all.length
    const start = (page - 1) * limit
    const items = all.slice(start, start + limit)

    return c.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

// GET /api/migrations/:name
app.get('/:name', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const name = c.req.param('name')
    const migration = await getMigrationDetails(projectPath, name)

    if (!migration) {
      return c.json({ success: false, error: 'Migration not found' }, 404)
    }

    return c.json({ success: true, data: migration })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
