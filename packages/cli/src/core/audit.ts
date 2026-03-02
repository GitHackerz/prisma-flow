/**
 * Audit log — appends structured entries to .prismaflow/audit.jsonl
 * in the user's project directory.  Entries are newline-delimited JSON
 * (JSONL) so they can be grepped or streamed by external tools.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import type { AuditAction, AuditEntry } from '@prisma-flow/shared'
import { logger } from '../logger.js'

export type { AuditAction, AuditEntry }

const AUDIT_DIR = '.prismaflow'
const AUDIT_FILE = 'audit.jsonl'

async function ensureAuditDir(cwd: string): Promise<string> {
  const dir = path.join(cwd, AUDIT_DIR)
  await fs.mkdir(dir, { recursive: true })
  return path.join(dir, AUDIT_FILE)
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
): Promise<void> {
  try {
    const filePath = await ensureAuditDir(cwd)
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      cwd,
      result,
      detail,
    }
    await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf-8')
  } catch (err) {
    logger.warn({ err }, 'Audit log write failed (non-fatal)')
  }
}

/**
 * Read the last N entries from the audit log.
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
