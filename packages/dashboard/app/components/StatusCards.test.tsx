import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusCards } from '../app/components/StatusCards'
import type { ProjectStatus } from '../lib/api'

// Minimal stub for ProjectStatus
const baseStatus: ProjectStatus = {
  projectName: 'test-project',
  schemaPath: '/project/prisma/schema.prisma',
  hasMigrations: true,
  migrations: [],
  pending: [],
  failed: [],
  driftCount: 0,
  connected: true,
  migrationsPending: 0,
  migrationsApplied: 5,
  migrationsFailed: 0,
  riskLevel: 'low',
  lastSync: new Date().toISOString(),
}

describe('<StatusCards />', () => {
  it('shows Connected when database is connected', () => {
    render(<StatusCards status={baseStatus} />)
    expect(screen.getByText('Connected')).toBeTruthy()
  })

  it('shows Disconnected when database is not connected', () => {
    render(<StatusCards status={{ ...baseStatus, connected: false }} />)
    expect(screen.getByText('Disconnected')).toBeTruthy()
  })

  it('shows pending migration count', () => {
    render(<StatusCards status={{ ...baseStatus, migrationsPending: 3 }} />)
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('shows applied migration count', () => {
    render(<StatusCards status={{ ...baseStatus, migrationsApplied: 12 }} />)
    // "12 applied total" text
    expect(screen.getByText(/12 applied total/i)).toBeTruthy()
  })

  it('shows failed migration count', () => {
    render(<StatusCards status={{ ...baseStatus, migrationsFailed: 2 }} />)
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('shows risk level', () => {
    render(<StatusCards status={{ ...baseStatus, riskLevel: 'high' }} />)
    expect(screen.getByText('high')).toBeTruthy()
  })

  it('shows medium risk level with yellow styling', () => {
    render(<StatusCards status={{ ...baseStatus, riskLevel: 'medium' }} />)
    const el = screen.getByText('medium')
    expect(el.className).toContain('text-yellow-500')
  })
})
