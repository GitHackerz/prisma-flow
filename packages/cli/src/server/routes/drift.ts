import type { DriftResult } from '@prisma-flow/shared'
import { Hono } from 'hono'
import type { DriftDetectionResult } from '../../core/drift-detector.js'
import { detectDrift } from '../../core/drift-detector.js'

type Variables = { projectPath: string; requestId: string }

const app = new Hono<{ Variables: Variables }>()

// Per-project cache so the dashboard's repeated polls don't hammer the DB
interface CacheEntry {
  data: DriftDetectionResult
  fetchedAt: number
}
const CACHE_TTL_MS = 10_000 // 10 seconds
// Scoped by project path to support future multi-project server mode
const cacheMap = new Map<string, CacheEntry>()

function buildPayload(result: DriftDetectionResult, cachedAt: number | null): DriftResult {
  return {
    hasDrift: result.status === 'drifted',
    driftCount: result.items.length,
    differences: result.items,
    cachedAt: cachedAt ? new Date(cachedAt).toISOString() : null,
    status: result.status,
    ...(result.errorMessage !== undefined ? { errorMessage: result.errorMessage } : {}),
  }
}

// GET /api/drift — return cached results (refreshed every 10 s)
app.get('/', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const cached = cacheMap.get(projectPath)

    if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
      const data = await detectDrift(projectPath)
      const entry: CacheEntry = { data, fetchedAt: Date.now() }
      cacheMap.set(projectPath, entry)
      return c.json({ success: true, data: buildPayload(data, entry.fetchedAt) })
    }

    return c.json({ success: true, data: buildPayload(cached.data, cached.fetchedAt) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

// POST /api/drift/check — force a fresh check, bypassing cache
app.post('/check', async (c) => {
  try {
    const projectPath = c.get('projectPath')
    const data = await detectDrift(projectPath)
    const entry: CacheEntry = { data, fetchedAt: Date.now() }
    cacheMap.set(projectPath, entry)
    return c.json({
      success: true,
      message: 'Drift check completed',
      data: buildPayload(data, entry.fetchedAt),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, error: message }, 500)
  }
})

export default app
