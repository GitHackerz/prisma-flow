import type { Migration } from '../../lib/api'

interface Props {
  migrations: Migration[]
  isLoading:  boolean
}

export function MigrationTimeline({ migrations, isLoading }: Props) {
  const recent = migrations.slice(0, 5)

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow h-full">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Timeline</h3>
        <p className="text-sm text-muted-foreground">Most recent activity.</p>
      </div>
      <div className="p-6 pt-0">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {recent.map((m) => (
              <div
                key={m.name}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                {/* Status dot */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                    m.status === 'applied' ? 'bg-emerald-500 text-emerald-50 border-emerald-600' :
                    m.status === 'failed'  ? 'bg-destructive text-destructive-foreground border-destructive' :
                    'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {m.status === 'applied' ? (
                    <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="10">
                      <path fillRule="nonzero" d="M10.422 1.257 4.655 7.025 2.553 4.923A.916.916 0 0 0 1.257 6.22l2.75 2.75a.916.916 0 0 0 1.296 0l6.415-6.416a.916.916 0 0 0-1.296-1.296Z" />
                    </svg>
                  ) : m.status === 'failed' ? (
                    <span className="font-bold text-xs">!</span>
                  ) : (
                    <span className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>

                {/* Card — uses theme tokens for dark mode compatibility */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded shadow">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-card-foreground uppercase text-xs">{m.status}</div>
                    <time className="font-mono text-xs text-primary">
                      {new Date(m.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                  <div
                    className="text-muted-foreground text-sm overflow-hidden text-ellipsis truncate"
                    title={m.name}
                  >
                    {m.name}
                  </div>
                </div>
              </div>
            ))}

            {recent.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No timeline data available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}