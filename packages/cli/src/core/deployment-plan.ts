import type {
  DeploymentPlan,
  DeploymentPlanAction,
  DeploymentPlanCommand,
  DeploymentPlanDriftSummary,
  DeploymentReadinessCheck,
  ProjectStatus,
} from '@prisma-flow/shared'
import { getMigrations, getProjectStatus } from './migration-analyzer.js'
import { type PrismaProject, detectPrismaProject } from './prisma-detector.js'

export type AnalyzedMigration = Awaited<ReturnType<typeof getMigrations>>[number]

export interface DeploymentPlanState {
  project: PrismaProject
  status: ProjectStatus
  migrations: AnalyzedMigration[]
  drift?: DeploymentPlanDriftSummary
}

function uniqueCommands(commands: DeploymentPlanCommand[]): DeploymentPlanCommand[] {
  const seen = new Set<string>()
  return commands.filter((item) => {
    if (seen.has(item.command)) return false
    seen.add(item.command)
    return true
  })
}

function highestRiskMigration(migrations: AnalyzedMigration[]) {
  return [...migrations]
    .filter((migration) => migration.riskScore.score > 0)
    .sort((a, b) => b.riskScore.score - a.riskScore.score)[0]
}

function actionForCheck(
  check: DeploymentReadinessCheck,
  state: DeploymentPlanState,
  highestRisk: AnalyzedMigration | undefined,
): DeploymentPlanAction {
  const firstPending = state.migrations.find((migration) => migration.status === 'pending')

  switch (check.id) {
    case 'database':
      return {
        priority: 'blocker',
        title: state.status.hasDatabaseUrl
          ? 'Restore database connectivity'
          : 'Configure DATABASE_URL',
        detail: state.status.hasDatabaseUrl
          ? 'PrismaFlow found a database URL, but Prisma cannot reach the database. Check credentials, network access, and the target database process.'
          : 'Add a local DATABASE_URL before relying on migration status, drift, or simulation output.',
        command: 'prisma-flow doctor',
      }
    case 'drift':
      return {
        priority: 'blocker',
        title: 'Resolve schema drift before deploy',
        detail:
          'The live database does not match the Prisma schema or migration history. Review the drift evidence before applying new migrations.',
        command: 'prisma-flow repair --json',
        href: '/drift',
      }
    case 'failed-migrations':
      return {
        priority: 'blocker',
        title: 'Recover failed migration history',
        detail:
          'Failed migrations must be investigated and resolved intentionally before more migrations are applied.',
        command: 'prisma migrate resolve',
        href: '/migrations',
      }
    case 'pending-migrations':
      return {
        priority: 'recommended',
        title: 'Simulate pending migration SQL',
        detail: firstPending
          ? `Run a simulation for ${firstPending.name}, then deploy only after the output matches your expectations.`
          : 'Run simulation before applying pending migration SQL to a shared database.',
        command: firstPending
          ? `prisma-flow simulate ${firstPending.name} --fail-on-destructive`
          : 'prisma-flow simulate <migration> --fail-on-destructive',
        href: '/simulate',
      }
    case 'critical-risks':
      return {
        priority: 'blocker',
        title: 'Review destructive SQL and rollback limits',
        detail: highestRisk
          ? `${highestRisk.name} contains critical-risk SQL. Inspect the statements and rollback plan before approval.`
          : 'At least one migration contains destructive SQL. Inspect the SQL and rollback plan before approval.',
        command: highestRisk
          ? `prisma-flow inspect ${highestRisk.name} --rollback --sql`
          : 'prisma-flow report --format markdown',
        href: '/risks',
      }
  }
}

function buildActions(
  state: DeploymentPlanState,
  highestRisk: AnalyzedMigration | undefined,
): DeploymentPlanAction[] {
  const failedChecks = state.status.deploymentReadiness.checks.filter((check) => !check.passed)
  const actions = failedChecks.map((check) => actionForCheck(check, state, highestRisk))

  const firstPending = state.migrations.find((migration) => migration.status === 'pending')
  if (firstPending && !actions.some((action) => action.command === 'prisma migrate deploy')) {
    actions.push({
      priority: 'recommended',
      title: 'Deploy after review',
      detail:
        'Once drift, failures, and destructive SQL are handled, apply pending migrations with Prisma.',
      command: 'prisma migrate deploy',
      href: '/migrations',
    })
  }

  if (actions.length === 0) {
    actions.push({
      priority: 'recommended',
      title: 'Keep a review artifact',
      detail:
        'The project is ready. Save a PrismaFlow report for your pull request or release checklist.',
      command: 'prisma-flow report --format markdown --output prismaflow-report.md',
    })
  }

  return actions
}

