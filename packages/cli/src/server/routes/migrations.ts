import { Hono } from 'hono'
import { getMigrations, getMigrationDetails } from '../../core/migration-analyzer'

const app = new Hono()

// GET /api/migrations - List all migrations
app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const migrations = await getMigrations(projectPath)
    
    return c.json({
      success: true,
      data: migrations,
      count: migrations.length
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// GET /api/migrations/:name - Get single migration details
app.get('/:name', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const name = c.req.param('name')
    const migration = await getMigrationDetails(projectPath, name)
    
    if (!migration) {
      return c.json({
        success: false,
        error: 'Migration not found'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: migration
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
