// ─── Migration ────────────────────────────────────────────────────────────────

export type MigrationStatus = 'applied' | 'pending' | 'failed'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Migration {
  name: string
  timestamp: string // ISO-8601 in API responses
  status: MigrationStatus
  sqlPath: string
  appliedAt?: string
}

export interface MigrationDetail extends Migration {
  sql: string
  risks: string[]
  riskScore?: MigrationRiskScore
  rollbackPlan?: RollbackPlan
  gitBranch?: string
}

// ─── Drift ────────────────────────────────────────────────────────────────────

export type DriftType =
  | 'table-missing'
  | 'table-extra'
  | 'column-mismatch'
  | 'index-change'
  | 'constraint-change'
  | 'unknown'
  | 'missing_migration'
  | 'extra_column'
  | 'extra_table'
  | 'modified_migration'

export interface DriftItem {
  sql: string
  type: DriftType
  description: string
  /** Stable identifier for the drifted object (e.g. table name or migration name) */
  identifier?: string
  /** Migration name associated with this drift item */
  migrationName?: string
}

export type DriftDetectionStatus = 'clean' | 'drifted' | 'error'

export interface DriftResult {
  hasDrift: boolean
  driftCount: number
  differences: DriftItem[]
  cachedAt: string | null
  status: DriftDetectionStatus
  errorMessage?: string
}

// ─── Project Status ───────────────────────────────────────────────────────────

export interface ProjectStatus {
  connected: boolean
  migrationsApplied: number
  migrationsPending: number
  migrationsFailed: number
  driftDetected: boolean
  driftCount: number
  riskLevel: RiskLevel
  lastSync: string // ISO-8601
  provider?: DatabaseProvider
  projectName?: string
  schemaPath?: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: PaginationMeta
}

// ─── Config ───────────────────────────────────────────────────────────────────

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export type WebhookType = 'slack' | 'discord' | 'http'

export interface WebhookConfig {
  type: WebhookType
  url: string
  /** Only send for these event types (all by default) */
  events?: WebhookEvent[]
}

export type WebhookEvent =
  | 'drift-detected'
  | 'migration-failed'
  | 'check-complete'
  | 'migration-applied'
  | 'simulation-complete'
  | 'risk-threshold-exceeded'

export interface FeatureFlags {
  riskAnalysis: boolean
  webhookAlerts: boolean
  auditLog: boolean
  ciAnnotations: boolean
  /** Multi-environment comparison (Pro+) */
  envComparison: boolean
  /** Rollback generation (Pro+) */
  rollbackGen: boolean
  /** Migration simulation (Pro+) */
  simulation: boolean
  /** Git-awareness features (Pro+) */
  gitAwareness: boolean
}

