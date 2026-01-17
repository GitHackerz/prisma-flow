'use client'

import { Badge } from "./ui/badge"

interface Status {
    connected: boolean
    migrationsFailed: number
    driftDetected: boolean
}

export function HealthCheck({ status }: { status: Status | null }) {
    if (!status) return <Badge variant="outline">Loading...</Badge>

    let health: 'healthy' | 'warning' | 'error' = 'healthy'
    let message = 'System Operational'

    if (status.migrationsFailed > 0) {
        health = 'error'
        message = 'Migration Failures'
    } else if (status.driftDetected) {
        health = 'warning'
        message = 'Schema Drift'
    } else if (!status.connected) {
        health = 'error'
        message = 'DB Disconnected'
    }

    const variants = {
        healthy: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
        error: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
    }
    
    const icons = {
        healthy: "✅",
        warning: "⚠️",
        error: "❌"
    }

    return (
        <Badge className={`px-3 py-1 text-sm font-medium border ${variants[health]}`}>
            <span className="mr-2">{icons[health]}</span>
            {message}
        </Badge>
    )
}
