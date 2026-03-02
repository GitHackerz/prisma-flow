import { z } from 'zod'

// ─── Primitives ───────────────────────────────────────────────────────────────

export const MigrationStatusSchema = z.enum(['applied', 'pending', 'failed'])
export const RiskLevelSchema = z.enum(['low', 'medium', 'high'])
export const DriftTypeSchema = z.enum([
  'table-missing',
  'table-extra',
  'column-mismatch',
  'index-change',
  'constraint-change',
  'unknown',
])
export const LogLevelSchema = z.enum(['trace', 'debug', 'info', 'warn', 'error'])
export const WebhookTypeSchema = z.enum(['slack', 'discord', 'http'])

// ─── Domain objects ───────────────────────────────────────────────────────────

export const MigrationSchema = z.object({
  name: z.string().min(1),
  timestamp: z.string().datetime(),
  status: MigrationStatusSchema,
  sqlPath: z.string(),
})

export const MigrationDetailSchema = MigrationSchema.extend({
  sql: z.string(),
  risks: z.array(z.string()),
})

export const DriftItemSchema = z.object({
  sql: z.string(),
  type: DriftTypeSchema,
  description: z.string(),
})

export const DriftResultSchema = z.object({
  hasDrift: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  differences: z.array(DriftItemSchema),
  cachedAt: z.string().datetime().nullable(),
})

export const ProjectStatusSchema = z.object({
  connected: z.boolean(),
  migrationsApplied: z.number().int().nonnegative(),
  migrationsPending: z.number().int().nonnegative(),
  migrationsFailed: z.number().int().nonnegative(),
  driftDetected: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  riskLevel: RiskLevelSchema,
  lastSync: z.string().datetime(),
})

// ─── Pagination query params ──────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ─── Config ───────────────────────────────────────────────────────────────────

export const WebhookEventSchema = z.enum(['drift-detected', 'migration-failed', 'check-complete'])

export const WebhookConfigSchema = z.object({
  type: WebhookTypeSchema,
  url: z.string().url(),
  events: z.array(WebhookEventSchema).optional(),
})

export const FeatureFlagsSchema = z.object({
  riskAnalysis: z.boolean().default(true),
  webhookAlerts: z.boolean().default(false),
  auditLog: z.boolean().default(false),
  ciAnnotations: z.boolean().default(false),
})

export const PrismaFlowConfigSchema = z.object({
  port: z.number().int().positive().max(65535).default(5555),
  logLevel: LogLevelSchema.default('info'),
  openBrowser: z.boolean().default(true),
  features: FeatureFlagsSchema.partial().default({}),
  webhooks: z.array(WebhookConfigSchema).default([]),
})

export type PrismaFlowConfigParsed = z.infer<typeof PrismaFlowConfigSchema>
