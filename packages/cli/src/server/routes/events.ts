/**
 * Server-Sent Events endpoint — pushes real-time migration/drift updates
 * to connected dashboard clients.
 *
 * GET /api/events
 *
 * Clients subscribe with:
 *   const es = new EventSource('/api/events?token=<token>')
 *   es.addEventListener('migration.check', handler)
 */

import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

// Simple in-process pub/sub — for single-server local use
type Listener = (event: string, data: unknown) => void
const listeners = new Set<Listener>()

/** Publish an event to all connected SSE clients. Called from route handlers. */
export function publishSSE(event: string, data: unknown): void {
  for (const listener of listeners) {
    try {
      listener(event, data)
    } catch {
      // ignore disconnected client errors
    }
  }
}

app.get('/', (c) => {
  return streamSSE(c, async (stream) => {
    // Send initial connected event
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ ts: new Date().toISOString() }),
    })

    // Register this client
    const listener: Listener = async (event, data) => {
      await stream.writeSSE({
        event,
        data: JSON.stringify(data),
      })
    }
    listeners.add(listener)

    // Heartbeat every 25s to keep the connection alive through proxies
    const heartbeat = setInterval(async () => {
      await stream.writeSSE({
        event: 'heartbeat',
        data: JSON.stringify({ ts: new Date().toISOString() }),
      })
    }, 25_000)

    // Clean up on disconnect
    stream.onAbort(() => {
      clearInterval(heartbeat)
      listeners.delete(listener)
    })

    // Keep stream open
    await stream.sleep(Number.MAX_SAFE_INTEGER)
  })
})

export default app
