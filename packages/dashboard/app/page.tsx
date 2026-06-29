'use client'

import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import useSWR from 'swr'
import { SWR_KEYS, fetchMigrations, fetchStatus } from '../lib/api'
import { DriftAlert } from './components/DriftAlert'
import { HealthCheck } from './components/HealthCheck'
import { MigrationList } from './components/MigrationList'
import { MigrationTimeline } from './components/MigrationTimeline'
import { NextActions } from './components/NextActions'
import { StatusCards } from './components/StatusCards'

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading PrismaFlow…</p>
      </div>
    </div>
  )
}

function ConnectionError() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Could not reach the PrismaFlow API</h2>
      <p className="text-sm text-muted-foreground">
        Make sure the CLI is running on the same port and your auth token is valid.
      </p>
    </div>
  )
}

export default function Dashboard() {
  const {
    data: status,
    error: statusError,
    isLoading: statusLoading,
  } = useSWR(SWR_KEYS.status, fetchStatus, {
    refreshInterval: 5_000,
    revalidateOnFocus: true,
  })

  const { data: migrationsPage, error: migrationsError } = useSWR(
    SWR_KEYS.migrations(1, 50),
    () => fetchMigrations(1, 50),
    {
      refreshInterval: 10_000,
    },
  )

  if (statusLoading && !status) return <LoadingScreen />
  if (statusError && !status) return <ConnectionError />

  const migrations = migrationsPage?.data ?? []

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Toaster richColors position="top-right" />
      <div className="container mx-auto p-6 max-w-6xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">PrismaFlow</h1>
            <p className="text-muted-foreground">Migration Management Dashboard</p>
          </div>
          <HealthCheck status={status ?? null} />
        </header>

        {status?.driftDetected && <DriftAlert />}

        {status && <StatusCards status={status} />}

        {status && (
          <section className="mt-8 rounded-xl border bg-card p-6 shadow">
            <h2 className="text-lg font-semibold">Detected Project</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Provider</p>
                <p className="mt-1 font-mono text-sm">{status.provider ?? 'unknown'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Prisma</p>
                <p className="mt-1 font-mono text-sm">{status.prismaVersion ?? 'not found'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Package</p>
                <p className="mt-1 font-mono text-sm">{status.packageManager ?? 'unknown'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Database URL</p>
                <p className="mt-1 font-mono text-sm">
                  {status.hasDatabaseUrl ? 'detected' : 'not detected'}
                </p>
              </div>
            </div>
            <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
              Schema: {status.schemaPath ?? 'not detected'}
            </p>
          </section>
        )}

        {status && (
          <section className="mt-8 rounded-xl border bg-card p-6 shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Deployment Readiness</h2>
                <p className="text-sm text-muted-foreground">
                  {status.deploymentReadiness.summary} with a score of{' '}
                  {status.deploymentReadiness.score}/100.
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  status.deploymentReadiness.status === 'ready'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : status.deploymentReadiness.status === 'attention'
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : 'bg-destructive/10 text-destructive'
                }`}
              >
                {status.deploymentReadiness.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {status.deploymentReadiness.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 rounded-lg border p-3">
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {status && <NextActions status={status} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <MigrationTimeline
            migrations={migrations}
            isLoading={!migrationsPage && !migrationsError}
          />
          <MigrationList
            migrations={migrations}
            isLoading={!migrationsPage && !migrationsError}
            error={migrationsError?.message}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}
