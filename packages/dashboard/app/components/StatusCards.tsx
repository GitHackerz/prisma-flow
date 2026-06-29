import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Gauge } from 'lucide-react'
import type { ProjectStatus } from '../../lib/api'

function riskClass(level: ProjectStatus['riskLevel']) {
  if (level === 'critical' || level === 'high') return 'text-destructive'
  if (level === 'medium') return 'text-yellow-500'
  return 'text-green-500'
}

function readinessClass(status: ProjectStatus['deploymentReadiness']['status']) {
  if (status === 'blocked') return 'text-destructive'
  if (status === 'attention') return 'text-yellow-500'
  return 'text-green-500'
}

export function StatusCards({ status }: { status: ProjectStatus }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {/* Database Status */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Database Status</h3>
          <Database
            className={status.connected ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-destructive'}
          />
        </div>
        <div className="text-2xl font-bold">{status.connected ? 'Connected' : 'Disconnected'}</div>
        <p className="text-xs text-muted-foreground">
          {status.lastSync ? `Synced ${new Date(status.lastSync).toLocaleTimeString()}` : ''}
        </p>
      </div>

      {/* Pending Migrations */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Pending Migrations</h3>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold">{status.migrationsPending}</div>
        <p className="text-xs text-muted-foreground">{status.migrationsApplied} applied total</p>
      </div>

      {/* Failed Migrations */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Failed Migrations</h3>
          <AlertTriangle
            className={
              status.migrationsFailed > 0
                ? 'h-4 w-4 text-destructive'
                : 'h-4 w-4 text-muted-foreground'
            }
          />
        </div>
        <div className="text-2xl font-bold">{status.migrationsFailed}</div>
        <p className="text-xs text-muted-foreground">Action required if &gt; 0</p>
      </div>

      {/* Risk Level */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Risk Level</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-2xl font-bold capitalize ${riskClass(status.riskLevel)}`}>
          {status.riskLevel}
        </div>
        <p className="text-xs text-muted-foreground">Based on drift, failures, and SQL</p>
      </div>

      {/* Health Score */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Health Score</h3>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`text-2xl font-bold ${status.healthScore >= 90 ? 'text-green-500' : status.healthScore >= 70 ? 'text-yellow-500' : 'text-destructive'}`}
        >
          {status.healthScore}/100
        </div>
        <p className="text-xs text-muted-foreground">Schema and migration confidence</p>
      </div>

      {/* Deployment Readiness */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Readiness</h3>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`text-2xl font-bold capitalize ${readinessClass(status.deploymentReadiness.status)}`}
        >
          {status.deploymentReadiness.status}
        </div>
        <p className="text-xs text-muted-foreground">{status.deploymentReadiness.summary}</p>
      </div>
    </div>
  )
}
