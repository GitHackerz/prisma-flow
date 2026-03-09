import fs from 'node:fs/promises'
import path from 'node:path'
import { Hono } from 'hono'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/audit — return audit log entries (most recent first) */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  const limit = Number.parseInt(c.req.query('limit') ?? '100', 10)

  try {
    const auditFile = path.join(projectPath, '.prismaflow', 'audit.jsonl')

    try {
      await fs.access(auditFile)
    } catch {
      return c.json({ success: true, data: [] })
    }

    const content = await fs.readFile(auditFile, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim().length > 0)

    const entries = lines
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .reverse()
      .slice(0, limit)

    return c.json({ success: true, data: entries })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
