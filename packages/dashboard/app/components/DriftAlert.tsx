'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { fetchDrift, forceDriftCheck, SWR_KEYS } from '../../lib/api'
import type { DriftItem } from '../../lib/api'
import { useState } from 'react'
import { toast } from 'sonner'

export function DriftAlert() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEYS.drift, fetchDrift, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
  })

  const [checking, setChecking] = useState(false)

  async function handleForceCheck() {
    setChecking(true)
    try {
      await forceDriftCheck()
      await mutate()
      toast.success('Drift check complete')
    } catch {
      toast.error('Drift check failed')
    } finally {
      setChecking(false)
    }
  }

  // Only render once we have actual data confirming drift — never show prematurely
  if (isLoading || error || !data?.hasDrift) return null

  const differences: DriftItem[] = data.differences

  return (
    <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <h5 className="font-medium leading-none tracking-tight">
            Schema Drift Detected ({data.driftCount} difference{data.driftCount !== 1 ? 's' : ''})
          </h5>
        </div>
        <button
          onClick={handleForceCheck}
          disabled={checking}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-yellow-500/40 hover:bg-yellow-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
          Re-check
        </button>
      </div>

      <p className="mt-2 text-sm opacity-90">
        The database schema is out of sync with your Prisma schema.
      </p>

      {differences.length > 0 && (
        <ul className="mt-2 list-disc pl-5 max-h-32 overflow-y-auto space-y-0.5">
          {differences.map((d, i) => (
            <li key={i} className="font-mono text-xs py-0.5">
              <span className="font-semibold">{d.description}:</span>{' '}
              <span className="opacity-80 break-all">{d.sql.slice(0, 120)}{d.sql.length > 120 ? '…' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}