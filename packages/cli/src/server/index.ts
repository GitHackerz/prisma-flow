import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from '../logger.js'
import driftRoutes from './routes/drift.js'
import migrationsRoutes from './routes/migrations.js'
import schemaRoutes from './routes/schema.js'
import statusRoutes from './routes/status.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Typed context variables ─────────────────────────────────────────────────
type Variables = {
  projectPath: string
  requestId: string
}

export function createServer(projectPath: string): {
  app: Hono<{ Variables: Variables }>
  token: string
} {
  const app = new Hono<{ Variables: Variables }>()

  // Generate a per-session bearer token so only the browser we open can reach the API.
  const token = randomBytes(24).toString('hex')

  // ── Security headers ────────────────────────────────────────────────────
  app.use('*', secureHeaders())

  // ── CORS — localhost only ────────────────────────────────────────────────
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return null // same-origin (served HTML) — allow
        try {
          const url = new URL(origin)
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return origin
        } catch {
          /* invalid origin — deny */
        }
        return null
      },
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // ── Request ID ───────────────────────────────────────────────────────────
  app.use('*', async (c, next) => {
    c.set('requestId', randomBytes(8).toString('hex'))
    c.res.headers.set('X-Request-Id', c.get('requestId'))
    await next()
  })

  app.use('*', honoLogger())

  // ── Auth token guard (all /api/* routes) ────────────────────────────────
  app.use('/api/*', async (c, next) => {
    const authHeader = c.req.header('Authorization') ?? ''
    const queryToken = c.req.query('token') ?? ''
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : queryToken

    if (provided !== token) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    await next()
  })

  // ── Project path injection ───────────────────────────────────────────────
  app.use('*', async (c, next) => {
    c.set('projectPath', projectPath)
    await next()
  })

  // ── API Routes ───────────────────────────────────────────────────────────
  app.route('/api/migrations', migrationsRoutes)
  app.route('/api/status', statusRoutes)
  app.route('/api/schema', schemaRoutes)
  app.route('/api/drift', driftRoutes)

  // ── Health (no auth required — used by process monitors / Docker) ────────
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'prisma-flow',
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: process.uptime(),
    })
  })

  // ── Static dashboard ─────────────────────────────────────────────────────
  let publicDir = path.resolve(__dirname, '../public')
  if (!fs.existsSync(publicDir)) {
    publicDir = path.resolve(__dirname, '../../public')
  }

  const relativeRoot = path.relative(process.cwd(), publicDir)

  app.use(
    '/*',
    serveStatic({
      root: relativeRoot,
      rewriteRequestPath: (p) => (p === '/' ? '/index.html' : p),
    }),
  )

  // SPA fallback — serve index.html for any unmatched path
  app.get('*', async (c) => {
    try {
      const indexPath = path.join(publicDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        const content = await fs.promises.readFile(indexPath, 'utf-8')
        return c.html(content)
      }
      return c.text('Dashboard not built — run `npm run build` first', 404)
    } catch {
      return c.text('Error serving dashboard', 500)
    }
  })

  return { app, token }
}

export function startServer(
  app: Hono<{ Variables: Variables }>,
  port = 5555,
): ReturnType<typeof serve> {
  const server = serve({ fetch: app.fetch, port }, (info) => {
    logger.info({ port: info.port }, 'PrismaFlow API running')
  })

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down PrismaFlow server...')
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 5_000).unref()
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)

  return server
}
