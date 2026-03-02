import { Hono } from 'hono'
import { detectDrift } from '../../core/drift-detector.js'

type Variables = { projectPath: string; requestId: string }

const app = new Hono<{ Variables: Variables }>()

// In-memory cache so the dashboard's repeated polls don't hammer the DB
interface CacheEntry { data: Awaited<ReturnType<typeof detectDrift>>; fetchedAt: number }
const CACHE_TTL_MS = 10_000    // 10 seconds
let cache: CacheEntry | null = null

function buildPayload(drift: Awaited<ReturnType<typeof detectDrift>>) {
  return {
    hasDrift:    drift.length > 0,
    driftCount:  drift.length,
    differences: drift,
    cachedAt:    cache?.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
  }
}

// GET /api/drift — return cached results (refreshed every 10 s)
app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath')

    if (!cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
      const data = await detectDrift(projectPath)
      cache = { data, fetchedAt: Date.now() }
    }

    return c.json({ success: true, data: buildPayload(cache.data) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

// POST /api/drift/check — force a fresh check, bypassing cache
app.post('/check', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const data        = await detectDrift(projectPath)
    cache = { data, fetchedAt: Date.now() }

    return c.json({ success: true, message: 'Drift check completed', data: buildPayload(data) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
