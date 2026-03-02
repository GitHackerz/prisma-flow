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
      `Could not reach the database server.${detail ? ' ' + detail : ''} Check DATABASE_URL in .env.`,
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
