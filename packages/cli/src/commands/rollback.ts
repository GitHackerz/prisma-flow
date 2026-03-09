/**
 * `prisma-flow rollback` — generate and optionally apply a rollback plan
 * for a previously applied migration.
 */

import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { generateRollbackPlan, renderRollbackSql } from '../core/rollback-generator.js'
import { trackEvent } from '../core/telemetry.js'

export function rollbackCommand() {
  return new Command('rollback')
    .description('Generate a rollback plan for a migration')
    .argument('<migration>', 'Migration name or timestamp prefix')
    .option('--json', 'Output as JSON')
    .option('--print-sql', 'Print the rollback SQL to stdout')
    .option('--include-manual', 'Include manual-only steps in SQL output', true)
    .action(
      async (
        migrationQuery: string,
        options: { json?: boolean; printSql?: boolean; includeManual?: boolean },
      ) => {
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
          const plan = await generateRollbackPlan(match.name, sqlFile)

          if (options.json) {
            process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
            process.exit(0)
          }

          if (options.printSql) {
            process.stdout.write(`${renderRollbackSql(plan, options.includeManual !== false)}\n`)
            process.exit(0)
          }

          const autoCount = plan.steps.filter((s) => s.automated).length
          const manualCount = plan.steps.filter((s) => !s.automated).length

          console.log()
          console.log(chalk.bold.cyan(` ↩  Rollback Plan: ${match.name}`))
          console.log(chalk.dim('━'.repeat(60)))
          console.log(
            `  ${chalk.bold('Steps:')} ${autoCount} automated, ${manualCount > 0 ? chalk.yellow(`${manualCount} manual`) : chalk.green('0 manual')}`,
          )
          console.log(
            `  ${chalk.bold('Fully automated:')} ${plan.automated ? chalk.green('Yes') : chalk.yellow('No — manual review required')}`,
          )
          console.log()

          for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i]!
            const icon = step.automated ? chalk.green('✓') : chalk.yellow('⚠')
            const label = step.automated ? chalk.dim('[auto]') : chalk.yellow('[manual]')
            console.log(`  ${icon} Step ${i + 1} ${label}`)
            console.log(`    ${chalk.dim('Forward:')}  ${step.forwardSql.slice(0, 60)}`)
            console.log(`    ${chalk.dim('Rollback:')} ${step.rollbackSql.slice(0, 60)}`)
            if (step.warning) {
              console.log(`    ${chalk.yellow('⚠')} ${step.warning}`)
            }
          }

          if (plan.warnings.length > 0) {
            console.log()
            console.log(chalk.bold('  Warnings:'))
            for (const w of plan.warnings) {
              console.log(`    ${chalk.yellow('⚠')} ${w}`)
            }
          }

          console.log()
          console.log(chalk.dim('  To generate rollback SQL:'))
          console.log(chalk.dim(`    prisma-flow rollback ${match.name} --print-sql`))
          console.log()

          await Promise.all([
            writeAuditEntry(cwd, 'migration.rollback', 'success', { migration: match.name }),
            trackEvent('rollback', plan.steps.length),
          ]).catch(() => {})

          process.exit(plan.hasManualSteps ? 1 : 0)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(chalk.red(`✖  ${message}`))
          process.exit(1)
        }
      },
    )
}
