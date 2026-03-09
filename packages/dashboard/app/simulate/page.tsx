'use client'

import { AlertTriangle, CheckCircle, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { SWR_KEYS, fetchMigrations, fetchSimulation } from '../../lib/api'

export default function SimulatePage() {
  const { data: migrationsData } = useSWR(SWR_KEYS.migrations(1, 50), () => fetchMigrations(1, 50))
  const [selected, setSelected] = useState<string | null>(null)
  const { data, error, isLoading } = useSWR(selected ? `/api/simulate/${selected}` : null, () =>
    fetchSimulation(selected!),
  )

  const migrations = migrationsData?.data ?? []

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <FlaskConical className="h-6 w-6" /> Simulate Migration
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Dry-run a migration to see which statements would execute.
      </p>

      <div className="mb-6">
        <label htmlFor="migration-select" className="block text-sm font-medium mb-1.5">
          Select migration
        </label>
        <select
          id="migration-select"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setSelected(e.target.value || null)}
          defaultValue=""
        >
          <option value="">— choose a migration —</option>
          {migrations.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
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
          {error instanceof Error ? error.message : 'Simulation failed'}
        </div>
      )}

      {data && (
        <>
          <div className="flex gap-4 mb-6">
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p
                className={`text-2xl font-bold ${data.wouldSucceed ? 'text-emerald-500' : 'text-destructive'}`}
              >
                {data.wouldSucceed ? 'PASS' : 'FAIL'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Would {data.wouldSucceed ? 'succeed' : 'fail'}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p className="text-2xl font-bold">{data.statements.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Statements</p>
            </div>
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p
                className={`text-2xl font-bold ${data.destructiveStatements > 0 ? 'text-yellow-500' : 'text-emerald-500'}`}
              >
                {data.destructiveStatements}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Destructive</p>
            </div>
            <div className="rounded-lg border bg-card p-4 flex-1 text-center">
              <p className="text-xs font-mono text-muted-foreground">{data.mode}</p>
              <p className="text-xs text-muted-foreground mt-1">Mode</p>
            </div>
          </div>

          {data.warnings.length > 0 && (
            <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4">
              <p className="font-medium text-yellow-700 dark:text-yellow-400 text-sm mb-2">
                Warnings
              </p>
              <ul className="space-y-1">
                {data.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠ {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {data.statements.map((stmt, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${stmt.isDestructive ? 'border-yellow-500/40 bg-yellow-500/5' : 'bg-card'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {stmt.isDestructive ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stmt.type}
                  </span>
                </div>
                <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-all">
                  {stmt.sql.slice(0, 200)}
                  {stmt.sql.length > 200 ? '…' : ''}
                </pre>
                {stmt.warnings.map((w, wi) => (
                  <p key={wi} className="mt-1 text-xs text-yellow-600">
                    ↳ {w}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {!selected && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <FlaskConical className="h-10 w-10 opacity-40" />
          <p className="text-sm">Select a migration above to run a simulation.</p>
        </div>
      )}
    </div>
  )
}
