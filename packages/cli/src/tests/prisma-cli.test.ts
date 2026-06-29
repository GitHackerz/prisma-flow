import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { execPrisma } from '../core/prisma-cli.js'

let tempDir: string | null = null

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true })
    tempDir = null
  }
})

describe('execPrisma', () => {
  it('runs a project-local Prisma CLI entrypoint with structured args', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prisma-flow-cli-'))
    const cliDir = path.join(tempDir, 'node_modules', 'prisma', 'build')
    await fs.mkdir(cliDir, { recursive: true })
    await fs.writeFile(
      path.join(cliDir, 'index.js'),
      'console.log(JSON.stringify(process.argv.slice(2)))\n',
      'utf-8',
    )

    const result = await execPrisma(
      tempDir,
      ['migrate', 'status', '--schema', 'prisma/schema.prisma'],
      { timeout: 5_000 },
    )

    expect(JSON.parse(result.stdout)).toEqual([
      'migrate',
      'status',
      '--schema',
      'prisma/schema.prisma',
    ])
  })
})
