import { describe, it, expect } from 'vitest'
import {
  parseSqlStatements,
  classifyDriftSql,
} from '../core/drift-detector.js'

// ─── parseSqlStatements ───────────────────────────────────────────────────────

describe('parseSqlStatements()', () => {
  it('returns empty array for empty input', () => {
    expect(parseSqlStatements('')).toEqual([])
    expect(parseSqlStatements('   ')).toEqual([])
  })

  it('parses a single statement terminated by semicolon', () => {
    const result = parseSqlStatements('CREATE TABLE "User" (id INT);')
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('CREATE TABLE "User" (id INT)')
  })

  it('parses multiple statements separated by semicolons', () => {
    const sql = [
      'CREATE TABLE "A" (id INT);',
      'DROP TABLE "B";',
      'ALTER TABLE "C" ADD COLUMN "x" TEXT;',
    ].join('\n')
    const result = parseSqlStatements(sql)
    expect(result).toHaveLength(3)
  })

  it('preserves a statement without a trailing semicolon', () => {
    const result = parseSqlStatements('CREATE TABLE "X" (id INT)')
    expect(result).toHaveLength(1)
  })

  it('does NOT split on a semicolon inside a single-quoted string literal', () => {
    const sql = "INSERT INTO cfg VALUES ('key;value');"
    const result = parseSqlStatements(sql)
    expect(result).toHaveLength(1)
    expect(result[0]).toContain("'key;value'")
  })

  it('does NOT split on a semicolon in a line comment', () => {
    const sql = '-- this is a comment; not a statement\nCREATE TABLE "T" (id INT);'
    const result = parseSqlStatements(sql)
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('CREATE TABLE')
  })

  it('does NOT split on a semicolon inside a block comment', () => {
    const sql = '/* ignore;this */\nCREATE TABLE "T" (id INT);'
    const result = parseSqlStatements(sql)
    expect(result).toHaveLength(1)
  })

  it('ignores empty statements between consecutive semicolons', () => {
    const result = parseSqlStatements(';;; CREATE TABLE "X" (id INT);  ;')
    expect(result.every((s) => s.trim().length > 0)).toBe(true)
  })
})

// ─── classifyDriftSql ─────────────────────────────────────────────────────────

describe('classifyDriftSql()', () => {
  it('classifies CREATE TABLE as table-missing', () => {
    expect(classifyDriftSql('CREATE TABLE "User" (id INT)')).toBe('table-missing')
  })

  it('classifies DROP TABLE as table-extra', () => {
    expect(classifyDriftSql('DROP TABLE "Old"')).toBe('table-extra')
  })

  it('classifies ALTER TABLE as column-mismatch', () => {
    expect(classifyDriftSql('ALTER TABLE "User" ADD COLUMN "email" TEXT')).toBe('column-mismatch')
  })

  it('classifies CREATE INDEX as index-change', () => {
    expect(classifyDriftSql('CREATE INDEX "idx_email" ON "User"("email")')).toBe('index-change')
  })

  it('classifies DROP INDEX as index-change', () => {
    expect(classifyDriftSql('DROP INDEX "idx_old"')).toBe('index-change')
  })

  it('classifies ALTER INDEX as index-change', () => {
    expect(classifyDriftSql('ALTER INDEX "idx_old" RENAME TO "idx_new"')).toBe('index-change')
  })

  it('classifies a statement containing CONSTRAINT as constraint-change', () => {
    expect(classifyDriftSql('ALTER TABLE "T" ADD CONSTRAINT "fk" FOREIGN KEY ("x") REFERENCES "Y"("id")')).toBe('constraint-change')
  })

  it('classifies unknown statements as unknown', () => {
    expect(classifyDriftSql('COMMENT ON TABLE "T" IS \'desc\'')).toBe('unknown')
  })

  it('is case-insensitive', () => {
    expect(classifyDriftSql('create table "t" (id int)')).toBe('table-missing')
    expect(classifyDriftSql('drop table "t"')).toBe('table-extra')
  })
})
