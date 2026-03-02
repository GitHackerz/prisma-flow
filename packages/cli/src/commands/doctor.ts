import { Command } from 'commander'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { detectPrismaProject } from '../core/prisma-detector.js'
import chalk from 'chalk'
import path from 'path'

const execFileAsync = promisify(execFile)

interface Check {
  label:   string
  run:     () => Promise<{ ok: boolean; detail?: string }>
}

async function runChecks(checks: Check[]): Promise<boolean> {
  let allOk = true

  for (const check of checks) {
    process.stdout.write(`  ${chalk.gray('•')} ${check.label} ... `)
    try {
      const { ok, detail } = await check.run()
      if (ok) {
        process.stdout.write(chalk.green('OK') + (detail ? chalk.gray(` (${detail})`) : '') + '\n')
      } else {
        process.stdout.write(chalk.red('FAIL') + (detail ? chalk.gray(` — ${detail}`) : '') + '\n')
        allOk = false
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(chalk.red('ERROR') + chalk.gray(` — ${msg}`) + '\n')
      allOk = false
    }
  }

  return allOk
}

export function doctorCommand() {
  return new Command('doctor')
    .description('Validate the environment and project setup')
    .action(async () => {
      console.log(chalk.bold('\nPrismaFlow • Doctor\n') + chalk.gray('━'.repeat(44)))

      const cwd = process.cwd()

      // ── Node.js version ──────────────────────────────────────────────────
      console.log(chalk.bold('\n[Runtime]'))
      await runChecks([
        {
          label: 'Node.js version ≥ 20',
          run: async () => {
            const [major] = process.versions.node.split('.').map(Number)
            return { ok: (major ?? 0) >= 20, detail: process.versions.node }
          },
        },
      ])

      // ── Prisma CLI ────────────────────────────────────────────────────────
      console.log(chalk.bold('\n[Prisma CLI]'))
      await runChecks([
        {
          label: 'prisma available (npx prisma --version)',
          run: async () => {
            const { stdout } = await execFileAsync('npx', ['prisma', '--version'], {
              cwd,
              timeout: 15_000,
            })
            const version = stdout.match(/prisma\s+:\s+([\d.]+)/i)?.[1] ?? stdout.trim().split('\n')[0]
            return { ok: true, detail: version ?? 'unknown' }
          },
        },
      ])

      // ── Prisma project ────────────────────────────────────────────────────
      console.log(chalk.bold('\n[Project]'))
      const project = await detectPrismaProject(cwd)

      await runChecks([
        {
          label: 'prisma/schema.prisma found',
          run: async () => ({
            ok: project !== null,
            detail: project ? path.relative(cwd, project.schemaPath) : 'not found',
          }),
        },
        {
          label: 'DATABASE_URL configured',
          run: async () => ({
            ok: Boolean(project?.databaseUrl || process.env['DATABASE_URL']),
            detail: project?.databaseUrl || process.env['DATABASE_URL']
              ? 'set'
              : 'not found in .env or environment',
          }),
        },
        {
          label: 'migrations directory exists',
          run: async () => {
            if (!project) return { ok: false, detail: 'no project' }
            try {
              const { default: fs } = await import('fs/promises')
              await fs.access(project.migrationsPath)
              return { ok: true, detail: `${project.migrations.length} migration(s)` }
            } catch {
              return { ok: false, detail: project.migrationsPath + ' not found' }
            }
          },
        },
      ])

      // ── Database connection ───────────────────────────────────────────────
      console.log(chalk.bold('\n[Database]'))
      if (project) {
        await runChecks([
          {
            label: 'database reachable (migrate status)',
            run: async () => {
              try {
                await execFileAsync(
                  'npx',
                  ['prisma', 'migrate', 'status', '--schema', project.schemaPath],
                  { cwd, timeout: 20_000 },
                )
                return { ok: true, detail: 'all migrations applied' }
              } catch (err: unknown) {
                const error  = err as { stderr?: string; stdout?: string }
                const stderr = error.stderr ?? ''
                const stdout = error.stdout ?? ''
                if (
                  stderr.includes('P1001') ||
                  stderr.includes("Can't reach database server") ||
                  stderr.includes('Connection refused')
                ) {
                  return { ok: false, detail: 'database unreachable (P1001)' }
                }
                // Non-zero exit but reachable (pending migrations)
                const pending = stdout.match(/have not yet been applied/i)
                return { ok: true, detail: pending ? 'connected — pending migrations exist' : 'connected' }
              }
            },
          },
        ])
      } else {
        console.log(chalk.gray('  Skipped — no Prisma project found\n'))
      }

      console.log()
      console.log(
        chalk.gray('Run ') +
          chalk.cyan('npx prisma-flow') +
          chalk.gray(' to launch the dashboard.\n'),
      )
    })
}
