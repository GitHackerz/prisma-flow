'use client'

import useSWR from 'swr'
import { fetchStatus, fetchMigrations, SWR_KEYS } from '../lib/api'
import { StatusCards }      from './components/StatusCards'
import { MigrationTimeline } from './components/MigrationTimeline'
import { MigrationList }    from './components/MigrationList'
import { DriftAlert }       from './components/DriftAlert'
import { HealthCheck }      from './components/HealthCheck'
import { ErrorBoundary }    from 'react-error-boundary'
import { Toaster }          from 'sonner'
import { AlertCircle, RefreshCw } from 'lucide-react'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      <button
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

  const {
    data: migrationsPage,
    error: migrationsError,
  } = useSWR(SWR_KEYS.migrations(1, 50), () => fetchMigrations(1, 50), {
    refreshInterval: 10_000,
  })

  if (statusLoading && !status) return <LoadingScreen />
  if (statusError && !status)   return <ConnectionError />

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <MigrationTimeline migrations={migrations} isLoading={!migrationsPage && !migrationsError} />
          <MigrationList     migrations={migrations} isLoading={!migrationsPage && !migrationsError} error={migrationsError?.message} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
