import { Hono } from 'hono'
import { getProjectStatus } from '../../core/migration-analyzer.js'

type Variables = { projectPath: string; requestId: string }

const app = new Hono<{ Variables: Variables }>()

app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const status = await getProjectStatus(projectPath)
    return c.json({ success: true, data: status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
