'use client'

import { AlertTriangle, CheckCircle2, KeyRound, Network, Rows3 } from 'lucide-react'
import useSWR from 'swr'
import type { SchemaField, SchemaModel } from '../../lib/api'
import { SWR_KEYS, fetchSchema } from '../../lib/api'

function fieldFlags(field: SchemaField) {
  const flags: string[] = []
  if (field.isId) flags.push('id')
  if (field.isUnique) flags.push('unique')
  if (field.isList) flags.push('list')
  if (!field.isRequired) flags.push('optional')
  return flags
}

function relationFields(model: SchemaModel) {
  return model.fields.filter((field) => field.kind === 'object')
}

export default function SchemaPage() {
  const { data, error, isLoading } = useSWR(SWR_KEYS.schema, fetchSchema, {
    refreshInterval: 60_000,
  })

  const models = data?.models ?? []
  const enums = data?.enums ?? []
  const relations = models.flatMap((model) =>
    relationFields(model).map((field) => ({
      from: model.name,
      to: field.type,
      field: field.name,
    })),
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Network className="h-6 w-6" /> Schema Explorer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize Prisma models, fields, relations, enums, indexes, and constraints.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error instanceof Error ? error.message : 'Failed to parse Prisma schema'}
        </div>
      )}

      {!isLoading && !error && models.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border py-16 text-muted-foreground">
          <Rows3 className="h-10 w-10 opacity-40" />
          <p className="text-sm">No Prisma models found in the schema.</p>
        </div>
      )}

      {models.length > 0 && (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-bold">{models.length}</p>
              <p className="text-xs text-muted-foreground">Models</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-bold">{relations.length}</p>
              <p className="text-xs text-muted-foreground">Relations</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-bold">{enums.length}</p>
              <p className="text-xs text-muted-foreground">Enums</p>
            </div>
          </section>

          <section className="mb-6 rounded-xl border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">ERD Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Model cards and relation edges derived from Prisma DMMF.
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {models.map((model) => (
                <div key={model.name} className="rounded-lg border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-mono text-sm font-semibold">{model.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {model.fields.length} fields
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {model.fields.slice(0, 6).map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          {field.isId && <KeyRound className="h-3 w-3 shrink-0 text-yellow-500" />}
                          <span className="truncate font-mono">{field.name}</span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">{field.type}</span>
                      </div>
                    ))}
                    {model.fields.length > 6 && (
                      <p className="pt-1 text-xs text-muted-foreground">
                        {model.fields.length - 6} more fields
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="grid gap-4 lg:grid-cols-2">
              {models.map((model) => (
                <article key={model.name} className="rounded-xl border bg-card p-4 shadow-sm">
                  <h2 className="font-mono text-lg font-semibold">{model.name}</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 font-medium">Field</th>
                          <th className="pb-2 font-medium">Type</th>
                          <th className="pb-2 font-medium">Constraints</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {model.fields.map((field) => {
                          const flags = fieldFlags(field)
                          return (
                            <tr key={field.name}>
                              <td className="py-2 font-mono text-xs">{field.name}</td>
                              <td className="py-2 font-mono text-xs text-muted-foreground">
                                {field.type}
                                {field.isList ? '[]' : ''}
                              </td>
                              <td className="py-2">
                                <div className="flex flex-wrap gap-1">
                                  {flags.length === 0 && (
                                    <span className="text-xs text-muted-foreground">required</span>
                                  )}
                                  {flags.map((flag) => (
                                    <span
                                      key={`${field.name}-${flag}`}
                                      className="rounded-full bg-muted px-1.5 py-0.5 text-xs"
                                    >
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold">Relations</h2>
                <div className="mt-3 space-y-2">
                  {relations.length === 0 && (
                    <p className="text-sm text-muted-foreground">No model relations detected.</p>
                  )}
                  {relations.map((relation) => (
                    <div
                      key={`${relation.from}-${relation.field}-${relation.to}`}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <p className="font-mono text-xs">
                        {relation.from} -&gt; {relation.to}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">via {relation.field}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold">Enums</h2>
                <div className="mt-3 space-y-2">
                  {enums.length === 0 && (
                    <p className="text-sm text-muted-foreground">No enums detected.</p>
                  )}
                  {enums.map((item) => (
                    <div key={item.name} className="rounded-lg border p-3">
                      <p className="font-mono text-xs font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.values.map((value) => value.name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
