import { z } from 'zod';

type MigrationStatus = 'applied' | 'pending' | 'failed';
type RiskLevel = 'low' | 'medium' | 'high';
interface Migration {
    name: string;
    timestamp: string;
    status: MigrationStatus;
    sqlPath: string;
}
interface MigrationDetail extends Migration {
    sql: string;
    risks: string[];
}
type DriftType = 'table-missing' | 'table-extra' | 'column-mismatch' | 'index-change' | 'constraint-change' | 'unknown';
interface DriftItem {
    sql: string;
    type: DriftType;
    description: string;
}
interface DriftResult {
    hasDrift: boolean;
    driftCount: number;
    differences: DriftItem[];
    cachedAt: string | null;
}
interface ProjectStatus {
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    driftCount: number;
    riskLevel: RiskLevel;
    lastSync: string;
}
interface ApiSuccess<T> {
    success: true;
    data: T;
}
interface ApiError {
    success: false;
    error: string;
}
type ApiResponse<T> = ApiSuccess<T> | ApiError;
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
}
interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
}
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
type WebhookType = 'slack' | 'discord' | 'http';
interface WebhookConfig {
    type: WebhookType;
    url: string;
    /** Only send for these event types (all by default) */
    events?: WebhookEvent[];
}
type WebhookEvent = 'drift-detected' | 'migration-failed' | 'check-complete';
interface FeatureFlags {
    riskAnalysis: boolean;
    webhookAlerts: boolean;
    auditLog: boolean;
    ciAnnotations: boolean;
}
interface PrismaFlowConfig {
    port?: number;
    logLevel?: LogLevel;
    openBrowser?: boolean;
    features?: Partial<FeatureFlags>;
    webhooks?: WebhookConfig[];
}
type AuditAction = 'dashboard.start' | 'status.check' | 'drift.detect' | 'migration.check' | 'doctor.run';
interface AuditEntry {
    timestamp: string;
    action: AuditAction;
    cwd: string;
    result: 'success' | 'failure' | 'warning';
    detail?: Record<string, unknown>;
}

