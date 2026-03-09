/**
 * Git Awareness module — correlates migration files with git history.
 *
 * Provides:
 *  - `getGitMigrationInfo(migrationsDir)` — per-migration git metadata
 *  - `detectMigrationConflicts(migrationsDir)` — find migrations added in
 *    parallel branches (same timestamp prefix, different names)
 *  - `getCurrentBranch()` / `getUncommittedMigrations(migrationsDir)`
 */

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import type { GitMigrationInfo, MigrationConflict } from '@prisma-flow/shared'
import { GitAwarenessError } from '@prisma-flow/shared'

const execAsync = promisify(execFile)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function git(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync('git', args, { cwd, timeout: 10_000 })
    return stdout.trim()
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    throw new GitAwarenessError(error.message, error)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Check whether the current directory is inside a git repo. */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    await git(['rev-parse', '--git-dir'], cwd)
    return true
  } catch {
    return false
  }
}

/** Return the currently checked-out branch name. */
export async function getCurrentBranch(cwd: string): Promise<string> {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)
}

/**
 * For each migration directory, fetch:
 *  - the commit hash when it was first added
 *  - commit author
 *  - commit date (ISO)
 *  - branch at time of commit (best effort)
 *  - commit message
 */
export async function getGitMigrationInfo(
  migrationsDir: string,
  cwd: string,
): Promise<GitMigrationInfo[]> {
  let entries: string[]
  try {
    const raw = await fs.readdir(migrationsDir, { withFileTypes: true })
    entries = raw
      .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
      .map((d) => d.name)
      .sort()
  } catch {
    return []
  }

  const results: GitMigrationInfo[] = []

  for (const entry of entries) {
    const migrationPath = path.join(migrationsDir, entry, 'migration.sql')
    const relPath = path.relative(cwd, migrationPath)

    try {
      // Log format: hash|author|date|subject
      const log = await git(
        ['log', '--follow', '--diff-filter=A', '--format=%H|%an|%aI|%s', '--', relPath],
        cwd,
      )

      if (!log) {
        // File exists but not committed yet
        results.push({
          migrationName: entry,
          committed: false,
        })
        continue
      }

      const [hash, author, date, ...subjectParts] = log.split('|')
      const subject = subjectParts.join('|')

      results.push({
        migrationName: entry,
        committed: true,
        ...(hash?.trim() ? { commitHash: hash.trim() } : {}),
        ...(author?.trim() ? { commitAuthor: author.trim() } : {}),
        ...(date?.trim() ? { commitDate: date.trim() } : {}),
        ...(subject?.trim() ? { commitMessage: subject.trim() } : {}),
      })
    } catch {
      results.push({
        migrationName: entry,
        committed: false,
      })
    }
  }

  return results
}

/**
 * Find migration directories that share the same timestamp prefix (potential conflicts
 * from parallel branches merged together).
 */
export async function detectMigrationConflicts(
  migrationsDir: string,
): Promise<MigrationConflict[]> {
  let entries: string[]
  try {
    const raw = await fs.readdir(migrationsDir, { withFileTypes: true })
    entries = raw.filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name)).map((d) => d.name)
  } catch {
    return []
  }

  // Group by 14-digit timestamp prefix
  const byTimestamp = new Map<string, string[]>()
  for (const entry of entries) {
    const ts = entry.slice(0, 14)
    const existing = byTimestamp.get(ts) ?? []
    existing.push(entry)
    byTimestamp.set(ts, existing)
  }

  const conflicts: MigrationConflict[] = []
  for (const [timestamp, names] of byTimestamp) {
    if (names.length > 1) {
      conflicts.push({
        timestamp,
        migrations: names,
        type: 'duplicate_timestamp',
        description: `${names.length} migrations share timestamp ${timestamp} — likely from parallel branches`,
      })
    }
  }

  return conflicts
}

/**
 * List migration directories/files that exist on disk but are NOT committed to git.
 */
export async function getUncommittedMigrations(
  migrationsDir: string,
  cwd: string,
): Promise<string[]> {
  let entries: string[]
  try {
    const raw = await fs.readdir(migrationsDir, { withFileTypes: true })
    entries = raw
      .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
      .map((d) => d.name)
      .sort()
  } catch {
    return []
  }

  const uncommitted: string[] = []

  try {
    // List all untracked files
    const untracked = await git(['ls-files', '--others', '--exclude-standard', migrationsDir], cwd)
    const untrackedSet = new Set(
      untracked
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    )

    for (const entry of entries) {
      const sqlFile = path.relative(cwd, path.join(migrationsDir, entry, 'migration.sql'))
      if (untrackedSet.has(sqlFile)) {
        uncommitted.push(entry)
      }
    }
  } catch {
    // git not available — return empty
  }

  return uncommitted
}
