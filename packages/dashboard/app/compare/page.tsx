'use client'

import { AlertTriangle, CheckCircle, GitBranch } from 'lucide-react'
import useSWR from 'swr'
import { SWR_KEYS, fetchComparison } from '../../lib/api'

export default function ComparePage() {
  const { data, error, isLoading } = useSWR(SWR_KEYS.compare, fetchComparison, {
    refreshInterval: 60_000,
  })

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <GitBranch className="h-6 w-6" /> Environment Comparison
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Compare migration state across all configured environments.
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load comparison'}
        </div>
      )}

      {data && (
        <>
          <div
            className={`mb-6 rounded-lg border p-4 flex items-center gap-3 ${
              data.allInSync
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-yellow-500/40 bg-yellow-500/10'
            }`}
          >
            {data.allInSync ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            )}
            <p className="text-sm font-medium">
              {data.allInSync
                ? 'All environments are in sync.'
                : 'Environments are out of sync — review diffs below.'}
            </p>
          </div>

          {/* Environment summaries */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {data.environments.map((env) => (
              <div key={env.name} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`h-2 w-2 rounded-full ${env.reachable ? 'bg-emerald-500' : 'bg-destructive'}`}
                  />
                  <span className="font-semibold">{env.name}</span>
                  {!env.reachable && (
                    <span className="text-xs text-destructive ml-auto">unreachable</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-xl font-bold">{env.appliedCount}</p>
                    <p className="text-muted-foreground">applied</p>
                  </div>
                  <div>
                    <p
                      className={`text-xl font-bold ${env.pendingCount > 0 ? 'text-yellow-500' : ''}`}
                    >
                      {env.pendingCount}
                    </p>
                    <p className="text-muted-foreground">pending</p>
                  </div>
                  <div>
                    <p
                      className={`text-xl font-bold ${env.failedCount > 0 ? 'text-destructive' : ''}`}
                    >
                      {env.failedCount}
                    </p>
                    <p className="text-muted-foreground">failed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Diffs */}
          {data.diffs.map((diff, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 mb-3">
              <div className="flex items-center gap-2 mb-3">
                {diff.inSync ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium">
                  {diff.sourceEnv} ↔ {diff.targetEnv}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {diff.sourceApplied} vs {diff.targetApplied} applied
                </span>
              </div>
              {!diff.inSync && (
                <div className="space-y-2 text-sm">
                  {diff.onlyInSource.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">Only in {diff.sourceEnv}: </span>
                      <span className="font-mono text-xs">{diff.onlyInSource.join(', ')}</span>
                    </p>
                  )}
                  {diff.onlyInTarget.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">Only in {diff.targetEnv}: </span>
                      <span className="font-mono text-xs">{diff.onlyInTarget.join(', ')}</span>
                    </p>
                  )}
                  {diff.divergencePoint && (
                    <p className="text-muted-foreground">
                      Diverged after:{' '}
                      <span className="font-mono text-xs">{diff.divergencePoint}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
