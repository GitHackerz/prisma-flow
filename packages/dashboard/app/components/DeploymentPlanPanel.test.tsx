import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DeploymentPlan } from '../../lib/api'
import { DeploymentPlanPanel } from './DeploymentPlanPanel'

const basePlan: DeploymentPlan = {
  schemaVersion: 'prismaflow-plan/v1',
  generatedAt: new Date().toISOString(),
  decision: 'ready',
  score: 100,
  summary: 'Ready: no blocking drift, failed migrations, pending work, or critical risks.',
  project: {
    schemaPath: '/project/prisma/schema.prisma',
    migrationsPath: '/project/prisma/migrations',
    provider: 'sqlite',
    prismaVersion: '^5.22.0',
    packageManager: 'npm',
    hasDatabaseUrl: true,
  },
  checks: [
    {
      id: 'database',
      label: 'Database reachable',
      passed: true,
      message: 'PrismaFlow can reach the configured datasource.',
    },
  ],
  migrations: {
    total: 1,
    applied: 1,
    pending: 0,
    failed: 0,
    pendingNames: [],
    failedNames: [],
  },
  drift: {
    status: 'clean',
    detected: false,
    count: 0,
  },
  actions: [
    {
      priority: 'recommended',
      title: 'Keep a review artifact',
      detail: 'Save a PrismaFlow report for your pull request.',
      command: 'prisma-flow report --format markdown --output prismaflow-report.md',
    },
  ],
  commands: [
    {
      label: 'CI gate',
      command: 'prisma-flow check --ci --json',
      reason: 'Fail builds when migrations, drift, or configured risk thresholds are unsafe.',
    },
  ],
  valueHighlights: [
    'Go/no-go deployment decision from the same migration state your CI and dashboard use.',
  ],
}

describe('<DeploymentPlanPanel />', () => {
  it('renders the release decision, score, actions, and commands', () => {
    render(<DeploymentPlanPanel plan={basePlan} isLoading={false} />)

    expect(screen.getByText('Release decision and next steps')).toBeTruthy()
    expect(screen.getByText('ready')).toBeTruthy()
    expect(screen.getByText('100/100')).toBeTruthy()
    expect(screen.getByText('Keep a review artifact')).toBeTruthy()
    expect(screen.getByText('prisma-flow check --ci --json')).toBeTruthy()
  })

  it('preserves the dashboard auth token in related action links', async () => {
    window.history.replaceState({}, '', '/?token=secret-token')

    render(
      <DeploymentPlanPanel
        plan={{
          ...basePlan,
          decision: 'blocked',
          score: 62,
          actions: [
            {
              priority: 'blocker',
              title: 'Resolve schema drift before deploy',
              detail: 'Review the drift evidence before applying new migrations.',
              command: 'prisma-flow repair --json',
              href: '/drift',
            },
          ],
        }}
        isLoading={false}
      />,
    )

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Open related view' })
      expect(link.getAttribute('href')).toBe('/drift?token=secret-token')
    })
  })
})
