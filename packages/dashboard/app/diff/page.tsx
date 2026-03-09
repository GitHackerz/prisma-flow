'use client'

import { AlertTriangle, ArrowLeftRight, CheckCircle, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { SWR_KEYS, fetchDiff } from '../../lib/api'

function RiskBadge({ breaking }: { breaking: boolean }) {
  if (breaking) {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        BREAKING
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
      safe
    </span>
  )
}

export default function DiffPage() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEYS.diff, () => fetchDiff(), {
    refreshInterval: 30_000,
  })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" /> Schema Diff
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Difference between your Prisma schema and the live database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load diff'}
        </div>
      )}

      {data && (
        <>
          <div className="flex gap-4 mb-6">
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p className="text-2xl font-bold">{data.totalDiffs}</p>
              <p className="text-xs text-muted-foreground mt-1">Total differences</p>
            </div>
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p className="text-2xl font-bold text-destructive">{data.breakingDiffs}</p>
              <p className="text-xs text-muted-foreground mt-1">Breaking changes</p>
            </div>
          </div>

          {data.diffs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="font-medium">Schema is in sync with database</p>
              <p className="text-sm">No differences found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.diffs.map((diff, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <RiskBadge breaking={diff.breaking} />
                    <span className="font-mono text-sm font-semibold">
                      {diff.modelName
                        ? diff.fieldName
                          ? `${diff.modelName}.${diff.fieldName}`
                          : diff.modelName
                        : (diff.entity ?? 'unknown')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{diff.description}</p>
                  {(diff.oldType || diff.newType) && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {diff.oldType ?? '?'} → {diff.newType ?? '?'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
