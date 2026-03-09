'use client'

import { AlertTriangle, CheckCircle, Wrench } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { SWR_KEYS, applyRepairs, fetchRepairSuggestions } from '../../lib/api'

export default function RepairPage() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEYS.repair, fetchRepairSuggestions, {
    refreshInterval: 30_000,
  })
  const [applying, setApplying] = useState(false)

  async function handleApply() {
    setApplying(true)
    try {
      const results = await applyRepairs()
      const ok = results.filter((r) => r.success).length
      const fail = results.filter((r) => !r.success).length
      if (fail > 0) {
        toast.warning(`${ok} repairs applied, ${fail} failed`)
      } else {
        toast.success(`${ok} repair(s) applied successfully`)
      }
      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Repair failed')
    } finally {
      setApplying(false)
    }
  }

  const suggestions = (data?.suggestions ?? []) as Array<{
    strategy: string
    description: string
    automated: boolean
    risk: string
    sql?: string
  }>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" /> Drift Repair
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated suggestions to resolve database drift.
          </p>
        </div>
        {suggestions.some((s) => s.automated) && (
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Wrench className="h-4 w-4" />
            {applying ? 'Applying…' : 'Apply Auto-Repairs'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load repair suggestions'}
        </div>
      )}

      {data && !data.drifted && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
          <p className="font-medium">Database is in sync — no repairs needed.</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const riskClass =
              s.risk === 'high'
                ? 'border-destructive/40 bg-destructive/5'
                : s.risk === 'medium'
                  ? 'border-yellow-500/40 bg-yellow-500/5'
                  : 'bg-card'
            return (
              <div key={i} className={`rounded-lg border p-4 ${riskClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                        ${s.risk === 'high' ? 'bg-destructive/10 text-destructive' : s.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-emerald-500/10 text-emerald-600'}`}
                      >
                        {s.risk.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {s.strategy}
                      </span>
                    </div>
                    <p className="text-sm">{s.description}</p>
                    {s.sql && (
                      <pre className="mt-2 font-mono text-xs text-muted-foreground bg-muted/50 rounded p-2 whitespace-pre-wrap break-all">
                        {s.sql.slice(0, 200)}
                      </pre>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs ${s.automated ? 'text-emerald-600' : 'text-muted-foreground'}`}
                  >
                    {s.automated ? '⚡ auto' : '✋ manual'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
