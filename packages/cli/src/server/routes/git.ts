import { Hono } from 'hono'
import {
  detectMigrationConflicts,
  getGitMigrationInfo,
  getUncommittedMigrations,
  isGitRepo,
} from '../../core/git-awareness.js'
import { detectPrismaProject } from '../../core/prisma-detector.js'

type Variables = { projectPath: string; requestId: string }
const app = new Hono<{ Variables: Variables }>()

/** GET /api/git — git metadata for migrations */
app.get('/', async (c) => {
  const projectPath = c.get('projectPath') as string
  try {
    const project = await detectPrismaProject(projectPath)
    if (!project) return c.json({ success: false, error: 'No Prisma project found' }, 404)

    const inRepo = await isGitRepo(projectPath)
    if (!inRepo) {
      return c.json({
        success: true,
        data: { inRepo: false, migrations: [], conflicts: [], uncommitted: [] },
      })
    }

    const [migrations, conflicts, uncommitted] = await Promise.all([
      getGitMigrationInfo(project.migrationsPath, projectPath),
      detectMigrationConflicts(project.migrationsPath),
      getUncommittedMigrations(project.migrationsPath, projectPath),
    ])

    return c.json({ success: true, data: { inRepo: true, migrations, conflicts, uncommitted } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
