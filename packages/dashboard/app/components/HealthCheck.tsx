'use client'

import { Badge } from './ui/badge'
import type { ProjectStatus } from '../../lib/api'

export function HealthCheck({ status }: { status: ProjectStatus | null }) {
  if (!status) return <Badge variant="outline">Connecting…</Badge>

  let health: 'healthy' | 'warning' | 'error' = 'healthy'
  let message = 'System Operational'

  if (status.migrationsFailed > 0) {
    health  = 'error'
    message = 'Migration Failures'
  } else if (status.driftDetected) {
    health  = 'warning'
    message = `Schema Drift (${status.driftCount})`
  } else if (!status.connected) {
    health  = 'error'
    message = 'DB Disconnected'
  }

  const variants: Record<typeof health, string> = {
    healthy: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
    error:   'bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20',
  }

  const icons: Record<typeof health, string> = {
    healthy: '✅',
    warning: '⚠️',
    error:   '❌',
  }

  return (
    <Badge className={`px-3 py-1 text-sm font-medium border ${variants[health]}`}>
      <span className="mr-2">{icons[health]}</span>
      {message}
    </Badge>
  )
}
