/**
 * `prisma-flow simulate` — dry-run a migration without applying it.
 * Shows which statements would run, marks destructive ones, and exits
 * with code 2 if there are destructive operations (useful for CI).
 */

import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { simulate } from '../core/simulator.js'
import { trackEvent } from '../core/telemetry.js'

export function simulateCommand() {
  return new Command('simulate')
    .description('Dry-run a migration to preview its effect without applying it')
    .argument('<migration>', 'Migration name or timestamp prefix')
    .option('--json', 'Output as JSON')
    .option('--fail-on-destructive', 'Exit with code 2 if destructive statements are found')
    .action(
      async (migrationQuery: string, options: { json?: boolean; failOnDestructive?: boolean }) => {
        const cwd = process.cwd()
        try {
          const project = await detectPrismaProject(cwd)
          if (!project) {
            console.error(chalk.red('✖  No Prisma project found.'))
            process.exit(1)
          }

          const match = project.migrations.find(
            (m) =>
              m.name === migrationQuery ||
              m.name.startsWith(migrationQuery) ||
              m.timestamp.startsWith(migrationQuery),
          )

          if (!match) {
            console.error(chalk.red(`✖  Migration "${migrationQuery}" not found.`))
            process.exit(1)
          }

          const sqlFile = path.join(project.migrationsPath, match.name, 'migration.sql')

          // Use DB file path for SQLite shadow sim
          const dbPath =
            project.provider === 'sqlite' && project.databaseUrl
              ? project.databaseUrl.replace(/^file:/, '')
              : undefined

          const result = await simulate(match.name, sqlFile, dbPath)

          if (options.json) {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
            process.exit(0)
          }

          console.log()
          console.log(chalk.bold.cyan(` 🔬  Simulation: ${match.name}`))
          console.log(chalk.dim('━'.repeat(60)))
          console.log(`  ${chalk.bold('Mode:')}   ${result.mode}`)
          console.log(
            `  ${chalk.bold('Result:')} ${result.wouldSucceed ? chalk.green('Would succeed') : chalk.red('Would fail')}`,
          )
          console.log(
            `  ${chalk.bold('Statements:')} ${result.statements.length} (${result.destructiveStatements} destructive)`,
          )
          console.log()

          for (const stmt of result.statements) {
            const icon = stmt.isDestructive ? chalk.red('⚠') : chalk.green('✓')
            const typeLabel = chalk.dim(`[${stmt.type}]`)
            const preview = stmt.sql.slice(0, 70).replace(/\n/g, ' ')
            console.log(
              `  ${icon} ${typeLabel} ${preview}${stmt.sql.length > 70 ? chalk.dim('…') : ''}`,
            )
            for (const w of stmt.warnings) {
              console.log(`      ${chalk.yellow('→')} ${chalk.yellow(w)}`)
            }
          }

          if (result.warnings.length > 0) {
            console.log()
            console.log(chalk.bold('  Warnings:'))
            for (const w of result.warnings) {
              console.log(`    ${chalk.yellow('⚠')} ${w}`)
            }
          }

          if (!result.wouldSucceed && result.error) {
            console.log()
            console.log(chalk.red(`  ✖  Error: ${result.error}`))
          }

          console.log()

          await Promise.all([
            writeAuditEntry(
              cwd,
              'migration.simulate',
              result.wouldSucceed ? 'success' : 'warning',
              {
                migration: match.name,
                destructive: result.destructiveStatements,
              },
            ),
            trackEvent('simulate', result.statements.length),
          ]).catch(() => {})

          if (!result.wouldSucceed) process.exit(1)
          if (options.failOnDestructive && result.destructiveStatements > 0) process.exit(2)
          process.exit(0)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(chalk.red(`✖  ${message}`))
          process.exit(1)
        }
      },
    )
}
