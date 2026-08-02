import type { ProjectStatus } from '@prisma-flow/shared'
import { describe, expect, it } from 'vitest'
import { type AnalyzedMigration, createDeploymentPlanFromState } from '../core/deployment-plan.js'
import type { PrismaProject } from '../core/prisma-detector.js'

const project: PrismaProject = {
  schemaPath: '/project/prisma/schema.prisma',
  migrationsPath: '/project/prisma/migrations',
  databaseUrl: 'file:./dev.db',
  migrations: [],
  schemaContent: 'datasource db { provider = "sqlite" url = env("DATABASE_URL") }',
  provider: 'sqlite',
  packageManager: 'npm',
  prismaVersion: '^5.22.0',
}

const baseStatus: ProjectStatus = {
  connected: true,
  migrationsApplied: 1,
  migrationsPending: 0,
  migrationsFailed: 0,
  driftDetected: false,
  driftCount: 0,
  riskLevel: 'low',
  healthScore: 100,
  deploymentReadiness: {
    status: 'ready',
    score: 100,
    summary: 'Ready for deployment',
    checks: [
      {
        id: 'database',
        label: 'Database reachable',
        passed: true,
        message: 'PrismaFlow can reach the configured datasource.',
      },
      {
        id: 'pending-migrations',
        label: 'No pending migrations',
        passed: true,
        message: 'All local migrations are applied.',
      },
      {
        id: 'critical-risks',
        label: 'No critical migration risks',
        passed: true,
        message: 'No critical data-loss operations were detected.',
      },
    ],
  },
  lastSync: new Date().toISOString(),
  provider: 'sqlite',
  schemaPath: project.schemaPath,
  migrationsPath: project.migrationsPath,
  hasDatabaseUrl: true,
}

function migration(overrides: Partial<AnalyzedMigration>): AnalyzedMigration {
  return {
    name: '20260705120000_initial',
    timestamp: new Date('2026-07-05T12:00:00.000Z').toISOString(),
    status: 'applied',
    sqlPath: '/project/prisma/migrations/20260705120000_initial/migration.sql',
    risks: [],
    riskScore: {
      score: 0,
      level: 'low',
      factors: [],
    },
    ...overrides,
  }
}

describe('createDeploymentPlanFromState()', () => {
  it('creates a ready plan with review artifact commands', () => {
    const plan = createDeploymentPlanFromState({
      project,
      status: baseStatus,
      migrations: [migration({})],
    })

    expect(plan.decision).toBe('ready')
    expect(plan.actions[0]?.command).toBe(
      'prisma-flow report --format markdown --output prismaflow-report.md',
    )
    expect(
      plan.commands.some((command) => command.command === 'prisma-flow check --ci --json'),
    ).toBe(true)
  })

  it('adds simulation and deploy commands for pending migrations', () => {
    const pending = migration({
      name: '20260705130000_add_profile',
      status: 'pending',
    })

    const plan = createDeploymentPlanFromState({
      project,
      status: {
        ...baseStatus,
        migrationsPending: 1,
        deploymentReadiness: {
          ...baseStatus.deploymentReadiness,
          status: 'attention',
          score: 85,
          checks: [
            ...baseStatus.deploymentReadiness.checks.filter(
              (check) => check.id !== 'pending-migrations',
            ),
            {
              id: 'pending-migrations',
              label: 'No pending migrations',
              passed: false,
              message: '1 migration still pending.',
            },
          ],
        },
      },
      migrations: [migration({}), pending],
    })

    expect(plan.decision).toBe('attention')
    expect(plan.migrations.pendingNames).toEqual(['20260705130000_add_profile'])
    expect(
      plan.commands.some(
        (command) =>
          command.command ===
          'prisma-flow simulate 20260705130000_add_profile --fail-on-destructive',
      ),
    ).toBe(true)
    expect(plan.commands.some((command) => command.command === 'prisma migrate deploy')).toBe(true)
  })

  it('blocks on destructive SQL with an inspect rollback action', () => {
    const destructive = migration({
      name: '20260705140000_drop_email',
      status: 'pending',
      risks: ['Drops column — potential data loss'],
      riskScore: {
        score: 68,
        level: 'high',
        factors: [
          {
            pattern: 'DROP\\s+COLUMN',
            severity: 'critical',
            description: 'Removes a column and all data stored in it.',
            affectedTable: 'User',
            recommendation: 'Verify no application code reads this column before deploying.',
          },
        ],
      },
    })

    const plan = createDeploymentPlanFromState({
      project,
      status: {
        ...baseStatus,
        riskLevel: 'critical',
        healthScore: 68,
        deploymentReadiness: {
          ...baseStatus.deploymentReadiness,
          status: 'blocked',
          score: 68,
          checks: [
            ...baseStatus.deploymentReadiness.checks.filter(
              (check) => check.id !== 'critical-risks',
            ),
            {
              id: 'critical-risks',
              label: 'No critical migration risks',
              passed: false,
              message: 'At least one migration contains a critical data-loss operation.',
            },
          ],
        },
      },
      migrations: [destructive],
    })

    expect(plan.decision).toBe('blocked')
    expect(plan.migrations.highestRisk?.name).toBe('20260705140000_drop_email')
    expect(
      plan.actions.some(
        (action) =>
          action.priority === 'blocker' &&
          action.command === 'prisma-flow inspect 20260705140000_drop_email --rollback --sql',
      ),
    ).toBe(true)
  })
})
