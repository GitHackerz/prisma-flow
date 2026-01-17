'use client'

import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

export function DriftAlert() {
    const [drift, setDrift] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/drift')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.hasDrift) {
                    setDrift(data.data.differences)
                }
            })
            .catch(console.error)
    }, [])

  return (
    <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-400">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <h5 className="font-medium leading-none tracking-tight">Schema Drift Detected</h5>
      </div>
      <div className="mt-2 text-sm opacity-90">
        The database schema is out of sync with your Prisma schema.
        {drift.length > 0 && (
            <ul className="mt-2 list-disc pl-5 max-h-32 overflow-y-auto">
                {drift.map((d, i) => (
                    <li key={i} className="font-mono text-xs py-0.5">{d.type || 'Diff'}: {d.sql}</li>
                ))}
            </ul>
        )}
      </div>
    </div>
  )
}