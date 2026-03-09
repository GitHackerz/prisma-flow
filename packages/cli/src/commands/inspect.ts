/**
 * `prisma-flow inspect` — display detailed information about a single migration.
 *
 * Shows: SQL content, risk score, rollback plan preview, simulation summary.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { scoreMigrationRisk } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { generateRollbackPlan } from '../core/rollback-generator.js'
import { analyseStatically, splitStatements } from '../core/simulator.js'
import { trackEvent } from '../core/telemetry.js'

export function inspectCommand() {
  return new Command('inspect')
    .description('Show detailed information about a specific migration')
    .argument('<migration>', 'Migration name or timestamp prefix')
    .option('--json', 'Output as JSON')
    .option('--sql', 'Print migration SQL')
    .option('--rollback', 'Generate and show rollback plan')
    .action(
      async (
        migrationQuery: string,
        options: { json?: boolean; sql?: boolean; rollback?: boolean },
      ) => {
        const cwd = process.cwd()
        try {
          const project = await detectPrismaProject(cwd)
          if (!project) {
            console.error(chalk.red('✖  No Prisma project found.'))
            process.exit(1)
          }

          // Resolve migration by name or prefix
          const match = project.migrations.find(
            (m) =>
              m.name === migrationQuery ||
              m.name.startsWith(migrationQuery) ||
              m.timestamp.startsWith(migrationQuery),
          )

          if (!match) {
            console.error(chalk.red(`✖  Migration "${migrationQuery}" not found.`))
            console.error(
              chalk.dim(`   Available: ${project.migrations.map((m) => m.name).join(', ')}`),
            )
            process.exit(1)
          }

          const sqlFile = path.join(project.migrationsPath, match.name, 'migration.sql')
          let sql = ''
          try {
            sql = await fs.readFile(sqlFile, 'utf-8')
          } catch {
            sql = '-- SQL file not found'
          }

          const statements = splitStatements(sql)
          const riskScore = scoreMigrationRisk(sql)
          const simulation = analyseStatically(match.name, statements)

          let rollbackPlan = null
          if (options.rollback) {
            rollbackPlan = await generateRollbackPlan(match.name, sqlFile)
          }

          if (options.json) {
            process.stdout.write(
              `${JSON.stringify({ migration: match, riskScore, simulation, rollbackPlan }, null, 2)}\n`,
            )
            process.exit(0)
          }

          const riskColor =
            riskScore.level === 'critical'
              ? chalk.red
              : riskScore.level === 'high'
                ? chalk.yellow
                : riskScore.level === 'medium'
                  ? chalk.cyan
                  : chalk.green

          console.log()
          console.log(chalk.bold.cyan(` 🔍  Migration: ${match.name}`))
          console.log(chalk.dim('━'.repeat(60)))
          console.log(`  ${chalk.bold('Status:')}    ${chalk.green(match.status ?? 'applied')}`)
          console.log(`  ${chalk.bold('Applied:')}   ${match.appliedAt ?? match.timestamp}`)
          console.log(
            `  ${chalk.bold('Risk:')}      ${riskColor(riskScore.level.toUpperCase())} (score: ${riskScore.score})`,
          )
          console.log(`  ${chalk.bold('Statements:')} ${statements.length}`)

          if (riskScore.factors && riskScore.factors.length > 0) {
            console.log()
            console.log(chalk.bold('  Risk Factors:'))
            for (const f of riskScore.factors) {
              console.log(`    ${chalk.red('•')} ${f.description} ${chalk.dim(`[${f.severity}]`)}`)
            }
          }

          if (simulation.warnings.length > 0) {
            console.log()
            console.log(chalk.bold('  Warnings:'))
            for (const w of simulation.warnings) {
              console.log(`    ${chalk.yellow('⚠')} ${w}`)
            }
          }

          if (options.sql) {
            console.log()
            console.log(chalk.bold('  SQL:'))
            console.log(chalk.dim('  ' + '─'.repeat(56)))
            console.log(
              sql
                .split('\n')
                .map((l) => `  ${chalk.gray(l)}`)
                .join('\n'),
            )
          }

          if (rollbackPlan) {
            console.log()
            console.log(chalk.bold('  Rollback Plan:'))
            const auto = rollbackPlan.steps.filter((s) => s.automated).length
            const manual = rollbackPlan.steps.filter((s) => !s.automated).length
            console.log(
              `    ${chalk.green(`${auto} automated`)} / ${chalk.yellow(`${manual} manual`)} steps`,
            )
            if (rollbackPlan.warnings.length > 0) {
              for (const w of rollbackPlan.warnings) {
                console.log(`    ${chalk.yellow('⚠')} ${w}`)
              }
            }
          }

          console.log()

          await Promise.all([
            writeAuditEntry(cwd, 'migration.inspect', 'success', { migration: match.name }),
            trackEvent('inspect', 1),
          ]).catch(() => {})
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(chalk.red(`✖  ${message}`))
          process.exit(1)
        }
      },
    )
}
