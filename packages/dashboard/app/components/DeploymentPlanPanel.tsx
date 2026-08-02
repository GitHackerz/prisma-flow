'use client'

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Terminal,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DeploymentPlan } from '../../lib/api'

function withToken(href: string, token: string | null) {
  return token ? `${href}?token=${encodeURIComponent(token)}` : href
}

function decisionClasses(decision: DeploymentPlan['decision']) {
  if (decision === 'ready') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
  if (decision === 'attention') return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
  return 'bg-destructive/10 text-destructive border-destructive/30'
}

function priorityIcon(priority: DeploymentPlan['actions'][number]['priority']) {
  if (priority === 'blocker') return <Ban className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
  if (priority === 'recommended') {
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
  }
  return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
}

export function DeploymentPlanPanel({
  plan,
  isLoading,
  error,
}: {
  plan: DeploymentPlan | null
  isLoading: boolean
  error?: string
}) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  if (isLoading && !plan) {
    return (
      <section className="mt-8 rounded-xl border bg-card p-6 shadow">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Building deployment plan…
        </div>
      </section>
    )
  }

  if (error && !plan) {
    return (
      <section className="mt-8 rounded-xl border bg-card p-6 shadow">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Deployment Plan Unavailable</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!plan) return null

  return (
    <section className="mt-8 rounded-xl border bg-card p-6 shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardCheck className="h-4 w-4" />
            Deployment Plan
          </div>
          <h2 className="text-2xl font-semibold">Release decision and next steps</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{plan.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase ${decisionClasses(
              plan.decision,
            )}`}
          >
            {plan.decision}
          </span>
          <div className="rounded-md border px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-semibold">{plan.score}/100</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-semibold">{plan.migrations.pending}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Failed</p>
          <p className="mt-1 text-2xl font-semibold">{plan.migrations.failed}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Drift</p>
          <p className="mt-1 text-2xl font-semibold">{plan.drift.count}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Priority Actions</h3>
          <div className="mt-3 grid gap-3">
            {plan.actions.map((action) => (
              <div key={`${action.priority}-${action.title}`} className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  {priorityIcon(action.priority)}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
                      </div>
                      <span className="w-fit rounded-full border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                        {action.priority}
                      </span>
                    </div>
                    {action.command && (
                      <code className="mt-3 block max-w-full whitespace-pre-wrap break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                        {action.command}
                      </code>
                    )}
                    {action.href && (
                      <a
                        href={withToken(action.href, token)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Open related view
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Command Checklist</h3>
          <div className="mt-3 grid gap-3">
            {plan.commands.slice(0, 5).map((command) => (
              <div key={command.command} className="rounded-lg border bg-background/70 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Terminal className="h-4 w-4 text-primary" />
                  {command.label}
                </div>
                <code className="block max-w-full whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
                  {command.command}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">{command.reason}</p>
              </div>
            ))}
          </div>

          {plan.migrations.highestRisk && (
            <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <p className="text-sm font-medium">Highest risk migration</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {plan.migrations.highestRisk.name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {plan.migrations.highestRisk.level} risk, score {plan.migrations.highestRisk.score}
                /100
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Why PrismaFlow Adds Value</h3>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          {plan.valueHighlights.map((highlight) => (
            <div key={highlight} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
