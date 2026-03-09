import { Hono } from 'hono'
import { detectPrismaProject } from '../../core/prisma-detector.js'
import { diffSchemaVsDatabase } from '../../core/schema-differ.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/diff — schema diff between prisma schema and live database */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const dbUrl = c.req.query('url') ?? project.databaseUrl ?? process.env.DATABASE_URL
    if (!dbUrl) {
      return c.json({ success: false, error: 'No database URL available' }, 400)
    }

    const breakingOnly = c.req.query('breaking') === 'true'
    const { sql, diffs } = await diffSchemaVsDatabase(project.schemaPath, dbUrl, projectPath)
    const filtered = breakingOnly ? diffs.filter((d) => d.breaking) : diffs

    return c.json({
      success: true,
      data: {
        diffs: filtered,
        totalDiffs: diffs.length,
        breakingDiffs: diffs.filter((d) => d.breaking).length,
        hasSql: sql.length > 0,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
