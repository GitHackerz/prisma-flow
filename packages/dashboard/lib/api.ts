/**
 * Typed API client for PrismaFlow dashboard.
 *
 * Reads the auth token from ?token= in the URL (injected by the CLI when it
 * opens the browser) and attaches it as a Bearer header on every request.
 * Falls back to no token in dev/SSR environments where window is unavailable.
 */
import type {
  ApiSuccess,
  DriftItem,
  DriftResult,
  EnvironmentComparison,
  Migration,
  MigrationDetail,
  MigrationRiskScore,
  PaginatedResponse,
  ProjectStatus,
  RollbackPlan,
  SchemaDiff,
  SimulationResult,
} from '@prisma-flow/shared'

// Re-export types so components can import from this single module
export type {
  DriftItem,
  DriftResult,
  EnvironmentComparison,
  Migration,
  MigrationDetail,
  MigrationRiskScore,
  ProjectStatus,
  RollbackPlan,
  SchemaDiff,
  SimulationResult,
}

// ─── Token management ─────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

// ─── Base fetcher ─────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5555')

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiRequestError(res.status, body.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── API methods ──────────────────────────────────────────────────────────────

export async function fetchStatus(): Promise<ProjectStatus> {
  const body = await request<ApiSuccess<ProjectStatus>>('/api/status')
  return body.data
}

export async function fetchMigrations(page = 1, limit = 50): Promise<PaginatedResponse<Migration>> {
  return request<PaginatedResponse<Migration>>(`/api/migrations?page=${page}&limit=${limit}`)
}

export async function fetchMigrationDetail(name: string): Promise<MigrationDetail> {
  const body = await request<ApiSuccess<MigrationDetail>>(
    `/api/migrations/${encodeURIComponent(name)}`,
  )
  return body.data
}

export async function fetchDrift(): Promise<DriftResult> {
  const body = await request<ApiSuccess<DriftResult>>('/api/drift')
  return body.data
}

export async function forceDriftCheck(): Promise<DriftResult> {
  const body = await request<ApiSuccess<DriftResult>>('/api/drift/check', { method: 'POST' })
  return body.data
}

export async function fetchRisks(): Promise<
  Array<{ name: string; timestamp: string; riskScore: MigrationRiskScore }>
> {
  const body =
    await request<
      ApiSuccess<Array<{ name: string; timestamp: string; riskScore: MigrationRiskScore }>>
    >('/api/risks')
  return body.data
}

export async function fetchRisk(migration: string): Promise<MigrationRiskScore> {
  const body = await request<ApiSuccess<MigrationRiskScore>>(
    `/api/risks/${encodeURIComponent(migration)}`,
  )
  return body.data
}

export async function fetchRollbackPlan(migration: string): Promise<RollbackPlan> {
  const body = await request<ApiSuccess<RollbackPlan>>(
    `/api/rollback/${encodeURIComponent(migration)}`,
  )
  return body.data
}

export async function fetchSimulation(migration: string): Promise<SimulationResult> {
  const body = await request<ApiSuccess<SimulationResult>>(
    `/api/simulate/${encodeURIComponent(migration)}`,
  )
  return body.data
}

export async function fetchDiff(
  breakingOnly = false,
): Promise<{ diffs: SchemaDiff[]; totalDiffs: number; breakingDiffs: number }> {
  const body = await request<
    ApiSuccess<{ diffs: SchemaDiff[]; totalDiffs: number; breakingDiffs: number }>
  >(`/api/diff${breakingOnly ? '?breaking=true' : ''}`)
  return body.data
}

export async function fetchRepairSuggestions() {
  const body =
    await request<ApiSuccess<{ drifted: boolean; suggestions: unknown[] }>>('/api/repair')
  return body.data
}

export async function applyRepairs() {
  const body = await request<
    ApiSuccess<Array<{ migrationName: string; success: boolean; error?: string }>>
  >('/api/repair/apply', { method: 'POST' })
  return body.data
}

export async function fetchComparison(): Promise<EnvironmentComparison> {
  const body = await request<ApiSuccess<EnvironmentComparison>>('/api/compare')
  return body.data
}

export async function fetchAuditLog(limit = 100): Promise<unknown[]> {
  const body = await request<ApiSuccess<unknown[]>>(`/api/audit?limit=${limit}`)
  return body.data
}

export async function fetchGitInfo() {
  const body = await request<ApiSuccess<unknown>>('/api/git')
  return body.data
}

export async function fetchConfig() {
  const body = await request<ApiSuccess<unknown>>('/api/config')
  return body.data
}

// ─── SWR keys (stable, serialisable) ─────────────────────────────────────────

export const SWR_KEYS = {
  status: '/api/status',
  migrations: (page: number, limit: number) => `/api/migrations?page=${page}&limit=${limit}`,
  drift: '/api/drift',
  risks: '/api/risks',
  diff: '/api/diff',
  repair: '/api/repair',
  compare: '/api/compare',
  audit: '/api/audit',
  git: '/api/git',
  config: '/api/config',
} as const
