// src/schemas.ts
import { z } from "zod";
var MigrationStatusSchema = z.enum(["applied", "pending", "failed"]);
var RiskLevelSchema = z.enum(["low", "medium", "high"]);
var DriftTypeSchema = z.enum([
  "table-missing",
  "table-extra",
  "column-mismatch",
  "index-change",
  "constraint-change",
  "unknown"
]);
var LogLevelSchema = z.enum(["trace", "debug", "info", "warn", "error"]);
var WebhookTypeSchema = z.enum(["slack", "discord", "http"]);
var MigrationSchema = z.object({
  name: z.string().min(1),
  timestamp: z.string().datetime(),
  status: MigrationStatusSchema,
  sqlPath: z.string()
});
var MigrationDetailSchema = MigrationSchema.extend({
  sql: z.string(),
  risks: z.array(z.string())
});
var DriftItemSchema = z.object({
  sql: z.string(),
  type: DriftTypeSchema,
  description: z.string()
});
var DriftResultSchema = z.object({
  hasDrift: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  differences: z.array(DriftItemSchema),
  cachedAt: z.string().datetime().nullable()
});
var ProjectStatusSchema = z.object({
  connected: z.boolean(),
  migrationsApplied: z.number().int().nonnegative(),
  migrationsPending: z.number().int().nonnegative(),
  migrationsFailed: z.number().int().nonnegative(),
  driftDetected: z.boolean(),
  driftCount: z.number().int().nonnegative(),
  riskLevel: RiskLevelSchema,
  lastSync: z.string().datetime()
});
var PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
var WebhookEventSchema = z.enum([
  "drift-detected",
  "migration-failed",
  "check-complete"
]);
var WebhookConfigSchema = z.object({
  type: WebhookTypeSchema,
  url: z.string().url(),
  events: z.array(WebhookEventSchema).optional()
});
var FeatureFlagsSchema = z.object({
  riskAnalysis: z.boolean().default(true),
  webhookAlerts: z.boolean().default(false),
  auditLog: z.boolean().default(false),
  ciAnnotations: z.boolean().default(false)
});
var PrismaFlowConfigSchema = z.object({
  port: z.number().int().positive().max(65535).default(5555),
  logLevel: LogLevelSchema.default("info"),
  openBrowser: z.boolean().default(true),
  features: FeatureFlagsSchema.partial().default({}),
  webhooks: z.array(WebhookConfigSchema).default([])
});

// src/errors.ts
var PrismaFlowError = class extends Error {
  constructor(message, code, cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "PrismaFlowError";
  }
};
var SchemaNotFoundError = class extends PrismaFlowError {
  constructor(cwd) {
    super(
      `No Prisma schema found in ${cwd}. Run \`prisma init\` to create one.`,
      "SCHEMA_NOT_FOUND"
    );
    this.name = "SchemaNotFoundError";
  }
};
var DatabaseConnectionError = class extends PrismaFlowError {
  constructor(detail) {
    super(
      `Could not reach the database server.${detail ? " " + detail : ""} Check DATABASE_URL in .env.`,
      "DATABASE_UNREACHABLE"
    );
    this.name = "DatabaseConnectionError";
  }
};
var DriftDetectionError = class extends PrismaFlowError {
  constructor(cause) {
    super("Drift detection failed unexpectedly.", "DRIFT_DETECTION_FAILED", cause);
    this.name = "DriftDetectionError";
  }
};
var MigrationAnalysisError = class extends PrismaFlowError {
  constructor(cause) {
    super("Migration analysis failed unexpectedly.", "MIGRATION_ANALYSIS_FAILED", cause);
    this.name = "MigrationAnalysisError";
  }
};
var ConfigurationError = class extends PrismaFlowError {
  constructor(detail) {
    super(`Configuration error: ${detail}`, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
};
var UnauthorizedError = class extends PrismaFlowError {
  constructor() {
    super("Unauthorized \u2014 valid auth token required.", "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
};
export {
  ConfigurationError,
  DatabaseConnectionError,
  DriftDetectionError,
  DriftItemSchema,
  DriftResultSchema,
  DriftTypeSchema,
  FeatureFlagsSchema,
  LogLevelSchema,
  MigrationAnalysisError,
  MigrationDetailSchema,
  MigrationSchema,
  MigrationStatusSchema,
  PaginationQuerySchema,
  PrismaFlowConfigSchema,
  PrismaFlowError,
  ProjectStatusSchema,
  RiskLevelSchema,
  SchemaNotFoundError,
  UnauthorizedError,
  WebhookConfigSchema,
  WebhookEventSchema,
  WebhookTypeSchema
};
