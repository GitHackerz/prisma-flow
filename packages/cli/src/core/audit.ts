import fs from 'node:fs/promises'
import path from 'node:path'
/**
 * Audit log — appends structured entries to .prismaflow/audit.jsonl
 * in the user's project directory.  Entries are newline-delimited JSON
 * (JSONL) so they can be grepped or streamed by external tools.
 *
 * Rotation: when the log file exceeds `maxMb` (default 10 MB), it is rotated
 * to `audit.1.jsonl` and a fresh log is started.  Only one rotated archive
 * is kept to bound disk usage.
 */
import type { AuditAction, AuditEntry } from '@prisma-flow/shared'
import { logger } from '../logger.js'

export type { AuditAction, AuditEntry }

const AUDIT_DIR = '.prismaflow'
const AUDIT_FILE = 'audit.jsonl'
const AUDIT_ROTATED = 'audit.1.jsonl'
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

async function ensureAuditDir(cwd: string): Promise<string> {
  const dir = path.join(cwd, AUDIT_DIR)
  await fs.mkdir(dir, { recursive: true })
  return path.join(dir, AUDIT_FILE)
}

/**
 * Rotate audit.jsonl → audit.1.jsonl if the file exceeds maxBytes.
 * The previous audit.1.jsonl is overwritten.
 */
async function rotateIfNeeded(filePath: string, maxBytes: number): Promise<void> {
  try {
    const stat = await fs.stat(filePath)
    if (stat.size >= maxBytes) {
      const rotated = path.join(path.dirname(filePath), AUDIT_ROTATED)
      await fs.rename(filePath, rotated)
      logger.debug({ filePath, rotated }, 'Audit log rotated')
    }
  } catch {
    // File might not exist yet — that is fine
  }
}

/**
 * Append an audit entry.  Failures are swallowed so that audit logging
 * never interrupts the main workflow.
 */
export async function writeAuditEntry(
  cwd: string,
  action: AuditAction,
  result: AuditEntry['result'],
  detail?: Record<string, unknown>,
  maxMb = DEFAULT_MAX_BYTES / (1024 * 1024),
): Promise<void> {
  try {
    const filePath = await ensureAuditDir(cwd)
    await rotateIfNeeded(filePath, maxMb * 1024 * 1024)

    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      cwd,
      result,
      ...(detail !== undefined ? { detail } : {}),
    }
    await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf-8')
  } catch (err) {
    logger.warn({ err }, 'Audit log write failed (non-fatal)')
  }
}

/**
 * Read the last N entries from the audit log (newest first).
 */
export async function readAuditLog(cwd: string, limit = 100): Promise<AuditEntry[]> {
  try {
    const filePath = path.join(cwd, AUDIT_DIR, AUDIT_FILE)
    const text = await fs.readFile(filePath, 'utf-8')
    const lines = text.trim().split('\n').filter(Boolean)
    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as AuditEntry)
      .reverse()
  } catch {
    return []
  }
}
