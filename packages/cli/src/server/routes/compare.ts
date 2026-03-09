import { Hono } from 'hono'
import { getConfig } from '../../core/config-loader.js'
import { compareEnvironments } from '../../core/env-comparator.js'
import { detectPrismaProject } from '../../core/prisma-detector.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/compare — compare environments defined in config */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const config = await getConfig(projectPath)
    const configEnvs = config.environments ?? {}

    type EnvEntry = { name: string; databaseUrl: string }
    const envList: EnvEntry[] = []
    for (const [name, entry] of Object.entries(configEnvs)) {
      if (typeof entry === 'object' && entry !== null && 'databaseUrl' in entry) {
        envList.push({ name, databaseUrl: (entry as { databaseUrl: string }).databaseUrl })
      }
    }

    if (envList.length < 2) {
      return c.json(
        {
          success: false,
          error: 'At least 2 environments must be configured in prismaflow.config.ts',
        },
        400,
      )
    }

    const comparison = await compareEnvironments(envList, project.schemaPath, projectPath)
    return c.json({ success: true, data: comparison })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
