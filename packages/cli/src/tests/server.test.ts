import { beforeAll, describe, expect, it, vi } from 'vitest'

// ─── Hoist mocks before any imports that transitively load routes ─────────────

vi.mock('../core/prisma-detector.js', () => ({
  detectPrismaProject: vi.fn().mockResolvedValue({
    projectName: 'test-project',
    schemaPath: '/project/prisma/schema.prisma',
    migrations: [],
    hasMigrations: true,
    databaseUrl: 'postgresql://localhost/testdb',
    driftCount: 0,
  }),
}))

vi.mock('../core/migration-analyzer.js', () => ({
  getMigrations: vi.fn().mockResolvedValue([]),
  getProjectStatus: vi.fn().mockResolvedValue({
    projectName: 'test-project',
    schemaPath: '/project/prisma/schema.prisma',
    migrations: [],
    hasMigrations: true,
    databaseUrl: 'postgresql://localhost/testdb',
    driftCount: 0,
    pendingCount: 0,
    failedCount: 0,
    appliedCount: 0,
    hasDrift: false,
    risks: [],
    connected: true,
    riskLevel: 'low',
    lastSync: new Date().toISOString(),
  }),
  getMigrationDetails: vi.fn().mockResolvedValue(null),
}))

vi.mock('../core/drift-detector.js', () => ({
  detectDrift: vi.fn().mockResolvedValue([]),
}))

vi.mock('../core/schema-parser.js', () => ({
  parseSchema: vi.fn().mockResolvedValue({ models: [], enums: [] }),
}))

vi.mock('../logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Import after mocks
const { createServer } = await import('../server/index.js')

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Hono API Server', () => {
  let token: string
  let app: ReturnType<typeof createServer>['app']

  beforeAll(() => {
    const server = createServer('/project')
    app = server.app
    token = server.token
  })

  // ─── Auth guard ────────────────────────────────────────────────────────────

  describe('Auth guard', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await app.request('/api/status')
      expect(res.status).toBe(401)
    })

    it('returns 401 when wrong token is provided', async () => {
      const res = await app.request('/api/status', {
        headers: { Authorization: 'Bearer wrong-token' },
      })
      expect(res.status).toBe(401)
    })

    it('returns 200 when correct Bearer token is provided', async () => {
      const res = await app.request('/api/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
    })

    it('returns 200 when correct token is provided as query param', async () => {
      const res = await app.request(`/api/status?token=${token}`)
      expect(res.status).toBe(200)
    })
  })

  // ─── /api/status ──────────────────────────────────────────────────────────

  describe('GET /api/status', () => {
    it('returns a valid status response body', async () => {
      const res = await app.request(`/api/status?token=${token}`)
      const body = (await res.json()) as Record<string, unknown>
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('connected')
      expect(body.data).toHaveProperty('migrationsApplied')
      expect(body.data).toHaveProperty('migrationsPending')
      expect(body.data).toHaveProperty('riskLevel')
    })
  })

  // ─── /api/migrations ──────────────────────────────────────────────────────

  describe('GET /api/migrations', () => {
    it('returns paginated migrations', async () => {
      const res = await app.request(`/api/migrations?token=${token}`)
      const body = (await res.json()) as Record<string, unknown>
      expect(body).toHaveProperty('data')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body).toHaveProperty('pagination')
    })

    it('respects page and limit query params', async () => {
      const res = await app.request(`/api/migrations?token=${token}&page=2&limit=10`)
      const body = (await res.json()) as { pagination: { page: number; limit: number } }
      expect(body.pagination.page).toBe(2)
      expect(body.pagination.limit).toBe(10)
    })
  })

  // ─── /api/drift ───────────────────────────────────────────────────────────

  describe('GET /api/drift', () => {
    it('returns a valid drift result', async () => {
      const res = await app.request(`/api/drift?token=${token}`)
      const body = (await res.json()) as Record<string, unknown>
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('hasDrift')
      expect(body.data).toHaveProperty('differences')
      expect(body.data).toHaveProperty('driftCount')
    })
  })

  describe('POST /api/drift/check', () => {
    it('forces a fresh drift check', async () => {
      const res = await app.request(`/api/drift/check?token=${token}`, { method: 'POST' })
      expect(res.status).toBe(200)
      const body = (await res.json()) as Record<string, unknown>
      expect(body.success).toBe(true)
    })
  })

  // ─── /api/schema ──────────────────────────────────────────────────────────

  describe('GET /api/schema', () => {
    it('returns a schema response', async () => {
      const res = await app.request(`/api/schema?token=${token}`)
      const body = (await res.json()) as Record<string, unknown>
      expect(body.success).toBe(true)
    })
  })

  // ─── Security headers ─────────────────────────────────────────────────────

  describe('Security headers', () => {
    it('sets X-Request-Id header on every response', async () => {
      const res = await app.request(`/api/status?token=${token}`)
      expect(res.headers.get('X-Request-Id')).toBeTruthy()
    })

    it('sets X-Content-Type-Options header', async () => {
      const res = await app.request(`/api/status?token=${token}`)
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })
  })
})
