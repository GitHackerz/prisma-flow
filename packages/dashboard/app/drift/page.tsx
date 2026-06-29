'use client'

import { AlertTriangle, CheckCircle2, DatabaseZap, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import type { DriftItem } from '../../lib/api'
import { SWR_KEYS, fetchDrift, forceDriftCheck } from '../../lib/api'

function driftWhere(item: DriftItem) {
  return item.identifier ?? item.migrationName ?? item.type.replaceAll('-', ' ')
}

function whyItMatters(item: DriftItem) {
  if (item.type === 'table-extra' || item.type === 'extra_table') {
    return 'The database contains a table that Prisma migrations do not manage.'
  }
  if (item.type === 'table-missing') {
    return 'The Prisma schema expects a table that is missing from the live database.'
  }
  if (item.type === 'column-mismatch' || item.type === 'extra_column') {
    return 'Application code and database columns may no longer agree.'
  }
  if (item.type === 'index-change') {
    return 'Query performance or uniqueness guarantees may differ from the schema.'
  }
  if (item.type === 'constraint-change') {
    return 'Database-level data integrity rules may differ from expected Prisma behavior.'
  }
  return 'The live database has changed outside the expected migration history.'
}

function suggestedAction(item: DriftItem) {
  if (item.type === 'table-extra' || item.type === 'extra_table') {
    return 'Confirm whether the table is intentional, then add it to Prisma or remove it through a migration.'
  }
  if (item.type === 'table-missing') {
    return 'Run or recreate the missing migration before deploying application code.'
  }
  if (item.type === 'column-mismatch' || item.type === 'extra_column') {
    return 'Generate a corrective migration or update schema.prisma to match the intended database state.'
  }
  if (item.type === 'missing_migration' || item.type === 'modified_migration') {
    return 'Restore migration history from source control and reconcile the database state.'
  }
  return 'Review the SQL difference and capture the intended change in a Prisma migration.'
}

export default function DriftPage() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEYS.drift, fetchDrift, {
    refreshInterval: 15_000,
  })
  const [checking, setChecking] = useState(false)

  async function handleCheck() {
    setChecking(true)
    try {
      await forceDriftCheck()
      await mutate()
      toast.success('Drift check complete')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Drift check failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <DatabaseZap className="h-6 w-6" /> Drift Detection
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detect manual database changes, schema mismatches, missing tables, missing columns, and
            unexpected modifications.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          Re-check
        </button>
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
          {error instanceof Error ? error.message : 'Failed to load drift data'}
        </div>
      )}

      {data && !data.hasDrift && (
        <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="font-medium text-foreground">No schema drift detected</p>
          <p className="text-sm">The live database matches the current Prisma schema.</p>
        </div>
      )}

      {data?.hasDrift && (
        <div className="space-y-4">
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
            <p className="font-medium text-yellow-700 dark:text-yellow-400">
              {data.driftCount} drift item{data.driftCount === 1 ? '' : 's'} detected
            </p>
            <p className="mt-1 text-sm text-yellow-700/90 dark:text-yellow-400/90">
              Review each difference before applying or deploying migrations.
            </p>
          </div>

          {data.differences.map((item) => (
            <article
              key={`${item.type}-${item.sql}`}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
                  {item.type}
                </span>
                <span className="font-mono text-sm font-semibold">{driftWhere(item)}</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    What changed
                  </p>
                  <p className="mt-1 text-sm">{item.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Why it matters
                  </p>
                  <p className="mt-1 text-sm">{whyItMatters(item)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Suggested action
                  </p>
                  <p className="mt-1 text-sm">{suggestedAction(item)}</p>
                </div>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                {item.sql}
              </pre>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
