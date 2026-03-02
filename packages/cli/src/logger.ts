/**
 * Structured logger for PrismaFlow CLI.
 * Uses pino when available; falls back to a lightweight console-based logger
 * so the CLI works even before `npm install` has completed (e.g. during
 * first-run evaluation).
 */

import { createRequire } from 'module'

interface LogFn {
  (obj: Record<string, unknown>, msg: string): void
  (msg: string): void
}

interface Logger {
  trace: LogFn
  debug: LogFn
  info:  LogFn
  warn:  LogFn
  error: LogFn
  child(bindings: Record<string, unknown>): Logger
}

function makeConsoleLogger(level: string): Logger {
  const levels: Record<string, number> = { trace: 10, debug: 20, info: 30, warn: 40, error: 50 }
  const activeLevel = levels[level] ?? 30

  function write(severity: string, lvl: number, args: unknown[]): void {
    if (lvl < activeLevel) return
    const obj  = typeof args[0] === 'object' && args[0] !== null ? args[0] : {}
    const msg  = typeof args[0] === 'string' ? args[0] : (args[1] as string | undefined) ?? ''
    const line = JSON.stringify({ time: new Date().toISOString(), level: severity, ...obj, msg })
    if (lvl >= 40) process.stderr.write(line + '\n')
    else           process.stdout.write(line + '\n')
  }

  return {
    trace: (...a: unknown[]) => write('TRACE', 10, a),
    debug: (...a: unknown[]) => write('DEBUG', 20, a),
    info:  (...a: unknown[]) => write('INFO',  30, a),
    warn:  (...a: unknown[]) => write('WARN',  40, a),
    error: (...a: unknown[]) => write('ERROR', 50, a),
    child: (bindings) => makeConsoleLogger(level),
  } as unknown as Logger
}

function buildLogger(): Logger {
  const level  = (process.env['PRISMAFLOW_LOG_LEVEL'] ?? 'info').toLowerCase()
  const pretty = process.env['NODE_ENV'] !== 'production'

  try {
    const req  = createRequire(import.meta.url)
    const pino = req('pino') as (...args: unknown[]) => Logger
    if (pretty) {
      try {
        const transport = (pino as unknown as { transport: (opts: unknown) => unknown }).transport({
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        })
        return pino({ level }, transport)
      } catch {
        // pino-pretty not installed — plain pino
      }
    }
    return pino({ level })
  } catch {
    // pino not installed — use lightweight fallback
    return makeConsoleLogger(level)
  }
}

export const logger: Logger = buildLogger()
