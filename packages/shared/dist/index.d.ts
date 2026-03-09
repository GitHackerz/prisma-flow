import { z } from 'zod';

type MigrationStatus = 'applied' | 'pending' | 'failed';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
interface Migration {
    name: string;
    timestamp: string;
    status: MigrationStatus;
    sqlPath: string;
    appliedAt?: string;
}
interface MigrationDetail extends Migration {
    sql: string;
    risks: string[];
    riskScore?: MigrationRiskScore;
    rollbackPlan?: RollbackPlan;
    gitBranch?: string;
}
type DriftType = 'table-missing' | 'table-extra' | 'column-mismatch' | 'index-change' | 'constraint-change' | 'unknown' | 'missing_migration' | 'extra_column' | 'extra_table' | 'modified_migration';
interface DriftItem {
    sql: string;
    type: DriftType;
    description: string;
    /** Stable identifier for the drifted object (e.g. table name or migration name) */
    identifier?: string;
    /** Migration name associated with this drift item */
    migrationName?: string;
}
type DriftDetectionStatus = 'clean' | 'drifted' | 'error';
interface DriftResult {
    hasDrift: boolean;
    driftCount: number;
    differences: DriftItem[];
    cachedAt: string | null;
    status: DriftDetectionStatus;
    errorMessage?: string;
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
    provider?: DatabaseProvider;
    projectName?: string;
    schemaPath?: string;
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
type WebhookEvent = 'drift-detected' | 'migration-failed' | 'check-complete' | 'migration-applied' | 'simulation-complete' | 'risk-threshold-exceeded';
interface FeatureFlags {
    riskAnalysis: boolean;
    webhookAlerts: boolean;
    auditLog: boolean;
    ciAnnotations: boolean;
    /** Multi-environment comparison (Pro+) */
    envComparison: boolean;
    /** Rollback generation (Pro+) */
    rollbackGen: boolean;
    /** Migration simulation (Pro+) */
    simulation: boolean;
    /** Git-awareness features (Pro+) */
    gitAwareness: boolean;
}
interface PrismaFlowConfig {
    port?: number;
    logLevel?: LogLevel;
    openBrowser?: boolean;
    features?: Partial<FeatureFlags>;
    webhooks?: WebhookConfig[];
    /** Named environments for cross-env comparison */
    environments?: Array<{
        name: string;
        databaseUrl: string;
    }>;
    /** Maximum audit log file size in MB before rotation (default: 10) */
    auditLogMaxMb?: number;
    /** Risk threshold that triggers warnings (default: medium) */
    riskThreshold?: RiskLevel;
}
type AuditAction = 'dashboard.start' | 'status.check' | 'drift.detect' | 'drift.repair' | 'migration.check' | 'migration.apply' | 'migration.simulate' | 'migration.rollback' | 'migration.inspect' | 'migration.history' | 'migration.create' | 'doctor.run' | 'env.compare' | 'schema.diff';
interface AuditEntry {
    timestamp: string;
    action: AuditAction;
    cwd: string;
    result: 'success' | 'failure' | 'warning';
    detail?: Record<string, unknown>;
}
interface RiskFactor {
    pattern: string;
    severity: RiskLevel;
    description: string;
    affectedTable?: string;
    estimatedRows?: number;
    recommendation: string;
}
interface MigrationRiskScore {
    /** Composite score 0-100 (higher = more dangerous) */
    score: number;
    level: RiskLevel;
    factors: RiskFactor[];
}
interface RollbackStep {
    /** Original forward statement index */
    index: number;
    forwardSql: string;
    rollbackSql: string;
    /** True if PrismaFlow can run this automatically */
    automated: boolean;
    warning?: string;
}
interface RollbackPlan {
    migrationName: string;
    steps: RollbackStep[];
    hasManualSteps: boolean;
    warnings: string[];
    generatedAt: string;
    /** True only when every step is automated */
    automated: boolean;
    /** Legacy — full SQL string rendered from steps */
    sql?: string;
}
type SimulationMode = 'static' | 'shadow' | 'live';
interface SimulationStatement {
    index: number;
    sql: string;
    type: 'CREATE_TABLE' | 'ALTER_TABLE' | 'DROP_TABLE' | 'CREATE_INDEX' | 'DROP_INDEX' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'OTHER';
    isDestructive: boolean;
    warnings: string[];
    estimatedRowsAffected?: number;
    /** Set when run against a real or shadow DB */
    success?: boolean;
    error?: string;
    durationMs?: number;
}
interface SimulationResult {
    migrationName: string;
    statements: SimulationStatement[];
    wouldSucceed: boolean;
    destructiveStatements: number;
    warnings: string[];
    simulatedAt: string;
    mode: SimulationMode;
    error?: string;
    /** Legacy fields for backwards compat */
    appliedStatements?: SimulationStatement[];
    errors?: string[];
    totalDurationMs?: number;
}
type DriftRepairStrategy = 'APPLY_MIGRATION' | 'SQUASH' | 'MANUAL_SQL' | 'IGNORE';
interface DriftRecoverySuggestion {
    driftItem: DriftItem;
    strategy: DriftRepairStrategy;
    description: string;
    sql?: string;
    automated: boolean;
    risk: 'low' | 'medium' | 'high';
}
type SchemaDiffType = 'model_added' | 'model_removed' | 'field_added' | 'field_removed' | 'field_type_changed' | 'added' | 'removed' | 'modified';
interface SchemaDiff {
    type: SchemaDiffType;
    /** Model/table name */
    modelName?: string;
    /** Field/column name (for field-level diffs) */
    fieldName?: string;
    oldType?: string;
    newType?: string;
    description: string;
    breaking: boolean;
    /** Legacy fields */
    entity?: string;
    field?: string;
    before?: string;
    after?: string;
}
interface MigrationHistoryDiff {
    sourceEnv: string;
    targetEnv: string;
    sourceApplied: number;
    targetApplied: number;
    onlyInSource: string[];
    onlyInTarget: string[];
    divergencePoint?: string;
    inSync: boolean;
    /** Legacy fields */
    name?: string;
    presentInSource?: boolean;
    presentInTarget?: boolean;
    statusInSource?: MigrationStatus;
    statusInTarget?: MigrationStatus;
}
interface EnvironmentEntry {
    name: string;
    reachable: boolean;
    appliedCount: number;
    pendingCount: number;
    failedCount: number;
}
interface EnvironmentComparison {
    referenceEnv: string;
    environments: EnvironmentEntry[];
    diffs: MigrationHistoryDiff[];
    allInSync: boolean;
    comparedAt: string;
    /** Legacy fields */
    source?: string;
    target?: string;
    schemaDiffs?: SchemaDiff[];
    migrationDiffs?: MigrationHistoryDiff[];
}
interface GitMigrationInfo {
    migrationName: string;
    committed: boolean;
    commitHash?: string;
    commitAuthor?: string;
    commitDate?: string;
    commitMessage?: string;
    /** Legacy fields */
    branch?: string;
    authorName?: string;
    committedAt?: string;
}
interface MigrationConflict {
    timestamp: string;
    migrations: string[];
    type: 'duplicate_timestamp' | 'timestamp-overlap' | 'name-conflict' | 'history-diverge';
    description: string;
    /** Legacy fields */
    migrationA?: string;
    migrationB?: string;
    branches?: string[];
    conflictType?: 'timestamp-overlap' | 'name-conflict' | 'history-diverge';
}
type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb';
interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}
interface Team {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
}
interface Project {
    id: string;
    name: string;
    organizationId: string;
    teamId?: string;
    createdAt: string;
    updatedAt: string;
}
interface Environment {
    id: string;
    name: string;
    projectId: string;
    provider: DatabaseProvider;
    /** Encrypted in SaaS mode */
    connectionString?: string;
    createdAt: string;
    updatedAt: string;
}
interface DeploymentEvent {
    id: string;
    projectId: string;
    environmentId: string;
    migrationsApplied: string[];
    appliedBy?: string;
    durationMs: number;
    success: boolean;
    error?: string;
    createdAt: string;
}
type SSEEventType = 'status-update' | 'drift-detected' | 'drift-resolved' | 'migration-applied' | 'migration-failed' | 'simulation-progress' | 'simulation-complete' | 'repair-progress' | 'repair-complete';
interface SSEEvent<T = unknown> {
    type: SSEEventType;
    data: T;
    timestamp: string;
}

