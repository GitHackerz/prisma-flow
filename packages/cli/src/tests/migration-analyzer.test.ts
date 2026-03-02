import { describe, it, expect } from 'vitest'
import { analyzeMigrationRisks } from '../core/migration-analyzer.js'

describe('analyzeMigrationRisks()', () => {
  it('returns empty array for safe CREATE TABLE statement', () => {
    const sql = 'CREATE TABLE "Post" (id SERIAL PRIMARY KEY, title TEXT NOT NULL);'
    expect(analyzeMigrationRisks(sql)).toEqual([])
  })

  it('detects DROP TABLE as destructive', () => {
    const sql = 'DROP TABLE "User";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Drops table'))).toBe(true)
  })

  it('detects DROP COLUMN as destructive', () => {
    const sql = 'ALTER TABLE "User" DROP COLUMN "legacy_field";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Drops column'))).toBe(true)
  })

  it('detects TRUNCATE as destructive', () => {
    const sql = 'TRUNCATE TABLE "sessions";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Truncates table'))).toBe(true)
  })

  it('detects DELETE FROM as bulk deletion', () => {
    const sql = 'DELETE FROM "audit_log" WHERE created_at < NOW() - INTERVAL \'30 days\';'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Bulk data deletion'))).toBe(true)
  })

  it('detects DROP INDEX as performance risk', () => {
    const sql = 'DROP INDEX "idx_user_email";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Removes index'))).toBe(true)
  })

  it('detects DROP CONSTRAINT as integrity risk', () => {
    const sql = 'ALTER TABLE "User" DROP CONSTRAINT "fk_org";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Removes constraint'))).toBe(true)
  })

  it('detects ALTER TABLE as structural change', () => {
    const sql = 'ALTER TABLE "User" ADD COLUMN "new_field" TEXT;'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Alters table'))).toBe(true)
  })

  it('returns multiple risks for a migration with multiple patterns', () => {
    const sql = `
      DROP TABLE "old_cache";
      ALTER TABLE "users" DROP COLUMN "legacy_token";
    `
    const risks = analyzeMigrationRisks(sql)
    expect(risks.length).toBeGreaterThanOrEqual(2)
  })

  it('is case-insensitive', () => {
    const sql = 'drop table "User";'
    const risks = analyzeMigrationRisks(sql)
    expect(risks.some((r) => r.includes('Drops table'))).toBe(true)
  })
})
