/**
 * JsonlStore — file-based StoreAdapter implementation for local/single-project mode.
 *
 * Data is persisted in `.prismaflow/store/` relative to the project root.
 *
 *   audit.jsonl         — append-only audit log
 *   drift-history.jsonl — append-only drift detection records
 *   migrations.json     — latest migration list snapshot
 *   health.jsonl        — append-only health snapshots
 *
 * No external dependencies — uses only Node.js built-ins.
 */

import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { AuditEntry, DriftResult, Migration, ProjectStatus } from '@prisma-flow/shared'
import type { DriftRecord, HealthSnapshot, StoreAdapter } from './adapter.js'

const STORE_DIR = '.prismaflow/store'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return randomBytes(8).toString('hex')
}

function storeDir(projectPath: string): string {
  return path.join(projectPath, STORE_DIR)
}

function storeFile(projectPath: string, name: string): string {
  return path.join(storeDir(projectPath), name)
}

async function ensureDir(projectPath: string): Promise<void> {
  await fs.mkdir(storeDir(projectPath), { recursive: true })
}

/** Append a JSON line to a JSONL file. */
async function appendJsonl(filePath: string, record: unknown): Promise<void> {
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf-8')
}

/** Read all lines from a JSONL file (ignores malformed lines). */
async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as T]
        } catch {
          return []
        }
      })
  } catch {
    return []
  }
}

/** Create a stable short ID from a path (for cross-process consistency). */
function pathId(projectPath: string): string {
  return createHash('sha1').update(projectPath).digest('hex').slice(0, 8)
}

// ─── JsonlStore ───────────────────────────────────────────────────────────────

export class JsonlStore implements StoreAdapter {
  constructor(private readonly projectPath: string) {}

  async init(): Promise<void> {
    await ensureDir(this.projectPath)
  }

  async close(): Promise<void> {
    // No-op for file-based store
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  async appendAuditEntry(entry: AuditEntry): Promise<void> {
    await ensureDir(this.projectPath)
    await appendJsonl(storeFile(this.projectPath, 'audit.jsonl'), entry)
  }

  async getAuditEntries(opts: {
    projectPath: string
    limit?: number
    action?: string
  }): Promise<AuditEntry[]> {
    const all = await readJsonl<AuditEntry>(storeFile(this.projectPath, 'audit.jsonl'))
    const filtered = opts.action ? all.filter((e) => e.action === opts.action) : all
    return filtered.reverse().slice(0, opts.limit ?? 100)
  }

  // ── Migration snapshot ─────────────────────────────────────────────────────

  async saveMigrationSnapshot(projectPath: string, migrations: Migration[]): Promise<void> {
    await ensureDir(this.projectPath)
    const snapshot = {
      projectId: pathId(projectPath),
      savedAt: new Date().toISOString(),
      migrations,
    }
    await fs.writeFile(
      storeFile(this.projectPath, 'migrations.json'),
      JSON.stringify(snapshot, null, 2),
      'utf-8',
    )
  }

  async loadMigrationSnapshot(_projectPath: string): Promise<Migration[]> {
    try {
      const raw = await fs.readFile(storeFile(this.projectPath, 'migrations.json'), 'utf-8')
      const parsed = JSON.parse(raw) as { migrations: Migration[] }
      return parsed.migrations ?? []
    } catch {
      return []
    }
  }

  // ── Drift history ──────────────────────────────────────────────────────────

  async recordDrift(projectPath: string, result: DriftResult): Promise<DriftRecord> {
    await ensureDir(this.projectPath)
    const record: DriftRecord = {
      id: uid(),
      projectPath,
      detectedAt: new Date().toISOString(),
      result,
    }
    await appendJsonl(storeFile(this.projectPath, 'drift-history.jsonl'), record)
    return record
  }

  async resolveDrift(id: string): Promise<void> {
    const filePath = storeFile(this.projectPath, 'drift-history.jsonl')
    const all = await readJsonl<DriftRecord>(filePath)
    const updated = all.map((r) =>
      r.id === id ? { ...r, resolvedAt: new Date().toISOString() } : r,
    )
    await fs.writeFile(filePath, updated.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf-8')
  }

  async getOpenDrift(projectPath: string): Promise<DriftRecord[]> {
    const all = await readJsonl<DriftRecord>(storeFile(this.projectPath, 'drift-history.jsonl'))
    return all.filter((r) => r.projectPath === projectPath && r.resolvedAt === undefined).reverse()
  }

  async getDriftHistory(projectPath: string, limit = 50): Promise<DriftRecord[]> {
    const all = await readJsonl<DriftRecord>(storeFile(this.projectPath, 'drift-history.jsonl'))
    return all
      .filter((r) => r.projectPath === projectPath)
      .reverse()
      .slice(0, limit)
  }

  // ── Health snapshots ───────────────────────────────────────────────────────

  async saveHealthSnapshot(projectPath: string, status: ProjectStatus): Promise<HealthSnapshot> {
    await ensureDir(this.projectPath)
    const snapshot: HealthSnapshot = {
      id: uid(),
      projectPath,
      capturedAt: new Date().toISOString(),
      status,
    }
    await appendJsonl(storeFile(this.projectPath, 'health.jsonl'), snapshot)
    return snapshot
  }

  async getLatestHealth(projectPath: string): Promise<HealthSnapshot | null> {
    const all = await readJsonl<HealthSnapshot>(storeFile(this.projectPath, 'health.jsonl'))
    const filtered = all.filter((s) => s.projectPath === projectPath)
    return filtered.at(-1) ?? null
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _store: StoreAdapter | null = null

/**
 * Get the configured store adapter (singleton per process).
 * Uses the JSONL local store by default.
 */
export function getStore(projectPath: string): StoreAdapter {
  if (!_store) {
    _store = new JsonlStore(projectPath)
  }
  return _store
}

/** Reset the store singleton (for tests). */
export function _resetStore(): void {
  _store = null
}