declare const MigrationStatusSchema: z.ZodEnum<["applied", "pending", "failed"]>;
declare const RiskLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
declare const DriftTypeSchema: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
declare const DriftDetectionStatusSchema: z.ZodEnum<["clean", "drifted", "error"]>;
declare const LogLevelSchema: z.ZodEnum<["trace", "debug", "info", "warn", "error"]>;
declare const WebhookTypeSchema: z.ZodEnum<["slack", "discord", "http"]>;
declare const DatabaseProviderSchema: z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>;
declare const DriftRepairStrategySchema: z.ZodEnum<["fix-migration", "revert-manual", "sync-history"]>;
declare const SchemaDiffTypeSchema: z.ZodEnum<["added", "removed", "modified"]>;
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
declare const RiskFactorSchema: z.ZodObject<{
    pattern: z.ZodString;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    description: z.ZodString;
    affectedTable: z.ZodOptional<z.ZodString>;
    estimatedRows: z.ZodOptional<z.ZodNumber>;
    recommendation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    affectedTable?: string | undefined;
    estimatedRows?: number | undefined;
}, {
    pattern: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    affectedTable?: string | undefined;
    estimatedRows?: number | undefined;
}>;
declare const MigrationRiskScoreSchema: z.ZodObject<{
    score: z.ZodNumber;
    level: z.ZodEnum<["low", "medium", "high", "critical"]>;
    factors: z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        description: z.ZodString;
        affectedTable: z.ZodOptional<z.ZodString>;
        estimatedRows: z.ZodOptional<z.ZodNumber>;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }, {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }[];
}, {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    factors: {
        pattern: string;
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        recommendation: string;
        affectedTable?: string | undefined;
        estimatedRows?: number | undefined;
    }[];
}>;
declare const RollbackPlanSchema: z.ZodObject<{
    migrationName: z.ZodString;
    sql: z.ZodString;
    warnings: z.ZodArray<z.ZodString, "many">;
    isAutoGenerated: z.ZodBoolean;
    isFullyReversible: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    migrationName: string;
    sql: string;
    warnings: string[];
    isAutoGenerated: boolean;
    isFullyReversible: boolean;
}, {
    migrationName: string;
    sql: string;
    warnings: string[];
    isAutoGenerated: boolean;
    isFullyReversible: boolean;
}>;
declare const MigrationDetailSchema: z.ZodObject<{
    name: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["applied", "pending", "failed"]>;
    sqlPath: z.ZodString;
} & {
    sql: z.ZodString;
    risks: z.ZodArray<z.ZodString, "many">;
    riskScore: z.ZodOptional<z.ZodObject<{
        score: z.ZodNumber;
        level: z.ZodEnum<["low", "medium", "high", "critical"]>;
        factors: z.ZodArray<z.ZodObject<{
            pattern: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            description: z.ZodString;
            affectedTable: z.ZodOptional<z.ZodString>;
            estimatedRows: z.ZodOptional<z.ZodNumber>;
            recommendation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }, {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }, {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    }>>;
    rollbackPlan: z.ZodOptional<z.ZodObject<{
        migrationName: z.ZodString;
        sql: z.ZodString;
        warnings: z.ZodArray<z.ZodString, "many">;
        isAutoGenerated: z.ZodBoolean;
        isFullyReversible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        migrationName: string;
        sql: string;
        warnings: string[];
        isAutoGenerated: boolean;
        isFullyReversible: boolean;
    }, {
        migrationName: string;
        sql: string;
        warnings: string[];
        isAutoGenerated: boolean;
        isFullyReversible: boolean;
    }>>;
    gitBranch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
    sql: string;
    risks: string[];
    riskScore?: {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
    rollbackPlan?: {
        migrationName: string;
        sql: string;
        warnings: string[];
        isAutoGenerated: boolean;
        isFullyReversible: boolean;
    } | undefined;
    gitBranch?: string | undefined;
}, {
    name: string;
    timestamp: string;
    status: "applied" | "pending" | "failed";
    sqlPath: string;
    sql: string;
    risks: string[];
    riskScore?: {
        score: number;
        level: "low" | "medium" | "high" | "critical";
        factors: {
            pattern: string;
            severity: "low" | "medium" | "high" | "critical";
            description: string;
            recommendation: string;
            affectedTable?: string | undefined;
            estimatedRows?: number | undefined;
        }[];
    } | undefined;
    rollbackPlan?: {
        migrationName: string;
        sql: string;
        warnings: string[];
        isAutoGenerated: boolean;
        isFullyReversible: boolean;
    } | undefined;
    gitBranch?: string | undefined;
}>;
declare const DriftItemSchema: z.ZodObject<{
    sql: z.ZodString;
    type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
    description: string;
    sql: string;
}, {
    type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
    description: string;
    sql: string;
}>;
declare const DriftResultSchema: z.ZodObject<{
    hasDrift: z.ZodBoolean;
    driftCount: z.ZodNumber;
    differences: z.ZodArray<z.ZodObject<{
        sql: z.ZodString;
        type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }>, "many">;
    cachedAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["clean", "drifted", "error"]>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "clean" | "drifted" | "error";
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }[];
    cachedAt: string | null;
    errorMessage?: string | undefined;
}, {
    status: "clean" | "drifted" | "error";
    hasDrift: boolean;
    driftCount: number;
    differences: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }[];
    cachedAt: string | null;
    errorMessage?: string | undefined;
}>;
declare const ProjectStatusSchema: z.ZodObject<{
    connected: z.ZodBoolean;
    migrationsApplied: z.ZodNumber;
    migrationsPending: z.ZodNumber;
    migrationsFailed: z.ZodNumber;
    driftDetected: z.ZodBoolean;
    driftCount: z.ZodNumber;
    riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    lastSync: z.ZodString;
    provider: z.ZodOptional<z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>>;
    projectName: z.ZodOptional<z.ZodString>;
    schemaPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    driftCount: number;
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    riskLevel: "low" | "medium" | "high" | "critical";
    lastSync: string;
    provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
    projectName?: string | undefined;
    schemaPath?: string | undefined;
}, {
    driftCount: number;
    connected: boolean;
    migrationsApplied: number;
    migrationsPending: number;
    migrationsFailed: number;
    driftDetected: boolean;
    riskLevel: "low" | "medium" | "high" | "critical";
    lastSync: string;
    provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | undefined;
    projectName?: string | undefined;
    schemaPath?: string | undefined;
}>;
declare const SimulationStatementSchema: z.ZodObject<{
    sql: z.ZodString;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    sql: string;
    durationMs: number;
    error?: string | undefined;
}, {
    success: boolean;
    sql: string;
    durationMs: number;
    error?: string | undefined;
}>;
declare const SimulationResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    migrationName: z.ZodString;
    appliedStatements: z.ZodArray<z.ZodObject<{
        sql: z.ZodString;
        success: z.ZodBoolean;
        error: z.ZodOptional<z.ZodString>;
        durationMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        sql: string;
        durationMs: number;
        error?: string | undefined;
    }, {
        success: boolean;
        sql: string;
        durationMs: number;
        error?: string | undefined;
    }>, "many">;
    errors: z.ZodArray<z.ZodString, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    totalDurationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    migrationName: string;
    warnings: string[];
    appliedStatements: {
        success: boolean;
        sql: string;
        durationMs: number;
        error?: string | undefined;
    }[];
    errors: string[];
    totalDurationMs: number;
}, {
    success: boolean;
    migrationName: string;
    warnings: string[];
    appliedStatements: {
        success: boolean;
        sql: string;
        durationMs: number;
        error?: string | undefined;
    }[];
    errors: string[];
    totalDurationMs: number;
}>;
declare const DriftRecoverySuggestionSchema: z.ZodObject<{
    driftItem: z.ZodObject<{
        sql: z.ZodString;
        type: z.ZodEnum<["table-missing", "table-extra", "column-mismatch", "index-change", "constraint-change", "unknown", "missing_migration", "extra_column", "extra_table", "modified_migration"]>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }, {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    }>;
    strategy: z.ZodEnum<["fix-migration", "revert-manual", "sync-history"]>;
    sql: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    isDestructive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    description: string;
    driftItem: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    };
    strategy: "fix-migration" | "revert-manual" | "sync-history";
    isDestructive: boolean;
    sql?: string | undefined;
}, {
    description: string;
    driftItem: {
        type: "table-missing" | "table-extra" | "column-mismatch" | "index-change" | "constraint-change" | "unknown" | "missing_migration" | "extra_column" | "extra_table" | "modified_migration";
        description: string;
        sql: string;
    };
    strategy: "fix-migration" | "revert-manual" | "sync-history";
    isDestructive: boolean;
    sql?: string | undefined;
}>;
declare const SchemaDiffSchema: z.ZodObject<{
    type: z.ZodEnum<["added", "removed", "modified"]>;
    entity: z.ZodString;
    field: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "added" | "removed" | "modified";
    entity: string;
    field?: string | undefined;
    before?: string | undefined;
    after?: string | undefined;
}, {
    type: "added" | "removed" | "modified";
    entity: string;
    field?: string | undefined;
    before?: string | undefined;
    after?: string | undefined;
}>;
declare const MigrationHistoryDiffSchema: z.ZodObject<{
    name: z.ZodString;
    presentInSource: z.ZodBoolean;
    presentInTarget: z.ZodBoolean;
    statusInSource: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed"]>>;
    statusInTarget: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    presentInSource: boolean;
    presentInTarget: boolean;
    statusInSource?: "applied" | "pending" | "failed" | undefined;
    statusInTarget?: "applied" | "pending" | "failed" | undefined;
}, {
    name: string;
    presentInSource: boolean;
    presentInTarget: boolean;
    statusInSource?: "applied" | "pending" | "failed" | undefined;
    statusInTarget?: "applied" | "pending" | "failed" | undefined;
}>;
declare const EnvironmentComparisonSchema: z.ZodObject<{
    source: z.ZodString;
    target: z.ZodString;
    schemaDiffs: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["added", "removed", "modified"]>;
        entity: z.ZodString;
        field: z.ZodOptional<z.ZodString>;
        before: z.ZodOptional<z.ZodString>;
        after: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "added" | "removed" | "modified";
        entity: string;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }, {
        type: "added" | "removed" | "modified";
        entity: string;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }>, "many">;
    migrationDiffs: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        presentInSource: z.ZodBoolean;
        presentInTarget: z.ZodBoolean;
        statusInSource: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed"]>>;
        statusInTarget: z.ZodOptional<z.ZodEnum<["applied", "pending", "failed"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        presentInSource: boolean;
        presentInTarget: boolean;
        statusInSource?: "applied" | "pending" | "failed" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | undefined;
    }, {
        name: string;
        presentInSource: boolean;
        presentInTarget: boolean;
        statusInSource?: "applied" | "pending" | "failed" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | undefined;
    }>, "many">;
    comparedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    source: string;
    target: string;
    schemaDiffs: {
        type: "added" | "removed" | "modified";
        entity: string;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }[];
    migrationDiffs: {
        name: string;
        presentInSource: boolean;
        presentInTarget: boolean;
        statusInSource?: "applied" | "pending" | "failed" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | undefined;
    }[];
    comparedAt: string;
}, {
    source: string;
    target: string;
    schemaDiffs: {
        type: "added" | "removed" | "modified";
        entity: string;
        field?: string | undefined;
        before?: string | undefined;
        after?: string | undefined;
    }[];
    migrationDiffs: {
        name: string;
        presentInSource: boolean;
        presentInTarget: boolean;
        statusInSource?: "applied" | "pending" | "failed" | undefined;
        statusInTarget?: "applied" | "pending" | "failed" | undefined;
    }[];
    comparedAt: string;
}>;
declare const GitMigrationInfoSchema: z.ZodObject<{
    migrationName: z.ZodString;
    branch: z.ZodString;
    commitHash: z.ZodOptional<z.ZodString>;
    authorName: z.ZodOptional<z.ZodString>;
    committedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    migrationName: string;
    branch: string;
    commitHash?: string | undefined;
    authorName?: string | undefined;
    committedAt?: string | undefined;
}, {
    migrationName: string;
    branch: string;
    commitHash?: string | undefined;
    authorName?: string | undefined;
    committedAt?: string | undefined;
}>;
declare const MigrationConflictSchema: z.ZodObject<{
    migrationA: z.ZodString;
    migrationB: z.ZodString;
    branches: z.ZodArray<z.ZodString, "many">;
    conflictType: z.ZodEnum<["timestamp-overlap", "name-conflict", "history-diverge"]>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    migrationA: string;
    migrationB: string;
    branches: string[];
    conflictType: "timestamp-overlap" | "name-conflict" | "history-diverge";
}, {
    description: string;
    migrationA: string;
    migrationB: string;
    branches: string[];
    conflictType: "timestamp-overlap" | "name-conflict" | "history-diverge";
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
declare const WebhookEventSchema: z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>;
declare const WebhookConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["slack", "discord", "http"]>;
    url: z.ZodString;
    events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
}, {
    type: "slack" | "discord" | "http";
    url: string;
    events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
}>;
declare const FeatureFlagsSchema: z.ZodObject<{
    riskAnalysis: z.ZodDefault<z.ZodBoolean>;
    webhookAlerts: z.ZodDefault<z.ZodBoolean>;
    auditLog: z.ZodDefault<z.ZodBoolean>;
    ciAnnotations: z.ZodDefault<z.ZodBoolean>;
    envComparison: z.ZodDefault<z.ZodBoolean>;
    rollbackGen: z.ZodDefault<z.ZodBoolean>;
    simulation: z.ZodDefault<z.ZodBoolean>;
    gitAwareness: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    riskAnalysis: boolean;
    webhookAlerts: boolean;
    auditLog: boolean;
    ciAnnotations: boolean;
    envComparison: boolean;
    rollbackGen: boolean;
    simulation: boolean;
    gitAwareness: boolean;
}, {
    riskAnalysis?: boolean | undefined;
    webhookAlerts?: boolean | undefined;
    auditLog?: boolean | undefined;
    ciAnnotations?: boolean | undefined;
    envComparison?: boolean | undefined;
    rollbackGen?: boolean | undefined;
    simulation?: boolean | undefined;
    gitAwareness?: boolean | undefined;
}>;
declare const EnvironmentEntrySchema: z.ZodObject<{
    name: z.ZodString;
    databaseUrl: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    databaseUrl: string;
}, {
    name: string;
    databaseUrl: string;
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
        envComparison: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        rollbackGen: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        simulation: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        gitAwareness: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    }, {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    }>>;
    webhooks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["slack", "discord", "http"]>;
        url: z.ZodString;
        events: z.ZodOptional<z.ZodArray<z.ZodEnum<["drift-detected", "migration-failed", "check-complete", "migration-applied", "simulation-complete", "risk-threshold-exceeded"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }, {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }>, "many">>;
    environments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        databaseUrl: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        databaseUrl: string;
    }, {
        name: string;
        databaseUrl: string;
    }>, "many">>;
    auditLogMaxMb: z.ZodDefault<z.ZodNumber>;
    riskThreshold: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    port: number;
    logLevel: "error" | "trace" | "debug" | "info" | "warn";
    openBrowser: boolean;
    features: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    };
    webhooks: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }[];
    environments: {
        name: string;
        databaseUrl: string;
    }[];
    auditLogMaxMb: number;
    riskThreshold: "low" | "medium" | "high" | "critical";
}, {
    port?: number | undefined;
    logLevel?: "error" | "trace" | "debug" | "info" | "warn" | undefined;
    openBrowser?: boolean | undefined;
    features?: {
        riskAnalysis?: boolean | undefined;
        webhookAlerts?: boolean | undefined;
        auditLog?: boolean | undefined;
        ciAnnotations?: boolean | undefined;
        envComparison?: boolean | undefined;
        rollbackGen?: boolean | undefined;
        simulation?: boolean | undefined;
        gitAwareness?: boolean | undefined;
    } | undefined;
    webhooks?: {
        type: "slack" | "discord" | "http";
        url: string;
        events?: ("drift-detected" | "migration-failed" | "check-complete" | "migration-applied" | "simulation-complete" | "risk-threshold-exceeded")[] | undefined;
    }[] | undefined;
    environments?: {
        name: string;
        databaseUrl: string;
    }[] | undefined;
    auditLogMaxMb?: number | undefined;
    riskThreshold?: "low" | "medium" | "high" | "critical" | undefined;
}>;
type PrismaFlowConfigParsed = z.infer<typeof PrismaFlowConfigSchema>;
declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    slug: string;
    createdAt: string;
}, {
    name: string;
    id: string;
    slug: string;
    createdAt: string;
}>;
declare const TeamSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    organizationId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: string;
    organizationId: string;
}, {
    name: string;
    id: string;
    createdAt: string;
    organizationId: string;
}>;
declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    organizationId: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: string;
    organizationId: string;
    updatedAt: string;
    teamId?: string | undefined;
}, {
    name: string;
    id: string;
    createdAt: string;
    organizationId: string;
    updatedAt: string;
    teamId?: string | undefined;
}>;
declare const EnvironmentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    projectId: z.ZodString;
    provider: z.ZodEnum<["postgresql", "mysql", "sqlite", "sqlserver", "mongodb"]>;
    connectionString: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    provider: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb";
    id: string;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    connectionString?: string | undefined;
}, {
    name: string;
    provider: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb";
    id: string;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    connectionString?: string | undefined;
}>;
declare const DeploymentEventSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    environmentId: z.ZodString;
    migrationsApplied: z.ZodArray<z.ZodString, "many">;
    appliedBy: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodNumber;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    migrationsApplied: string[];
    durationMs: number;
    id: string;
    createdAt: string;
    projectId: string;
    environmentId: string;
    error?: string | undefined;
    appliedBy?: string | undefined;
}, {
    success: boolean;
    migrationsApplied: string[];
    durationMs: number;
    id: string;
    createdAt: string;
    projectId: string;
    environmentId: string;
    error?: string | undefined;
    appliedBy?: string | undefined;
}>;

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
declare class SimulationError extends PrismaFlowError {
    constructor(migrationName: string, cause: unknown);
}
declare class RollbackError extends PrismaFlowError {
    constructor(migrationName: string, detail: string);
}
declare class EnvironmentComparisonError extends PrismaFlowError {
    constructor(source: string, target: string, cause: unknown);
}
declare class GitAwarenessError extends PrismaFlowError {
    constructor(detail: string, cause?: unknown);
}
declare class FeatureGatedError extends PrismaFlowError {
    constructor(feature: string, requiredTier: string);
}
declare class DriftRepairError extends PrismaFlowError {
    constructor(detail: string, cause?: unknown);
}