function buildCommands(
  state: DeploymentPlanState,
  highestRisk: AnalyzedMigration | undefined,
): DeploymentPlanCommand[] {
  const firstPending = state.migrations.find((migration) => migration.status === 'pending')
  const commands: DeploymentPlanCommand[] = [
    {
      label: 'CI gate',
      command: 'prisma-flow check --ci --json',
      reason: 'Fail builds when migrations, drift, or configured risk thresholds are unsafe.',
    },
    {
      label: 'Review artifact',
      command: 'prisma-flow report --format markdown --output prismaflow-report.md',
      reason: 'Create a human-readable migration review summary for PRs and releases.',
    },
    {
      label: 'Dashboard',
      command: 'prisma-flow dashboard',
      reason:
        'Open the local visual dashboard for drift, timeline, rollback, and simulation review.',
    },
  ]

  if (firstPending) {
    commands.unshift(
      {
        label: 'Inspect pending migration',
        command: `prisma-flow inspect ${firstPending.name} --rollback --sql`,
        reason: 'Read generated SQL, risk factors, warnings, and rollback coverage before deploy.',
      },
      {
        label: 'Simulate pending migration',
        command: `prisma-flow simulate ${firstPending.name} --fail-on-destructive`,
        reason: 'Catch destructive or failing statements before touching a shared database.',
      },
    )
    commands.push({
      label: 'Apply migrations',
      command: 'prisma migrate deploy',
      reason: 'Use Prisma to apply reviewed migration files in production or CI.',
    })
  }

  if (state.status.driftDetected) {
    commands.unshift({
      label: 'Repair drift',
      command: 'prisma-flow repair --json',
      reason: 'Generate recovery suggestions for differences between schema and database.',
    })
  }

  if (state.status.migrationsFailed > 0) {
    commands.unshift({
      label: 'Resolve failed migration',
      command: 'prisma migrate resolve',
      reason: 'Mark failed migration state only after the database has been manually verified.',
    })
  }

  if (highestRisk && highestRisk.riskScore.level === 'critical') {
    commands.unshift({
      label: 'Critical-risk inspection',
      command: `prisma-flow inspect ${highestRisk.name} --rollback --sql`,
      reason: 'Review destructive SQL and rollback limitations before approval.',
    })
  }

  return uniqueCommands(commands)
}

function summarizeDecision(status: ProjectStatus): string {
  const failedChecks = status.deploymentReadiness.checks.filter((check) => !check.passed)
  if (failedChecks.length === 0) {
    return 'Ready: no blocking drift, failed migrations, pending work, or critical migration risks were detected.'
  }

  const issueLabels: Record<DeploymentReadinessCheck['id'], string> = {
    database: 'database connectivity',
    drift: 'schema drift',
    'failed-migrations': 'failed migrations',
    'pending-migrations': 'pending migrations',
    'critical-risks': 'critical migration risks',
  }
  const failedLabels = failedChecks.map((check) => issueLabels[check.id]).join(', ')
  if (status.deploymentReadiness.status === 'blocked') {
    return `Blocked: fix ${failedLabels} before deploying.`
  }

  return `Attention needed: review ${failedLabels} before deploying.`
}

export function createDeploymentPlanFromState(state: DeploymentPlanState): DeploymentPlan {
  const pending = state.migrations.filter((migration) => migration.status === 'pending')
  const failed = state.migrations.filter((migration) => migration.status === 'failed')
  const highestRisk = highestRiskMigration(pending.length > 0 ? pending : state.migrations)

  const drift: DeploymentPlanDriftSummary = state.drift ?? {
    status: state.status.driftDetected ? 'drifted' : 'clean',
    detected: state.status.driftDetected,
    count: state.status.driftCount,
  }

  return {
    schemaVersion: 'prismaflow-plan/v1',
    generatedAt: new Date().toISOString(),
    decision: state.status.deploymentReadiness.status,
    score: state.status.deploymentReadiness.score,
    summary: summarizeDecision(state.status),
    project: {
      schemaPath: state.project.schemaPath,
      migrationsPath: state.project.migrationsPath,
      ...(state.project.provider ? { provider: state.project.provider } : {}),
      ...(state.project.prismaVersion ? { prismaVersion: state.project.prismaVersion } : {}),
      ...(state.project.packageManager ? { packageManager: state.project.packageManager } : {}),
      hasDatabaseUrl: state.project.databaseUrl.length > 0,
    },
    checks: state.status.deploymentReadiness.checks,
    migrations: {
      total: state.migrations.length,
      applied: state.migrations.filter((migration) => migration.status === 'applied').length,
      pending: pending.length,
      failed: failed.length,
      pendingNames: pending.map((migration) => migration.name),
      failedNames: failed.map((migration) => migration.name),
      ...(highestRisk
        ? {
            highestRisk: {
              name: highestRisk.name,
              level: highestRisk.riskScore.level,
              score: highestRisk.riskScore.score,
              factors: highestRisk.riskScore.factors,
            },
          }
        : {}),
    },
    drift,
    actions: buildActions(state, highestRisk),
    commands: buildCommands(state, highestRisk),
    valueHighlights: [
      'Go/no-go deployment decision from the same migration state your CI and dashboard use.',
      'Risk-ranked SQL review, rollback guidance, and simulation commands before Prisma applies anything.',
      'Drift, failed migrations, pending work, and destructive statements are turned into concrete next actions.',
    ],
  }
}

export async function buildDeploymentPlan(cwd: string): Promise<DeploymentPlan> {
  const project = await detectPrismaProject(cwd)
  if (!project) throw new Error('No Prisma project found')

  const [status, migrations] = await Promise.all([getProjectStatus(cwd), getMigrations(cwd)])

  return createDeploymentPlanFromState({
    project,
    status,
    migrations,
  })
}
