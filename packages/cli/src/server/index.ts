import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import migrationsRoutes from './routes/migrations'
import statusRoutes from './routes/status'
import schemaRoutes from './routes/schema'
import driftRoutes from './routes/drift'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createServer(projectPath: string) {
  const app = new Hono()

  // Middleware
  app.use('*', logger())
  app.use('*', cors())

  // Add project path to context
  app.use('*', async (c, next) => {
    c.set('projectPath', projectPath)
    await next()
  })

  // Routes
  app.route('/api/migrations', migrationsRoutes)
  app.route('/api/status', statusRoutes)
  app.route('/api/schema', schemaRoutes)
  app.route('/api/drift', driftRoutes)

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', service: 'PrismaFlow' })
  })

  // Serve Static Dashboard
  let publicDir = path.resolve(__dirname, '../public')
  
  if (!fs.existsSync(publicDir)) {
      publicDir = path.resolve(__dirname, '../../public')
  }

  // Hono's serveStatic for Node needs a 'root' relative to the execution or absolute.
  // We need to be careful. serveStatic from @hono/node-server/serve-static
  // options: { root: string, path?: string, ... }
  
  // If we want to serve files from `publicDir`, we might need to compute relative path from CWD
  // because Hono often resolves relative to process.cwd().
  const relativeRoot = path.relative(process.cwd(), publicDir)

  // Serve static files
  app.use('/*', serveStatic({
    root: relativeRoot,
    // We can also use rewriteRequestPath to handle SPA routing if needed, 
    // but the fallback below is simpler.
  }))

  // Fallback for SPA (Single Page Application)
  // If the static middleware didn't catch it (404), serve index.html
  app.get('*', async (c) => {
    try {
      const indexPath = path.join(publicDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        const content = await fs.promises.readFile(indexPath, 'utf-8')
        return c.html(content)
      }
      return c.text('Dashboard not found', 404)
    } catch (e) {
      return c.text('Error serving dashboard', 500)
    }
  })

  return app
}

export function startServer(app: Hono, port: number = 5555) {
  return serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`✓ PrismaFlow API running on http://localhost:${info.port}`)
  })
}