export interface PrismaFlowConfig {
  port?: number
  logLevel?: LogLevel
  openBrowser?: boolean
  features?: Partial<FeatureFlags>
  webhooks?: WebhookConfig[]
  /** Named environments for cross-env comparison */
  environments?: Array<{ name: string; databaseUrl: string }>
  /** Maximum audit log file size in MB before rotation (default: 10) */
  auditLogMaxMb?: number
  /** Risk threshold that triggers warnings (default: medium) */
  riskThreshold?: RiskLevel
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'dashboard.start'
  | 'status.check'
  | 'drift.detect'
  | 'drift.repair'
  | 'migration.check'
  | 'migration.apply'
  | 'migration.simulate'
  | 'migration.rollback'
  | 'migration.inspect'
  | 'migration.history'
  | 'migration.create'
  | 'doctor.run'
  | 'env.compare'
  | 'schema.diff'

export interface AuditEntry {
  timestamp: string // ISO-8601
  action: AuditAction
  cwd: string
  result: 'success' | 'failure' | 'warning'
  detail?: Record<string, unknown>
}

// ─── Risk Analysis ────────────────────────────────────────────────────────────

export interface RiskFactor {
  pattern: string
  severity: RiskLevel
  description: string
  affectedTable?: string
  estimatedRows?: number
  recommendation: string
}

export interface MigrationRiskScore {
  /** Composite score 0-100 (higher = more dangerous) */
  score: number
  level: RiskLevel
  factors: RiskFactor[]
}

// ─── Rollback ─────────────────────────────────────────────────────────────────

export interface RollbackStep {
  /** Original forward statement index */
  index: number
  forwardSql: string
  rollbackSql: string
  /** True if PrismaFlow can run this automatically */
  automated: boolean
  warning?: string
}

export interface RollbackPlan {
  migrationName: string
  steps: RollbackStep[]
  hasManualSteps: boolean
  warnings: string[]
  generatedAt: string
  /** True only when every step is automated */
  automated: boolean
  /** Legacy — full SQL string rendered from steps */
  sql?: string
}

// ─── Simulation ───────────────────────────────────────────────────────────────

export type SimulationMode = 'static' | 'shadow' | 'live'

export interface SimulationStatement {
  index: number
  sql: string
  type:
    | 'CREATE_TABLE'
    | 'ALTER_TABLE'
    | 'DROP_TABLE'
    | 'CREATE_INDEX'
    | 'DROP_INDEX'
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'
    | 'TRUNCATE'
    | 'OTHER'
  isDestructive: boolean
  warnings: string[]
  estimatedRowsAffected?: number
  /** Set when run against a real or shadow DB */
  success?: boolean
  error?: string
  durationMs?: number
}

export interface SimulationResult {
  migrationName: string
  statements: SimulationStatement[]
  wouldSucceed: boolean
  destructiveStatements: number
  warnings: string[]
  simulatedAt: string
  mode: SimulationMode
  error?: string
  /** Legacy fields for backwards compat */
  appliedStatements?: SimulationStatement[]
  errors?: string[]
  totalDurationMs?: number
}

// ─── Drift Recovery ───────────────────────────────────────────────────────────

export type DriftRepairStrategy = 'APPLY_MIGRATION' | 'SQUASH' | 'MANUAL_SQL' | 'IGNORE'

export interface DriftRecoverySuggestion {
  driftItem: DriftItem
  strategy: DriftRepairStrategy
  description: string
  sql?: string
  automated: boolean
  risk: 'low' | 'medium' | 'high'
}

// ─── Schema Diff ──────────────────────────────────────────────────────────────

export type SchemaDiffType =
  | 'model_added'
  | 'model_removed'
  | 'field_added'
  | 'field_removed'
  | 'field_type_changed'
  | 'added'
  | 'removed'
  | 'modified'

export interface SchemaDiff {
  type: SchemaDiffType
  /** Model/table name */
  modelName?: string
  /** Field/column name (for field-level diffs) */
  fieldName?: string
  oldType?: string
  newType?: string
  description: string
  breaking: boolean
  /** Legacy fields */
  entity?: string
  field?: string
  before?: string
  after?: string
}

export interface MigrationHistoryDiff {
  sourceEnv: string
  targetEnv: string
  sourceApplied: number
  targetApplied: number
  onlyInSource: string[]
  onlyInTarget: string[]
  divergencePoint?: string
  inSync: boolean
  /** Legacy fields */
  name?: string
  presentInSource?: boolean
  presentInTarget?: boolean
  statusInSource?: MigrationStatus
  statusInTarget?: MigrationStatus
}

export interface EnvironmentEntry {
  name: string
  reachable: boolean
  appliedCount: number
  pendingCount: number
  failedCount: number
}

export interface EnvironmentComparison {
  referenceEnv: string
  environments: EnvironmentEntry[]
  diffs: MigrationHistoryDiff[]
  allInSync: boolean
  comparedAt: string
  /** Legacy fields */
  source?: string
  target?: string
  schemaDiffs?: SchemaDiff[]
  migrationDiffs?: MigrationHistoryDiff[]
}

// ─── Git Awareness ────────────────────────────────────────────────────────────

export interface GitMigrationInfo {
  migrationName: string
  committed: boolean
  commitHash?: string
  commitAuthor?: string
  commitDate?: string
  commitMessage?: string
  /** Legacy fields */
  branch?: string
  authorName?: string
  committedAt?: string
}

export interface MigrationConflict {
  timestamp: string
  migrations: string[]
  type: 'duplicate_timestamp' | 'timestamp-overlap' | 'name-conflict' | 'history-diverge'
  description: string
  /** Legacy fields */
  migrationA?: string
  migrationB?: string
  branches?: string[]
  conflictType?: 'timestamp-overlap' | 'name-conflict' | 'history-diverge'
}

// ─── Multi-Database ───────────────────────────────────────────────────────────

export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb'

// ─── SaaS / Multi-Tenant ─────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  organizationId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  organizationId: string
  teamId?: string
  createdAt: string
  updatedAt: string
}

export interface Environment {
  id: string
  name: string
  projectId: string
  provider: DatabaseProvider
  /** Encrypted in SaaS mode */
  connectionString?: string
  createdAt: string
  updatedAt: string
}

export interface DeploymentEvent {
  id: string
  projectId: string
  environmentId: string
  migrationsApplied: string[]
  appliedBy?: string
  durationMs: number
  success: boolean
  error?: string
  createdAt: string
}

// ─── SSE Events ───────────────────────────────────────────────────────────────

export type SSEEventType =
  | 'status-update'
  | 'drift-detected'
  | 'drift-resolved'
  | 'migration-applied'
  | 'migration-failed'
  | 'simulation-progress'
  | 'simulation-complete'
  | 'repair-progress'
  | 'repair-complete'

export interface SSEEvent<T = unknown> {
  type: SSEEventType
  data: T
  timestamp: string
}
