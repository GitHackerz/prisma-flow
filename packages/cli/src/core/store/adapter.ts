/**
 * StoreAdapter — unified persistence interface for PrismaFlow state.
 *
 * Implementations:
 *  - SqliteStore   — local single-project mode (default)
 *  - SaasStore     — remote PrismaFlow SaaS backend (Pro+)
 *
 * Callers should use `getStore()` to obtain the configured adapter.
 * All methods are async to allow transparent remote implementations.
 */

import type { AuditEntry, DriftResult, Migration, ProjectStatus } from '@prisma-flow/shared'

// ─── Snapshot types ───────────────────────────────────────────────────────────

/** A point-in-time snapshot of project health stored by the adapter. */
export interface HealthSnapshot {
  id: string
  projectPath: string
  capturedAt: string // ISO-8601
  status: ProjectStatus
}

/** A stored drift history record. */
export interface DriftRecord {
  id: string
  projectPath: string
  detectedAt: string // ISO-8601
  result: DriftResult
  resolvedAt?: string
}

// ─── StoreAdapter interface ───────────────────────────────────────────────────

export interface StoreAdapter {
  // ── Audit log ──────────────────────────────────────────────────────────────

  /** Append an audit entry. */
  appendAuditEntry(entry: AuditEntry): Promise<void>

  /** Retrieve recent audit entries, most recent first. */
  getAuditEntries(opts: {
    projectPath: string
    limit?: number
    action?: string
  }): Promise<AuditEntry[]>

  // ── Migration state ────────────────────────────────────────────────────────

  /** Persist a list of observed migrations (snapshot). */
  saveMigrationSnapshot(projectPath: string, migrations: Migration[]): Promise<void>

  /** Load the last persisted migration list (returns [] if none). */
  loadMigrationSnapshot(projectPath: string): Promise<Migration[]>

  // ── Drift history ──────────────────────────────────────────────────────────

  /** Record a drift detection result. */
  recordDrift(projectPath: string, result: DriftResult): Promise<DriftRecord>

  /** Mark a drift record as resolved. */
  resolveDrift(id: string): Promise<void>

  /** Get open (unresolved) drift records. */
  getOpenDrift(projectPath: string): Promise<DriftRecord[]>

  /** Get all drift history (resolved + open). */
  getDriftHistory(projectPath: string, limit?: number): Promise<DriftRecord[]>

  // ── Health snapshots ───────────────────────────────────────────────────────

  /** Persist a project health snapshot. */
  saveHealthSnapshot(projectPath: string, status: ProjectStatus): Promise<HealthSnapshot>

  /** Most recent health snapshot. */
  getLatestHealth(projectPath: string): Promise<HealthSnapshot | null>

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Initialise the adapter (create schema, connect, etc.) */
  init(): Promise<void>

  /** Gracefully release resources. */
  close(): Promise<void>
}
