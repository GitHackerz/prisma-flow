'use client'

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Database, XCircle } from 'lucide-react'
import useSWR from 'swr'
import type { Migration, MigrationRiskScore } from '../../lib/api'
import { SWR_KEYS, fetchMigrations } from '../../lib/api'

type MigrationWithRisk = Migration & {
  risks?: string[]
  riskScore?: MigrationRiskScore
}

function formatDate(value?: string) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString()
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return 'Not recorded by Prisma history'
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(1)} s`
}

function statusIcon(status: Migration['status']) {
  if (status === 'applied') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />
  return <Clock3 className="h-4 w-4 text-yellow-500" />
}

function statusClass(status: Migration['status']) {
  if (status === 'applied') return 'bg-emerald-500/10 text-emerald-600'
  if (status === 'failed') return 'bg-destructive/10 text-destructive'
  return 'bg-yellow-500/10 text-yellow-600'
}

function riskClass(level?: string) {
  if (level === 'critical') return 'bg-destructive/10 text-destructive'
  if (level === 'high') return 'bg-orange-500/10 text-orange-600'
  if (level === 'medium') return 'bg-yellow-500/10 text-yellow-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

export default function MigrationsPage() {
  const { data, error, isLoading } = useSWR(SWR_KEYS.migrations(1, 100), () =>
    fetchMigrations(1, 100),
  )
  const migrations = (data?.data ?? []) as MigrationWithRisk[]
  const summary = {
    applied: migrations.filter((migration) => migration.status === 'applied').length,
    pending: migrations.filter((migration) => migration.status === 'pending').length,
    failed: migrations.filter((migration) => migration.status === 'failed').length,
    risky: migrations.filter(
      (migration) =>
        migration.riskScore?.level === 'high' || migration.riskScore?.level === 'critical',
    ).length,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Database className="h-6 w-6" /> Migration Timeline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Applied, pending, and failed migrations with creation dates, applied dates, duration, and
          risk context.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error instanceof Error ? error.message : 'Failed to load migrations'}
        </div>
      )}

      {!isLoading && !error && migrations.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-muted-foreground">
          <Database className="h-10 w-10 opacity-40" />
          <p className="text-sm">No migrations found in this Prisma project.</p>
        </div>
      )}

      {migrations.length > 0 && (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Applied',
              value: summary.applied,
              color: 'text-emerald-600',
            },
            {
              label: 'Pending',
              value: summary.pending,
              color: 'text-yellow-600',
            },
            {
              label: 'Failed',
              value: summary.failed,
              color: 'text-destructive',
            },
            {
              label: 'High/Critical Risk',
              value: summary.risky,
              color: 'text-orange-600',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-card p-4">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>
      )}

      {migrations.length > 0 && (
        <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-border">
          {migrations.map((migration) => (
            <article key={migration.name} className="relative pl-12">
              <div className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                {statusIcon(migration.status)}
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(migration.status)}`}
                      >
                        {migration.status}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${riskClass(migration.riskScore?.level)}`}
                      >
                        {migration.riskScore?.level ?? 'low'} risk
                      </span>
                    </div>
                    <h2 className="mt-2 truncate font-mono text-sm font-semibold">
                      {migration.name}
                    </h2>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:min-w-[520px]">
                    <div className="rounded-lg border p-2">
                      <CalendarDays className="mb-1 h-3.5 w-3.5" />
                      <p className="font-medium text-foreground">Created</p>
                      <p>{formatDate(migration.createdAt ?? migration.timestamp)}</p>
                    </div>
                    <div className="rounded-lg border p-2">
                      <CheckCircle2 className="mb-1 h-3.5 w-3.5" />
                      <p className="font-medium text-foreground">Applied</p>
                      <p>{formatDate(migration.appliedAt)}</p>
                    </div>
                    <div className="rounded-lg border p-2">
                      <Clock3 className="mb-1 h-3.5 w-3.5" />
                      <p className="font-medium text-foreground">Duration</p>
                      <p>{formatDuration(migration.durationMs)}</p>
                    </div>
                  </div>
                </div>
                {migration.riskScore && migration.riskScore.factors.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {migration.riskScore.factors.slice(0, 3).map((factor) => (
                      <div
                        key={`${migration.name}-${factor.pattern}`}
                        className="rounded-lg bg-muted/50 p-3"
                      >
                        <p className="text-sm font-medium">{factor.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recommendation: {factor.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
