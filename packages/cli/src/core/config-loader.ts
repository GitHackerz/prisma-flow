import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
/**
 * PrismaFlow configuration loader.
 *
 * Reads `prismaflow.config.ts` (or `.js`) from the current working directory,
 * validates with the Zod schema, merges environment variable overrides, and
 * returns a validated config object.
 *
 * All callers should use `getConfig()` — it caches the result so the config
 * file is only loaded once per process.
 */
import { type PrismaFlowConfigParsed, PrismaFlowConfigSchema } from '@prisma-flow/shared'
import { logger } from '../logger.js'

// ─── Cache ────────────────────────────────────────────────────────────────────

let _cached: PrismaFlowConfigParsed | null = null
let _cachedCwd: string | null = null

export function _resetConfigCache(): void {
  _cached = null
  _cachedCwd = null
}

// ─── Env var overrides ────────────────────────────────────────────────────────

function applyEnvOverrides(config: PrismaFlowConfigParsed): PrismaFlowConfigParsed {
  const overrides: Partial<PrismaFlowConfigParsed> = {}

  const port = process.env.PRISMAFLOW_PORT
  if (port) {
    const parsed = Number.parseInt(port, 10)
    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 65536) {
      overrides.port = parsed
    }
  }

  const logLevel = process.env.PRISMAFLOW_LOG_LEVEL
  if (logLevel) {
    const result = PrismaFlowConfigSchema.shape.logLevel.safeParse(logLevel)
    if (result.success) overrides.logLevel = result.data
  }

  const openBrowser = process.env.PRISMAFLOW_NO_OPEN
  if (openBrowser === '1' || openBrowser?.toLowerCase() === 'true') {
    overrides.openBrowser = false
  }

  const riskThreshold = process.env.PRISMAFLOW_RISK_THRESHOLD
  if (riskThreshold) {
    const result = PrismaFlowConfigSchema.shape.riskThreshold.safeParse(riskThreshold)
    if (result.success) overrides.riskThreshold = result.data
  }

  if (process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL) {
    const envWebhooks: PrismaFlowConfigParsed['webhooks'] = []
    if (process.env.SLACK_WEBHOOK_URL) {
      envWebhooks.push({ type: 'slack', url: process.env.SLACK_WEBHOOK_URL })
    }
    if (process.env.DISCORD_WEBHOOK_URL) {
      envWebhooks.push({ type: 'discord', url: process.env.DISCORD_WEBHOOK_URL })
    }
    // Merge — don't replace webhooks from config file
    overrides.webhooks = [...config.webhooks, ...envWebhooks]
  }

  return { ...config, ...overrides }
}

// ─── Config file discovery ────────────────────────────────────────────────────

const CONFIG_CANDIDATES = [
  'prismaflow.config.js',
  'prismaflow.config.mjs',
  'prismaflow.config.cjs',
  // .ts is handled via tsx / ts-node at runtime (best-effort)
  'prismaflow.config.ts',
]

async function findConfigFile(cwd: string): Promise<string | null> {
  for (const name of CONFIG_CANDIDATES) {
    const candidate = path.join(cwd, name)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

async function loadConfigFile(filePath: string): Promise<unknown> {
  try {
    // For .ts files TypeScript has to be stripped — we rely on the tool being
    // run via tsx or ts-node which sets up the transform.  If not available,
    // we fall back to require() for .cjs or dynamic import for .js/.mjs.
    const url = pathToFileURL(filePath).href
    const mod = await import(url)
    // Handle both `export default` (ESM) and `module.exports` (CJS)
    return mod?.default ?? mod
  } catch (err) {
    logger.debug({ err, filePath }, 'Could not load config file — using defaults')
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load, validate, and cache the PrismaFlow configuration.
 *
 * Resolution order:
 *   1. Config file in `cwd` (prismaflow.config.{js,mjs,cjs,ts})
 *   2. Environment variable overrides
 *   3. Schema defaults (port 5555, logLevel 'info', etc.)
 */
export async function getConfig(cwd = process.cwd()): Promise<PrismaFlowConfigParsed> {
  if (_cached && _cachedCwd === cwd) return _cached

  const configFile = await findConfigFile(cwd)
  let rawConfig: unknown = {}

  if (configFile) {
    logger.debug({ configFile }, 'Loading PrismaFlow config file')
    rawConfig = await loadConfigFile(configFile)
  } else {
    logger.debug('No prismaflow.config.* found — using defaults')
  }

  const result = PrismaFlowConfigSchema.safeParse(rawConfig ?? {})

  if (!result.success) {
    logger.warn(
      { errors: result.error.errors },
      'prismaflow.config.* has validation errors — falling back to defaults',
    )
    const defaults = PrismaFlowConfigSchema.parse({})
    const overridden = applyEnvOverrides(defaults)
    _cached = overridden
    _cachedCwd = cwd
    return overridden
  }

  const overridden = applyEnvOverrides(result.data)
  _cached = overridden
  _cachedCwd = cwd
  return overridden
}

/**
 * Synchronous variant — returns the cached config or throws if not yet loaded.
 * Use `getConfig()` on startup, then `getConfigSync()` in hot paths.
 */
export function getConfigSync(): PrismaFlowConfigParsed {
  if (!_cached) {
    // Return defaults without waiting for file I/O in synchronous contexts
    return PrismaFlowConfigSchema.parse({})
  }
  return _cached
}
