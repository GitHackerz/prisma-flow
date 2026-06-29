'use client'

import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import useSWR from 'swr'
import type { MigrationRiskScore } from '../../lib/api'
import { SWR_KEYS, fetchRisks } from '../../lib/api'

type RiskRow = {
  name: string
  timestamp: string
  riskScore: MigrationRiskScore
}

function riskClass(level: string) {
  if (level === 'critical') return 'bg-destructive/10 text-destructive'
  if (level === 'high') return 'bg-orange-500/10 text-orange-600'
  if (level === 'medium') return 'bg-yellow-500/10 text-yellow-600'
  return 'bg-emerald-500/10 text-emerald-600'
}

function riskBorder(level: string) {
  if (level === 'critical') return 'border-destructive/40 bg-destructive/5'
  if (level === 'high') return 'border-orange-500/40 bg-orange-500/5'
  if (level === 'medium') return 'border-yellow-500/40 bg-yellow-500/5'
  return 'bg-card'
}

export default function RisksPage() {
  const { data, error, isLoading } = useSWR(SWR_KEYS.risks, fetchRisks, {
    refreshInterval: 30_000,
  })
  const risks = (data ?? []) as RiskRow[]
  const risky = risks.filter((item) => item.riskScore.factors.length > 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldAlert className="h-6 w-6" /> Migration Risk Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detect table drops, column drops, data type changes, constraint changes, nullable changes,
          and index modifications before deployment.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error instanceof Error ? error.message : 'Failed to load risk analysis'}
        </div>
      )}

      {!isLoading && !error && risky.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="font-medium text-foreground">No risky migrations detected</p>
          <p className="text-sm">All scanned migrations are currently classified as low risk.</p>
        </div>
      )}

      {risky.length > 0 && (
        <div className="space-y-4">
          {risky.map((item) => (
            <article
              key={item.name}
              className={`rounded-xl border p-4 shadow-sm ${riskBorder(item.riskScore.level)}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${riskClass(item.riskScore.level)}`}
                  >
                    {item.riskScore.level} risk
                  </span>
                  <h2 className="mt-2 truncate font-mono text-sm font-semibold">{item.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{item.riskScore.score}</p>
                  <p className="text-xs text-muted-foreground">Risk score</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {item.riskScore.factors.map((factor) => (
                  <div
                    key={`${item.name}-${factor.pattern}`}
                    className="rounded-lg border bg-background/70 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskClass(factor.severity)}`}
                      >
                        {factor.severity}
                      </span>
                      {factor.affectedTable && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {factor.affectedTable}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium">{factor.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recommendation: {factor.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
