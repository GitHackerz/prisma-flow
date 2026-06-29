import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from '../../lib/api'
import { NextActions } from './NextActions'

const baseStatus: ProjectStatus = {
  connected: true,
  migrationsApplied: 5,
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
        label: 'Database connection',
        passed: true,
        message: 'Database is reachable.',
      },
      {
        id: 'drift',
        label: 'Schema drift',
        passed: true,
        message: 'No drift detected.',
      },
    ],
  },
  lastSync: new Date().toISOString(),
}

describe('<NextActions />', () => {
  it('shows report and CI commands when the project is ready', () => {
    render(<NextActions status={baseStatus} />)

    expect(screen.getByText('Ready for review or deploy')).toBeTruthy()
    expect(screen.getByText('prisma-flow check --ci --json')).toBeTruthy()
    expect(
      screen.getByText('prisma-flow report --format markdown --output prismaflow-report.md'),
    ).toBeTruthy()
  })

  it('shows failed readiness checks with concrete remediation commands', () => {
    render(
      <NextActions
        status={{
          ...baseStatus,
          deploymentReadiness: {
            status: 'attention',
            score: 72,
            summary: 'Review pending migrations and critical risk before deployment',
            checks: [
              ...baseStatus.deploymentReadiness.checks,
              {
                id: 'pending-migrations',
                label: 'Pending migrations',
                passed: false,
                message: 'One migration is pending.',
              },
              {
                id: 'critical-risks',
                label: 'Critical risks',
                passed: false,
                message: 'One migration has critical destructive SQL.',
              },
            ],
          },
        }}
      />,
    )

    expect(screen.getByText('Pending migrations')).toBeTruthy()
    expect(screen.getByText('prisma migrate deploy')).toBeTruthy()
    expect(screen.getByText('Critical risks')).toBeTruthy()
    expect(screen.getByText('prisma-flow report --format markdown')).toBeTruthy()
  })

  it('preserves the dashboard auth token in related view links', async () => {
    window.history.replaceState({}, '', '/?token=secret-token')

    render(
      <NextActions
        status={{
          ...baseStatus,
          deploymentReadiness: {
            status: 'attention',
            score: 85,
            summary: 'Review drift before deployment',
            checks: [
              {
                id: 'drift',
                label: 'Schema drift',
                passed: false,
                message: 'Drift detected.',
              },
            ],
          },
        }}
      />,
    )

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Open related view' })
      expect(link.getAttribute('href')).toBe('/drift?token=secret-token')
    })
  })
})
