import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { getMigrations, getProjectStatus } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

export function statusCommand() {
  return new Command('status')
    .description('Show current migration and database status')
    .option('--json', 'Output as JSON')
    .option('--quiet', 'Suppress decorative output')
    .action(async (options: { json?: boolean; quiet?: boolean }) => {
      const cwd = process.cwd()

      try {
        const project = await detectPrismaProject(cwd)

        if (!project) {
          if (options.json) {
            process.stdout.write(`${JSON.stringify({ error: 'No Prisma project found' })}\n`)
          } else {
            console.error(chalk.red('✖  No Prisma schema found in the current directory.'))
            console.error(chalk.dim('   Run prisma init to create one, then try again.'))
          }
          process.exit(1)
        }

        const [status, migrations] = await Promise.all([getProjectStatus(cwd), getMigrations(cwd)])

        if (options.json) {
          process.stdout.write(`${JSON.stringify(status, null, 2)}\n`)
        } else {
          const bar = chalk.dim('━'.repeat(50))
          const riskColor =
            status.riskLevel === 'high'
              ? chalk.red
              : status.riskLevel === 'medium'
                ? chalk.yellow
                : chalk.green

          if (!options.quiet) console.log()
          console.log(chalk.bold.cyan(' 📊  PrismaFlow Status'))
          console.log(bar)
          console.log(
            chalk.bold(' Schema:       ') + chalk.dim(status.schemaPath ?? project.schemaPath),
          )
          if (status.provider) {
            console.log(chalk.bold(' Provider:     ') + chalk.cyan(status.provider))
          }
          console.log(
            chalk.bold(' Database:     '),
            status.connected ? chalk.green('✔ Connected') : chalk.red('✖ Disconnected'),
          )
          console.log(
            chalk.bold(' Migrations:   ') +
              chalk.green(`${status.migrationsApplied} applied`) +
              chalk.dim('  /  ') +
              (status.migrationsPending > 0
                ? chalk.yellow(`${status.migrationsPending} pending`)
                : chalk.dim('0 pending')) +
              chalk.dim('  /  ') +
              (status.migrationsFailed > 0
                ? chalk.red(`${status.migrationsFailed} failed`)
                : chalk.dim('0 failed')),
          )
          console.log(
            chalk.bold(' Drift:        '),
            status.driftDetected
              ? chalk.red(
                  `✖ ${status.driftCount} issue${status.driftCount !== 1 ? 's' : ''} detected`,
                )
              : chalk.green('✔ None'),
          )
          console.log(
            chalk.bold(' Risk Level:   ') + riskColor(chalk.bold(status.riskLevel.toUpperCase())),
          )

          // Show last migration
          const lastMigration = migrations.filter((m) => m.status === 'applied').pop()
          if (lastMigration) {
            const date = new Date(lastMigration.timestamp).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            console.log(
              chalk.bold(' Last Applied: ') + chalk.dim(`${lastMigration.name} (${date})`),
            )
          }

          console.log(
            chalk.bold(' Last Sync:    ') + chalk.dim(new Date(status.lastSync).toLocaleString()),
          )
          console.log(bar)

          if (status.migrationsPending > 0) {
            console.log(chalk.yellow(' ⚠  Pending migrations — run: prisma migrate deploy'))
          }
          if (status.migrationsFailed > 0) {
            console.log(chalk.red(' ✖  Failed migrations — run: prisma migrate resolve'))
          }
          if (status.driftDetected) {
            console.log(chalk.red(' ✖  Schema drift — run: prisma-flow repair'))
          }
          if (!options.quiet) console.log()
        }

        await Promise.all([
          writeAuditEntry(cwd, 'status.check', 'success', {
            migrationsApplied: status.migrationsApplied,
            migrationsPending: status.migrationsPending,
            migrationsFailed: status.migrationsFailed,
            driftDetected: status.driftDetected,
          }),
          trackEvent('status', migrations.length),
        ]).catch(() => {})

        process.exit(0)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        if (options.json) {
          process.stdout.write(`${JSON.stringify({ error: message })}\n`)
        } else {
          console.error(chalk.red(`✖  Error: ${message}`))
        }
        await writeAuditEntry(cwd, 'status.check', 'failure', { error: message }).catch(() => {})
        process.exit(1)
      }
    })
}
