import { Hono } from 'hono'
import { getProjectStatus } from '../../core/migration-analyzer'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const status = await getProjectStatus(projectPath)
    
    return c.json({
      success: true,
      data: {
        connected: status.connected,
        migrationsApplied: status.appliedCount,
        migrationsPending: status.pendingCount,
        migrationsFailed: status.failedCount,
        driftDetected: status.hasDrift,
        riskLevel: status.riskLevel,
        lastSync: status.lastSync
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
