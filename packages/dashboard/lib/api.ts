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
  Migration,
  MigrationDetail,
  MigrationRiskScore,
  PaginatedResponse,
  ProjectStatus,
  SimulationResult,
} from '@prisma-flow/shared'

export interface SchemaField {
  name: string
  type: string
  kind: 'scalar' | 'object' | 'enum' | 'unsupported'
  isRequired: boolean
  isList: boolean
  isId?: boolean
  isUnique?: boolean
  relationName?: string
}

export interface SchemaModel {
  name: string
  fields: SchemaField[]
  primaryKey?: { fields: string[] } | null
  uniqueIndexes?: Array<{ fields: string[] }>
  indexes?: Array<{ fields: string[] }>
}

export interface SchemaEnum {
  name: string
  values: Array<{ name: string }>
}

export interface SchemaDatamodel {
  models: SchemaModel[]
  enums: SchemaEnum[]
}

// Re-export types so components can import from this single module
export type {
  DriftItem,
  DriftResult,
  Migration,
  MigrationDetail,
  MigrationRiskScore,
  ProjectStatus,
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

export async function fetchSchema(): Promise<SchemaDatamodel> {
  const body = await request<ApiSuccess<SchemaDatamodel>>('/api/schema')
  return body.data
}

export async function forceDriftCheck(): Promise<DriftResult> {
  const body = await request<ApiSuccess<DriftResult>>('/api/drift/check', {
    method: 'POST',
  })
  return body.data
}

export async function fetchRisks(): Promise<
  Array<{ name: string; timestamp: string; riskScore: MigrationRiskScore }>
> {
  const body =
    await request<
      ApiSuccess<
        Array<{
          name: string
          timestamp: string
          riskScore: MigrationRiskScore
        }>
      >
    >('/api/risks')
  return body.data
}

export async function fetchSimulation(migration: string): Promise<SimulationResult> {
  const body = await request<ApiSuccess<SimulationResult>>(
    `/api/simulate/${encodeURIComponent(migration)}`,
  )
  return body.data
}

// ─── SWR keys (stable, serialisable) ─────────────────────────────────────────

export const SWR_KEYS = {
  status: '/api/status',
  migrations: (page: number, limit: number) => `/api/migrations?page=${page}&limit=${limit}`,
  drift: '/api/drift',
  schema: '/api/schema',
  risks: '/api/risks',
} as const
