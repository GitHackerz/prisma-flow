import { Hono } from 'hono'
import { buildDeploymentPlan } from '../../core/deployment-plan.js'

type Variables = { projectPath: string; requestId: string }

const app = new Hono<{ Variables: Variables }>()

app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const plan = await buildDeploymentPlan(projectPath)
    return c.json({ success: true, data: plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
