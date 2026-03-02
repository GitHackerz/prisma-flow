// ─── Migration ────────────────────────────────────────────────────────────────

export type MigrationStatus = 'applied' | 'pending' | 'failed'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface Migration {
  name:      string
  timestamp: string   // ISO-8601 in API responses
  status:    MigrationStatus
  sqlPath:   string
}

export interface MigrationDetail extends Migration {
  sql:   string
  risks: string[]
}

// ─── Drift ────────────────────────────────────────────────────────────────────

export type DriftType =
  | 'table-missing'
  | 'table-extra'
  | 'column-mismatch'
  | 'index-change'
  | 'constraint-change'
  | 'unknown'

export interface DriftItem {
  sql:         string
  type:        DriftType
  description: string
}

export interface DriftResult {
  hasDrift:    boolean
  driftCount:  number
  differences: DriftItem[]
  cachedAt:    string | null
}

// ─── Project Status ───────────────────────────────────────────────────────────

export interface ProjectStatus {
  connected:         boolean
  migrationsApplied: number
  migrationsPending: number
  migrationsFailed:  number
  driftDetected:     boolean
  driftCount:        number
  riskLevel:         RiskLevel
  lastSync:          string   // ISO-8601
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data:    T
}

export interface ApiError {
  success: false
  error:   string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  page:  number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  success:    true
  data:       T[]
  pagination: PaginationMeta
}

// ─── Config ───────────────────────────────────────────────────────────────────

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export type WebhookType = 'slack' | 'discord' | 'http'

export interface WebhookConfig {
  type: WebhookType
  url:  string
  /** Only send for these event types (all by default) */
  events?: WebhookEvent[]
}

export type WebhookEvent = 'drift-detected' | 'migration-failed' | 'check-complete'

export interface FeatureFlags {
  riskAnalysis:  boolean
  webhookAlerts: boolean
  auditLog:      boolean
  ciAnnotations: boolean
}

export interface PrismaFlowConfig {
  port?:        number
  logLevel?:    LogLevel
  openBrowser?: boolean
  features?:    Partial<FeatureFlags>
  webhooks?:    WebhookConfig[]
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'dashboard.start'
  | 'status.check'
  | 'drift.detect'
  | 'migration.check'
  | 'doctor.run'

export interface AuditEntry {
  timestamp: string    // ISO-8601
  action:    AuditAction
  cwd:       string
  result:    'success' | 'failure' | 'warning'
  detail?:   Record<string, unknown>
}