declare const MigrationStatusSchema: z.ZodEnum<["applied", "pending", "failed"]>;
declare const RiskLevelSchema: z.ZodEnum<["low", "medium", "high"]>;
declare const DriftTypeSchema: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown"]>;
declare const LogLevelSchema: z.ZodEnum<["trace", "debug", "info", "warn", "error"]>;
declare const WebhookTypeSchema: z.ZodEnum<["slack", "discord", "http"]>;
declare const MigrationSchema: z.ZodObject<{
    name: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["applied", "pending", "failed"]>;
    sqlPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
}, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
}>;
declare const MigrationDetailSchema: z.ZodObject<{
    name: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["applied", "pending", "failed"]>;
    sqlPath: z.ZodString;
} & {
    sql: z.ZodString;
    risks: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
    sql: string;
    risks: string[];
}, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
    sql: string;
    risks: string[];
}>;
declare const DriftItemSchema: z.ZodObject<{
    sql: z.ZodString;
    type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown"]>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
    sql: string;
    description: string;
}, {
    type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
    sql: string;
    description: string;
}>;
declare const DriftResultSchema: z.ZodObject<{
    hasDrift: z.ZodBoolean;
    driftCount: z.ZodNumber;
    differences: z.ZodArray<z.ZodObject<{
        sql: z.ZodString;
        type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown"]>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
        sql: string;
        description: string;
    }, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
        sql: string;
        description: string;
    }>, "many">;
    cachedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
        sql: string;
        description: string;
    }[];
    cachedAt: string | null;
}, {
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown";
        sql: string;
        description: string;
    }[];
    cachedAt: string | null;
}>;
declare const ProjectStatusSchema: z.ZodObject<{
    connected: z.ZodBoolean;
    migrationsApplied: z.ZodNumber;
    migrationsPending: z.ZodNumber;
    migrationsFailed: z.ZodNumber;
    driftDetected: z.ZodBoolean;
    driftCount: z.ZodNumber;
    riskLevel: z.ZodEnum<["low", "medium", "high"]>;
    lastSync: z.ZodString;
}, "strip", z.ZodTypeAny, {
    driftCount: number;
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    riskLevel: "low" | "medium" | "high";
    lastSync: string;
}, {
    driftCount: number;
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    riskLevel: "low" | "medium" | "high";
    lastSync: string;
}>;
declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
declare const WebhookEventSchema: z.ZodEnum<["drift-detected", "migration-failed", "check-complete"]>;
declare const WebhookConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["slack", "discord", "http"]>;
    url: z.ZodString;
    events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
}, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
}>;
declare const FeatureFlagsSchema: z.ZodObject<{
    riskAnalysis: z.ZodDefault<z.ZodBoolean>;
    webhookAlerts: z.ZodDefault<z.ZodBoolean>;
    auditLog: z.ZodDefault<z.ZodBoolean>;
    ciAnnotations: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    riskAnalysis: boolean;
    webhookAlerts: boolean;
    auditLog: boolean;
    ciAnnotations: boolean;
}, {
    riskAnalysis?: boolean | undefined;
    webhookAlerts?: boolean | undefined;
    auditLog?: boolean | undefined;
    ciAnnotations?: boolean | undefined;
}>;
declare const PrismaFlowConfigSchema: z.ZodObject<{
    port: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["trace", "debug", "info", "warn", "error"]>>;
    openBrowser: z.ZodDefault<z.ZodBoolean>;
    features: z.ZodDefault<z.ZodObject<{
        riskAnalysis: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        webhookAlerts: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        auditLog: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        ciAnnotations: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
    }, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
    }>>;
    webhooks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["slack", "discord", "http"]>;
        url: z.ZodString;
        events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
    }, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    port: number;
    logLevel: "trace" | "debug" | "info" | "warn" | "error";
    openBrowser: boolean;
    features: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
    };
    webhooks: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
    }[];
}, {
    port?: number | undefined;
    logLevel?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
    openBrowser?: boolean | undefined;
    features?: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
    } | undefined;
    webhooks?: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete")[] | undefined;
    }[] | undefined;
}>;
type PrismaFlowConfigParsed = z.infer<typeof PrismaFlowConfigSchema>;

declare class PrismaFlowError extends Error {
    readonly code: string;
    readonly cause?: unknown | undefined;
    constructor(message: string, code: string, cause?: unknown | undefined);
}
declare class SchemaNotFoundError extends PrismaFlowError {
    constructor(cwd: string);
}
declare class DatabaseConnectionError extends PrismaFlowError {
    constructor(detail?: string);
}
declare class DriftDetectionError extends PrismaFlowError {
    constructor(cause: unknown);
}
declare class MigrationAnalysisError extends PrismaFlowError {
    constructor(cause: unknown);
}
declare class ConfigurationError extends PrismaFlowError {
    constructor(detail: string);
}
declare class UnauthorizedError extends PrismaFlowError {
    constructor();
}

export { type ApiError, type ApiResponse, type ApiSuccess, type AuditAction, type AuditEntry, ConfigurationError, DatabaseConnectionError, DriftDetectionError, type DriftItem, DriftItemSchema, type DriftResult, DriftResultSchema, type DriftType, DriftTypeSchema, type FeatureFlags, FeatureFlagsSchema, type LogLevel, LogLevelSchema, type Migration, MigrationAnalysisError, type MigrationDetail, MigrationDetailSchema, MigrationSchema, type MigrationStatus, MigrationStatusSchema, type PaginatedResponse, type PaginationMeta, PaginationQuerySchema, type PrismaFlowConfig, type PrismaFlowConfigParsed, PrismaFlowConfigSchema, PrismaFlowError, type ProjectStatus, ProjectStatusSchema, type RiskLevel, RiskLevelSchema, SchemaNotFoundError, UnauthorizedError, type WebhookConfig, WebhookConfigSchema, type WebhookEvent, WebhookEventSchema, type WebhookType, WebhookTypeSchema };
