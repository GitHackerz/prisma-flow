import { Hono } from 'hono'
import { detectDrift } from '../../core/drift-detector'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const drift = await detectDrift(projectPath)
    
    return c.json({
      success: true,
      data: {
        hasDrift: drift.length > 0,
        driftCount: drift.length,
        differences: drift
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// POST /api/drift/check - Force drift check
app.post('/check', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const drift = await detectDrift(projectPath)
    
    return c.json({
      success: true,
      message: 'Drift check completed',
      data: {
        hasDrift: drift.length > 0,
        driftCount: drift.length,
        differences: drift
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
