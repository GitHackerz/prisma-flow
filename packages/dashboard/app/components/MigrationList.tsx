'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Migration {
  name: string
  timestamp: string
  status: 'applied' | 'pending' | 'failed'
  sqlPath: string
}

export function MigrationList() {
    const [migrations, setMigrations] = useState<Migration[]>([])
    
    useEffect(() => {
        fetch('/api/migrations')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMigrations(data.data)
                }
            })
            .catch(console.error)
    }, [])

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow h-full">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Migrations</h3>
        <p className="text-sm text-muted-foreground">History of database changes.</p>
      </div>
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto max-h-[400px]">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b sticky top-0 bg-card z-10">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {migrations.map((migration) => (
                <tr key={migration.name} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium max-w-[150px] truncate" title={migration.name}>{migration.name}</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        migration.status === 'applied' ? 'bg-green-100 text-green-800' :
                        migration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {migration.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                    {format(new Date(migration.timestamp), 'PP')}
                  </td>
                </tr>
              ))}
              {migrations.length === 0 && (
                  <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">No migrations found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}