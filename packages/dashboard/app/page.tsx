'use client'

import { useEffect, useState } from 'react'
import { StatusCards } from './components/StatusCards'
import { MigrationTimeline } from './components/MigrationTimeline'
import { MigrationList } from './components/MigrationList'
import { DriftAlert } from './components/DriftAlert'
import { HealthCheck } from './components/HealthCheck'

interface Status {
  connected: boolean
  migrationsApplied: number
  migrationsPending: number
  migrationsFailed: number
  driftDetected: boolean
  riskLevel: 'low' | 'medium' | 'high'
  lastSync: string
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        // Use relative path since frontend is served by the API server
        const res = await fetch('/api/status')
        const data = await res.json()
        if (data.success) {
             setStatus(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground animate-pulse">Loading PrismaFlow...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight">PrismaFlow</h1>
            <p className="text-muted-foreground">Migration Management Dashboard</p>
        </div>
        <HealthCheck status={status} />
      </header>

      {status?.driftDetected && <DriftAlert />}

      {status && <StatusCards status={status} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <MigrationTimeline />
        <MigrationList />
      </div>
    </div>
  )
}
