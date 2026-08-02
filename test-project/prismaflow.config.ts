import type { PrismaFlowConfig } from 'prisma-flow'

const config: PrismaFlowConfig = {
  /**
   * Port for the local dashboard server.
   * Can also be set via PRISMAFLOW_PORT env var.
   */
  port: 5555,

  /**
   * Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error'
   * Can also be set via PRISMAFLOW_LOG_LEVEL env var.
   */
  logLevel: 'info',

  /**
   * Automatically open the browser when the dashboard starts.
   */
  openBrowser: true,

  /**
   * V1 local-first feature flags. Core safety features are free.
   */
  features: {
    riskAnalysis: true,
    simulation: true,
    ciAnnotations: true,
  },

  /**
   * Named environments are reserved for the roadmap.
   * environments: [
   *   { name: 'staging',    databaseUrl: process.env.STAGING_DATABASE_URL! },
   *   { name: 'production', databaseUrl: process.env.PROD_DATABASE_URL! },
   * ],
   */
  environments: [],

  /**
   * Risk level that triggers warnings in CI output.
   * One of: 'low' | 'medium' | 'high' | 'critical'
   */
  riskThreshold: 'medium',
}

export default config
