export class PrismaFlowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'PrismaFlowError'
  }
}

export class SchemaNotFoundError extends PrismaFlowError {
  constructor(cwd: string) {
    super(
      `No Prisma schema found in ${cwd}. Run \`prisma init\` to create one.`,
      'SCHEMA_NOT_FOUND',
    )
    this.name = 'SchemaNotFoundError'
  }
}

export class DatabaseConnectionError extends PrismaFlowError {
  constructor(detail?: string) {
    super(
      `Could not reach the database server.${detail ? ` ${detail}` : ''} Check DATABASE_URL in .env.`,
      'DATABASE_UNREACHABLE',
    )
    this.name = 'DatabaseConnectionError'
  }
}

export class DriftDetectionError extends PrismaFlowError {
  constructor(cause: unknown) {
    super('Drift detection failed unexpectedly.', 'DRIFT_DETECTION_FAILED', cause)
    this.name = 'DriftDetectionError'
  }
}

export class MigrationAnalysisError extends PrismaFlowError {
  constructor(cause: unknown) {
    super('Migration analysis failed unexpectedly.', 'MIGRATION_ANALYSIS_FAILED', cause)
    this.name = 'MigrationAnalysisError'
  }
}

export class ConfigurationError extends PrismaFlowError {
  constructor(detail: string) {
    super(`Configuration error: ${detail}`, 'CONFIGURATION_ERROR')
    this.name = 'ConfigurationError'
  }
}

export class UnauthorizedError extends PrismaFlowError {
  constructor() {
    super('Unauthorized — valid auth token required.', 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class SimulationError extends PrismaFlowError {
  constructor(migrationName: string, cause: unknown) {
    super(`Migration simulation failed for "${migrationName}".`, 'SIMULATION_FAILED', cause)
    this.name = 'SimulationError'
  }
}

export class RollbackError extends PrismaFlowError {
  constructor(migrationName: string, detail: string) {
    super(`Rollback failed for "${migrationName}": ${detail}`, 'ROLLBACK_FAILED')
    this.name = 'RollbackError'
  }
}

export class EnvironmentComparisonError extends PrismaFlowError {
  constructor(source: string, target: string, cause: unknown) {
    super(
      `Environment comparison failed between "${source}" and "${target}".`,
      'ENV_COMPARISON_FAILED',
      cause,
    )
    this.name = 'EnvironmentComparisonError'
  }
}

export class GitAwarenessError extends PrismaFlowError {
  constructor(detail: string, cause?: unknown) {
    super(`Git awareness error: ${detail}`, 'GIT_AWARENESS_ERROR', cause)
    this.name = 'GitAwarenessError'
  }
}

export class FeatureGatedError extends PrismaFlowError {
  constructor(feature: string, requiredTier: string) {
    super(
      `Feature "${feature}" requires the ${requiredTier} tier. Upgrade at https://prismaflow.dev/pricing`,
      'FEATURE_GATED',
    )
    this.name = 'FeatureGatedError'
  }
}

export class DriftRepairError extends PrismaFlowError {
  constructor(detail: string, cause?: unknown) {
    super(`Drift repair failed: ${detail}`, 'DRIFT_REPAIR_FAILED', cause)
    this.name = 'DriftRepairError'
  }
}
