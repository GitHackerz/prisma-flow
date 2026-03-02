import { Command } from 'commander'
import { getProjectStatus } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import chalk from 'chalk'

/**
 * Exit codes (documented in README):
 *   0 – All good
 *   1 – Pending migrations
 *   2 – Schema drift detected
 *   3 – Failed migrations
 *   4 – Runtime error
 */
export function checkCommand() {
  return new Command('check')
    .description('Validate database migration state (CI-friendly)')
    .option('--ci',   'Exit with a non-zero code when issues are found (for CI pipelines)')
    .option('--json', 'Output result as JSON to stdout')
    .action(async (options: { ci?: boolean; json?: boolean }) => {
      try {
        const project = await detectPrismaProject(process.cwd())

        if (!project) {
          if (options.json) {
            process.stdout.write(JSON.stringify({ ok: false, error: 'No Prisma project found' }) + '\n')
          } else {
            console.error(chalk.red('❌ No Prisma project found'))
          }
          process.exit(4)
        }

        const status = await getProjectStatus(process.cwd())

        const result = {
          ok:               status.failedCount === 0 && !status.hasDrift && status.pendingCount === 0,
          connected:        status.connected,
          pendingCount:     status.pendingCount,
          failedCount:      status.failedCount,
          driftDetected:    status.hasDrift,
          driftCount:       status.driftCount,
          riskLevel:        status.riskLevel,
          lastSync:         status.lastSync,
        }

        if (options.json) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        } else {
          // Human-readable summary (always printed unless --json)
          const bar = '━'.repeat(44)
          console.log(chalk.bold('\nPrismaFlow • Check'))
          console.log(chalk.gray(bar))
          console.log(
            status.connected
              ? chalk.green('✓ Database connected')
              : chalk.red('❌ Database connection failed'),
          )
          console.log(
            status.failedCount > 0
              ? chalk.red(`❌ ${status.failedCount} failed migration(s)`)
              : chalk.green('✓ No failed migrations'),
          )
          console.log(
            status.pendingCount > 0
              ? chalk.yellow(`⚠  ${status.pendingCount} pending migration(s)`)
              : chalk.green('✓ No pending migrations'),
          )
          console.log(
            status.hasDrift
              ? chalk.yellow(`⚠  Schema drift detected (${status.driftCount} difference${status.driftCount !== 1 ? 's' : ''})`)
              : chalk.green('✓ No schema drift'),
          )
          console.log()
        }

        if (options.ci) {
          if (status.failedCount > 0) process.exit(3)
          if (status.hasDrift)        process.exit(2)
          if (status.pendingCount > 0) process.exit(1)
          process.exit(0)
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        if (options.json) {
          process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n')
        } else {
          console.error(chalk.red(`❌ ${message}`))
        }
        process.exit(4)
      }
    })
}
