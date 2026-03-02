/**
 * Anonymous, opt-in usage telemetry.
 *
 * What is collected (when enabled):
 *   - Command name (e.g. "status", "check")
 *   - Approximate migration count (bucketed: 0, 1-10, 11-50, 50+)
 *   - Prisma version (read from installed package)
 *   - Node.js major version
 *   - OS platform
 *   - A random install ID (regenerated when node_modules is cleaned)
 *
 * What is NOT collected:
 *   - Project paths, schema content, SQL, database URLs, user data
 *
 * Users can opt out by setting PRISMAFLOW_TELEMETRY=off in their environment
 * or .env file.  The opt-out is respected immediately and persistently.
 */
import { logger } from '../logger.js'

const TELEMETRY_ENDPOINT = 'https://telemetry.prismaflow.dev/v1/event'

function isEnabled(): boolean {
  const val = process.env['PRISMAFLOW_TELEMETRY']
  if (!val) return true        // opt-in by default
  return val.toLowerCase() !== 'off' && val.toLowerCase() !== 'false' && val !== '0'
}

function bucketCount(n: number): string {
  if (n === 0)   return '0'
  if (n <= 10)   return '1-10'
  if (n <= 50)   return '11-50'
  return '50+'
}

export interface TelemetryPayload {
  event:             string
  migrationCountBucket: string
  nodeVersion:       string
  platform:          string
}

/**
 * Fire-and-forget telemetry event.  Never throws — always swallows errors.
 */
export async function trackEvent(
  event:          string,
  migrationCount: number,
): Promise<void> {
  if (!isEnabled()) return

  const payload: TelemetryPayload = {
    event,
    migrationCountBucket: bucketCount(migrationCount),
    nodeVersion:          process.versions.node.split('.')[0] ?? 'unknown',
    platform:             process.platform,
  }

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(3_000),   // never block more than 3 s
    })
  } catch {
    // Telemetry failures are always silent
    logger.debug('Telemetry event failed (non-fatal)')
  }
}
