'use client'

import { ArrowRight, CheckCircle2, FileText, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProjectStatus } from '../../lib/api'

type ReadinessCheck = ProjectStatus['deploymentReadiness']['checks'][number]

const nextActionByCheck: Record<
  ReadinessCheck['id'],
  { action: string; command: string; href?: string }
> = {
  database: {
    action: 'Set DATABASE_URL, confirm the database is reachable, then rerun diagnostics.',
    command: 'prisma-flow doctor',
  },
  drift: {
    action: 'Review drift evidence and reconcile the Prisma schema or database before deploying.',
    command: 'prisma-flow check --ci --json',
    href: '/drift',
  },
  'failed-migrations': {
    action: 'Investigate failed migrations and resolve Prisma migration history only after review.',
    command: 'prisma migrate resolve',
    href: '/migrations',
  },
  'pending-migrations': {
    action: 'Apply or intentionally defer pending migrations before shipping application code.',
    command: 'prisma migrate deploy',
    href: '/migrations',
  },
  'critical-risks': {
    action: 'Inspect destructive SQL and add a mitigation plan before approving the migration.',
    command: 'prisma-flow report --format markdown',
    href: '/risks',
  },
}

function withToken(href: string, token: string | null) {
  return token ? `${href}?token=${encodeURIComponent(token)}` : href
}

export function NextActions({ status }: { status: ProjectStatus }) {
  const [token, setToken] = useState<string | null>(null)
  const failedChecks = status.deploymentReadiness.checks.filter((check) => !check.passed)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  return (
    <section className="mt-8 rounded-xl border bg-card p-6 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Next Actions</h2>
          <p className="text-sm text-muted-foreground">
            Use these steps to turn the current readiness state into a deploy decision.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          CLI-ready
        </div>
      </div>

      {failedChecks.length === 0 ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-medium text-foreground">Ready for review or deploy</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Capture the current state in CI or attach a local report to your pull request.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {failedChecks.map((check) => {
            const nextAction = nextActionByCheck[check.id]
            return (
              <div key={check.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{nextAction.action}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{check.message}</p>
                  </div>
                  <div className="shrink-0 rounded-md bg-muted px-3 py-2 font-mono text-xs">
                    {nextAction.command}
                  </div>
                </div>
                {nextAction.href && (
                  <a
                    href={withToken(nextAction.href, token)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Open related view
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4 text-primary" />
            CI gate
          </div>
          <code className="block overflow-x-auto whitespace-nowrap font-mono text-xs text-muted-foreground">
            prisma-flow check --ci --json
          </code>
        </div>
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Review artifact
          </div>
          <code className="block overflow-x-auto whitespace-nowrap font-mono text-xs text-muted-foreground">
            prisma-flow report --format markdown --output prismaflow-report.md
          </code>
        </div>
      </div>
    </section>
  )
}
