import { Hono } from 'hono'
import { parseSchema } from '../../core/schema-parser'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath') as string
    const schema = await parseSchema(projectPath)
    
    return c.json({
      success: true,
      data: schema
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
