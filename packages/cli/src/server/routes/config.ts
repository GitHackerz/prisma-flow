import { Hono } from 'hono'
import { getConfigSync } from '../../core/config-loader.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/config — return current resolved config (non-sensitive fields only) */
app.get('/', (c) => {
  try {
    const config = getConfigSync()

    // Strip sensitive fields before sending to browser
    const { webhooks: _webhooks, environments: _environments, ...safeConfig } = config

    return c.json({ success: true, data: safeConfig })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
