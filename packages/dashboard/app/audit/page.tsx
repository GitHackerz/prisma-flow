'use client'

import { AlertTriangle, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { SWR_KEYS, fetchAuditLog } from '../../lib/api'

interface AuditEntry {
  timestamp: string
  action: string
  result: string
  meta?: Record<string, unknown>
}

export default function AuditPage() {
  const [limit, setLimit] = useState(100)
  const { data, error, isLoading } = useSWR(SWR_KEYS.audit, () => fetchAuditLog(limit), {
    revalidateOnFocus: false,
  })

  const entries = (data ?? []) as AuditEntry[]

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All PrismaFlow actions logged locally in <code>.prismaflow/audit.jsonl</code>.
          </p>
        </div>
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={250}>Last 250</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load audit log'}
        </div>
      )}

      {entries.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 opacity-40" />
          <p className="text-sm">No audit entries yet.</p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Result</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry, i) => {
                let ts = '—'
                try {
                  ts = new Date(entry.timestamp).toLocaleString()
                } catch {
                  /* noop */
                }
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {ts}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs font-medium">{entry.action}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.result === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : entry.result === 'warning'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {entry.result}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground truncate max-w-xs">
                      {entry.meta ? JSON.stringify(entry.meta) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
