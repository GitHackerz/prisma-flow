import { format } from 'date-fns'
import type { Migration } from '../../lib/api'

interface Props {
  migrations: Migration[]
  isLoading: boolean
  error?: string
}

export function MigrationList({ migrations, isLoading, error }: Props) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow h-full">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Migrations</h3>
        <p className="text-sm text-muted-foreground">History of database changes.</p>
      </div>
      <div className="p-6 pt-0">
        {error && (
          <p className="text-sm text-destructive py-4 text-center">
            ⚠️ Error loading migrations: {error}
          </p>
        )}

        {isLoading && !error && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && !error && (
          <div className="relative w-full overflow-auto max-h-[400px]">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b sticky top-0 bg-card z-10">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {migrations.map((migration) => (
                  <tr key={migration.name} className="border-b transition-colors hover:bg-muted/50">
                    <td
                      className="p-4 align-middle font-medium max-w-[150px] truncate"
                      title={migration.name}
                    >
                      {migration.name}
                    </td>
                    <td className="p-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          migration.status === 'applied'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : migration.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
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
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No migrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
