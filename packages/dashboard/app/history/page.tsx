'use client'

import { AlertTriangle, History } from 'lucide-react'
import useSWR from 'swr'
import type { Migration } from '../../lib/api'
import { SWR_KEYS, fetchMigrations } from '../../lib/api'

function RiskBadge({ level }: { level: string | undefined }) {
  if (!level) return null
  const classes =
    {
      critical: 'bg-destructive/10 text-destructive',
      high: 'bg-orange-500/10 text-orange-600',
      medium: 'bg-yellow-500/10 text-yellow-600',
      low: 'bg-emerald-500/10 text-emerald-600',
    }[level] ?? 'bg-muted text-muted-foreground'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {level}
    </span>
  )
}

function StatusDot({ status }: { status?: string }) {
  const color =
    status === 'applied'
      ? 'bg-emerald-500'
      : status === 'failed'
        ? 'bg-destructive'
        : status === 'pending'
          ? 'bg-yellow-500'
          : 'bg-muted-foreground'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
}

export default function HistoryPage() {
  const { data, error, isLoading } = useSWR(SWR_KEYS.migrations(1, 100), () =>
    fetchMigrations(1, 100),
  )

  const migrations: Migration[] = data?.data ?? []

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <History className="h-6 w-6" /> Migration History
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        All migrations with status, risk level, and timestamps.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load migrations'}
        </div>
      )}

      {migrations.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Migration</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Risk</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {migrations.map((m) => {
                let ts = '—'
                try {
                  const d = new Date(m.appliedAt ?? m.timestamp)
                  ts = Number.isNaN(d.getTime())
                    ? (m.appliedAt ?? m.timestamp ?? '—').slice(0, 10)
                    : d.toLocaleString()
                } catch {
                  /* noop */
                }
                return (
                  <tr key={m.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <StatusDot status={m.status} />
                        <span className="text-xs text-muted-foreground">
                          {m.status ?? 'applied'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-medium max-w-xs truncate">
                      {m.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskBadge
                        level={
                          (m as Migration & { riskScore?: { level?: string } }).riskScore?.level
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {ts}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {migrations.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <History className="h-10 w-10 opacity-40" />
          <p className="text-sm">No migrations found.</p>
        </div>
      )}
    </div>
  )
}
