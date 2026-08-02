import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { simulateSqlite, splitStatements } from '../core/simulator.js'

let tempDir: string | null = null

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true })
    tempDir = null
  }
})

describe('splitStatements', () => {
  it('keeps SQL statements that appear after comment headers', () => {
    const statements = splitStatements(`
-- CreateTable
CREATE TABLE "User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
`)

    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('CREATE TABLE "User"')
    expect(statements[1]).toContain('CREATE UNIQUE INDEX')
  })
})

describe('simulateSqlite', () => {
  it('falls back to static analysis when sqlite3 is unavailable', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-sim-test-'))
    const dbPath = path.join(tempDir, 'dev.db')
    const sqlPath = path.join(tempDir, 'migration.sql')
    await fs.writeFile(dbPath, '', 'utf-8')
    await fs.writeFile(sqlPath, 'CREATE TABLE "User" ("id" INTEGER);', 'utf-8')

    const result = await simulateSqlite('test_migration', sqlPath, dbPath)

    expect(result.wouldSucceed).toBe(true)
    expect(result.statements).toHaveLength(1)
    expect(result.mode).toMatch(/shadow|static/)
  })
})