export { type ApiError, type ApiResponse, type ApiSuccess, type AuditAction, type AuditEntry, ConfigurationError, DatabaseConnectionError, type DatabaseProvider, DatabaseProviderSchema, type DeploymentEvent, DeploymentEventSchema, DriftDetectionError, type DriftDetectionStatus, DriftDetectionStatusSchema, type DriftItem, DriftItemSchema, type DriftRecoverySuggestion, DriftRecoverySuggestionSchema, DriftRepairError, type DriftRepairStrategy, DriftRepairStrategySchema, type DriftResult, DriftResultSchema, type DriftType, DriftTypeSchema, type Environment, type EnvironmentComparison, EnvironmentComparisonError, EnvironmentComparisonSchema, type EnvironmentEntry, EnvironmentEntrySchema, EnvironmentSchema, type FeatureFlags, FeatureFlagsSchema, FeatureGatedError, GitAwarenessError, type GitMigrationInfo, GitMigrationInfoSchema, type LogLevel, LogLevelSchema, type Migration, MigrationAnalysisError, type MigrationConflict, MigrationConflictSchema, type MigrationDetail, MigrationDetailSchema, type MigrationHistoryDiff, MigrationHistoryDiffSchema, type MigrationRiskScore, MigrationRiskScoreSchema, MigrationSchema, type MigrationStatus, MigrationStatusSchema, type Organization, OrganizationSchema, type PaginatedResponse, type PaginationMeta, PaginationQuerySchema, type PrismaFlowConfig, type PrismaFlowConfigParsed, PrismaFlowConfigSchema, PrismaFlowError, type Project, ProjectSchema, type ProjectStatus, ProjectStatusSchema, type RiskFactor, RiskFactorSchema, type RiskLevel, RiskLevelSchema, RollbackError, type RollbackPlan, RollbackPlanSchema, type RollbackStep, type SSEEvent, type SSEEventType, type SchemaDiff, SchemaDiffSchema, type SchemaDiffType, SchemaDiffTypeSchema, SchemaNotFoundError, SimulationError, type SimulationMode, type SimulationResult, SimulationResultSchema, type SimulationStatement, SimulationStatementSchema, type Team, TeamSchema, UnauthorizedError, type WebhookConfig, WebhookConfigSchema, type WebhookEvent, WebhookEventSchema, type WebhookType, WebhookTypeSchema };
