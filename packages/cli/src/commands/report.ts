import fs from 'node:fs/promises'
import path from 'node:path'
import type { MigrationRiskScore, ProjectStatus, RiskFactor } from '@prisma-flow/shared'
import chalk from 'chalk'
import { Command } from 'commander'
import { detectDrift } from '../core/drift-detector.js'
import { getMigrations, getProjectStatus } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'

type ReportFormat = 'json' | 'markdown'

interface ReportMigration {
  name: string
  status: string
  createdAt?: string
  appliedAt?: string
  durationMs?: number
  riskScore: MigrationRiskScore
}

interface PrismaFlowReport {
  schemaVersion: 'prismaflow-report/v1'
  generatedAt: string
  project: {
    schemaPath: string
    migrationsPath: string
    provider?: string
    prismaVersion?: string
    packageManager?: string
    hasDatabaseUrl: boolean
  }
  summary: {
    connected: boolean
    migrationsApplied: number
    migrationsPending: number
    migrationsFailed: number
    driftDetected: boolean
    driftCount: number
    riskLevel: string
    healthScore: number
  }
  readiness: ProjectStatus['deploymentReadiness']
  migrations: ReportMigration[]
  drift: {
    status: string
    driftCount: number
    items: Array<{
      type: string
      description: string
      identifier?: string
      migrationName?: string
      sql: string
    }>
    errorMessage?: string
  }
  recommendations: string[]
}

function formatDate(value?: string): string {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString()
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return 'Not recorded'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function uniqueRecommendations(factors: RiskFactor[]): string[] {
  return Array.from(new Set(factors.map((factor) => factor.recommendation)))
}

function buildRecommendations(
  status: ProjectStatus,
  migrations: ReportMigration[],
  driftCount: number,
): string[] {
  const readinessActions = status.deploymentReadiness.checks
    .filter((check) => !check.passed)
    .map((check) => `${check.label}: ${check.message}`)

  const topRiskFactors = migrations
    .flatMap((migration) => migration.riskScore.factors)
    .filter((factor) => factor.severity === 'high' || factor.severity === 'critical')

  const recommendations = [
    ...readinessActions,
    ...uniqueRecommendations(topRiskFactors),
    ...(driftCount > 0
      ? ['Review drift details and reconcile the Prisma schema before deployment.']
      : []),
  ]

  return recommendations.length > 0
    ? recommendations
    : ['No blocking issues detected. Keep reviewing generated SQL before production deploys.']
}

function renderMarkdown(report: PrismaFlowReport): string {
  const lines = [
    '# PrismaFlow Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Project',
    '',
    `- Schema: ${report.project.schemaPath}`,
    `- Migrations: ${report.project.migrationsPath}`,
    `- Provider: ${report.project.provider ?? 'unknown'}`,
    `- Prisma version: ${report.project.prismaVersion ?? 'unknown'}`,
    `- Package manager: ${report.project.packageManager ?? 'unknown'}`,
    `- DATABASE_URL detected: ${report.project.hasDatabaseUrl ? 'yes' : 'no'}`,
    '',
    '## Summary',
    '',
    `- Database connected: ${report.summary.connected ? 'yes' : 'no'}`,
    `- Applied migrations: ${report.summary.migrationsApplied}`,
    `- Pending migrations: ${report.summary.migrationsPending}`,
    `- Failed migrations: ${report.summary.migrationsFailed}`,
    `- Drift: ${report.summary.driftDetected ? `${report.summary.driftCount} item(s)` : 'none'}`,
    `- Risk level: ${report.summary.riskLevel}`,
    `- Health score: ${report.summary.healthScore}/100`,
    `- Deployment readiness: ${report.readiness.summary} (${report.readiness.score}/100)`,
    '',
    '## Readiness Checks',
    '',
    '| Check | Status | Message |',
    '| --- | --- | --- |',
    ...report.readiness.checks.map(
      (check) => `| ${check.label} | ${check.passed ? 'pass' : 'fail'} | ${check.message} |`,
    ),
    '',
    '## Migration Timeline',
    '',
    '| Migration | Status | Created | Applied | Duration | Risk |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.migrations.map(
      (migration) =>
        `| ${migration.name} | ${migration.status} | ${formatDate(migration.createdAt)} | ${formatDate(
          migration.appliedAt,
        )} | ${formatDuration(migration.durationMs)} | ${migration.riskScore.level} (${migration.riskScore.score}) |`,
    ),
    '',
    '## Drift',
    '',
  ]

  if (report.drift.items.length === 0) {
    lines.push('No drift detected.')
  } else {
    for (const item of report.drift.items) {
      lines.push(`- ${item.type}: ${item.description}`)
    }
  }

  lines.push('', '## Recommendations', '')
  for (const recommendation of report.recommendations) {
    lines.push(`- ${recommendation}`)
  }

  return `${lines.join('\n')}\n`
}

