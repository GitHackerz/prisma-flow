import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface PrismaCliOptions {
  env?: NodeJS.ProcessEnv
  timeout?: number
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveLocalPrismaCli(cwd: string): Promise<string | null> {
  let current = path.resolve(cwd)

  while (true) {
    const candidate = path.join(current, 'node_modules', 'prisma', 'build', 'index.js')
    if (await fileExists(candidate)) return candidate

    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

async function resolveBundledNpxCli(): Promise<string | null> {
  const candidate = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npx-cli.js',
  )
  return (await fileExists(candidate)) ? candidate : null
}

export async function execPrisma(
  cwd: string,
  args: string[],
  options: PrismaCliOptions = {},
): Promise<{ stdout: string; stderr: string }> {
  const localCli = await resolveLocalPrismaCli(cwd)
  if (localCli) {
    return execFileAsync(process.execPath, [localCli, ...args], {
      cwd,
      env: options.env,
      timeout: options.timeout,
    })
  }

  if (process.platform === 'win32') {
    const npxCli = await resolveBundledNpxCli()
    if (npxCli) {
      return execFileAsync(process.execPath, [npxCli, 'prisma', ...args], {
        cwd,
        env: options.env,
        timeout: options.timeout,
      })
    }
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  return execFileAsync(command, ['prisma', ...args], {
    cwd,
    env: options.env,
    timeout: options.timeout,
  })
}
