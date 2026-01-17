'use client'

import { useEffect, useState } from 'react'

interface Migration {
    name: string
    timestamp: string
    status: 'applied' | 'pending' | 'failed'
}

export function MigrationTimeline() {
    const [migrations, setMigrations] = useState<Migration[]>([])

    useEffect(() => {
        fetch('/api/migrations')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMigrations(data.data.slice(0, 5)) // Show last 5
                }
            })
            .catch(console.error)
    }, [])
    
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow h-full">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Timeline</h3>
        <p className="text-sm text-muted-foreground">Recent activity.</p>
      </div>
      <div className="p-6 pt-0">
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {migrations.map((m, i) => (
                <div key={m.name} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                         m.status === 'applied' ? 'bg-emerald-500 text-emerald-50' : 
                         m.status === 'failed' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                        {m.status === 'applied' ? (
                            <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                                <path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" />
                            </svg>
                        ) : m.status === 'failed' ? (
                             <span className="font-bold">!</span>
                        ) : (
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                        )}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-900 uppercase text-xs">{m.status}</div>
                            <time className="font-mono text-xs text-indigo-500">{new Date(m.timestamp).toLocaleDateString()}</time>
                        </div>
                        <div className="text-slate-500 text-sm overflow-hidden text-ellipsis truncate" title={m.name}>{m.name}</div>
                    </div>
                </div>
            ))}
            {migrations.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No timeline data available.</div>
            )}
        </div>
      </div>
    </div>
  )
}