async function writeReport(content: string, outputPath?: string): Promise<string | null> {
  if (!outputPath) {
    process.stdout.write(content)
    return null
  }

  const resolved = path.resolve(process.cwd(), outputPath)
  await fs.mkdir(path.dirname(resolved), { recursive: true })
  await fs.writeFile(resolved, content, 'utf-8')
  return resolved
}

function normalizeFormat(format: string | undefined, json?: boolean): ReportFormat {
  if (json) return 'json'
  if (format === 'md' || format === 'markdown') return 'markdown'
  return 'json'
}

export function reportCommand() {
  return new Command('report')
    .description('Generate a local PrismaFlow report for review or CI artifacts')
    .option('--format <format>', 'Output format: json or markdown', 'json')
    .option('--json', 'Shortcut for --format json')
    .option('-o, --output <path>', 'Write the report to a file instead of stdout')
    .action(async (options: { format?: string; json?: boolean; output?: string }) => {
      const cwd = process.cwd()
      const format = normalizeFormat(options.format, options.json)

      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          process.stderr.write(`${chalk.red('✖ No Prisma project found.')}\n`)
          process.exit(4)
        }

        const [status, migrations, drift] = await Promise.all([
          getProjectStatus(cwd),
          getMigrations(cwd),
          detectDrift(cwd),
        ])

        const reportMigrations = migrations.map((migration) => ({
          name: migration.name,
          status: migration.status,
          ...(migration.createdAt ? { createdAt: migration.createdAt } : {}),
          ...(migration.appliedAt ? { appliedAt: migration.appliedAt } : {}),
          ...(migration.durationMs !== undefined ? { durationMs: migration.durationMs } : {}),
          riskScore: migration.riskScore,
        }))

        const report: PrismaFlowReport = {
          schemaVersion: 'prismaflow-report/v1',
          generatedAt: new Date().toISOString(),
          project: {
            schemaPath: project.schemaPath,
            migrationsPath: project.migrationsPath,
            ...(project.provider ? { provider: project.provider } : {}),
            ...(project.prismaVersion ? { prismaVersion: project.prismaVersion } : {}),
            ...(project.packageManager ? { packageManager: project.packageManager } : {}),
            hasDatabaseUrl: project.databaseUrl.length > 0,
          },
          summary: {
            connected: status.connected,
            migrationsApplied: status.migrationsApplied,
            migrationsPending: status.migrationsPending,
            migrationsFailed: status.migrationsFailed,
            driftDetected: status.driftDetected,
            driftCount: status.driftCount,
            riskLevel: status.riskLevel,
            healthScore: status.healthScore,
          },
          readiness: status.deploymentReadiness,
          migrations: reportMigrations,
          drift: {
            status: drift.status,
            driftCount: drift.items.length,
            items: drift.items.map((item) => ({
              type: item.type,
              description: item.description,
              ...(item.identifier ? { identifier: item.identifier } : {}),
              ...(item.migrationName ? { migrationName: item.migrationName } : {}),
              sql: item.sql,
            })),
            ...(drift.errorMessage ? { errorMessage: drift.errorMessage } : {}),
          },
          recommendations: buildRecommendations(status, reportMigrations, drift.items.length),
        }

        const content =
          format === 'markdown' ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`
        const writtenPath = await writeReport(content, options.output)

        if (writtenPath) {
          process.stdout.write(`${chalk.green('✔ Report written:')} ${writtenPath}\n`)
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        process.stderr.write(`${chalk.red(`✖ Report failed: ${message}`)}\n`)
        process.exit(4)
      }
    })
}
