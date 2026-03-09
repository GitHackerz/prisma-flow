/**
 * `prisma-flow repair` — detect drift and generate repair suggestions.
 * Optionally auto-applies APPLY_MIGRATION strategy items.
 */

import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectDrift } from '../core/drift-detector.js'
import { applyRepairs, generateRepairSuggestions } from '../core/drift-recovery.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

export function repairCommand() {
  return new Command('repair')
    .description('Detect drift and generate (or apply) repair suggestions')
    .option('--apply', 'Auto-apply safe repair steps (APPLY_MIGRATION only)')
    .option('--json', 'Output as JSON')
    .action(async (options: { apply?: boolean; json?: boolean }) => {
      const cwd = process.cwd()
      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found.'))
          process.exit(1)
        }

        if (!options.json) {
          process.stdout.write(chalk.dim('  Detecting drift...\n'))
        }

        const driftResult = await detectDrift(cwd)

        if (driftResult.status === 'error') {
          if (options.json) {
            process.stdout.write(
              `${JSON.stringify({ ok: false, error: driftResult.errorMessage })}\n`,
            )
          } else {
            console.error(chalk.red(`✖  Drift detection failed: ${driftResult.errorMessage}`))
          }
          process.exit(1)
        }

        if (driftResult.status === 'clean' || driftResult.items.length === 0) {
          if (options.json) {
            process.stdout.write(
              `${JSON.stringify({ ok: true, drifted: false, suggestions: [] })}\n`,
            )
          } else {
            console.log(chalk.green('  ✔  No drift detected — database is in sync.'))
          }
          process.exit(0)
        }

        const suggestions = generateRepairSuggestions(driftResult.items, project.migrationsPath)

        if (options.json) {
          process.stdout.write(
            `${JSON.stringify({ ok: true, drifted: true, suggestions }, null, 2)}\n`,
          )
          if (options.apply) {
            const results = await applyRepairs(suggestions, project.schemaPath, cwd)
            const out = JSON.stringify({ applied: results }, null, 2)
            process.stdout.write(`${out}\n`)
          }
          process.exit(0)
        }

        console.log()
        console.log(chalk.bold.cyan(' 🔧  Drift Repair'))
        console.log(chalk.dim('━'.repeat(50)))
        console.log(
          `  ${chalk.bold('Drift items found:')} ${chalk.yellow(driftResult.items.length.toString())}`,
        )
        console.log()

        for (const suggestion of suggestions) {
          const riskColor =
            suggestion.risk === 'high'
              ? chalk.red
              : suggestion.risk === 'medium'
                ? chalk.yellow
                : chalk.green
          console.log(
            `  ${riskColor('●')} [${riskColor(suggestion.risk.toUpperCase())}] ${suggestion.description}`,
          )
          console.log(
            `     Strategy: ${chalk.cyan(suggestion.strategy)} (${suggestion.automated ? chalk.green('automated') : chalk.yellow('manual')})`,
          )
          if (suggestion.sql) {
            console.log(chalk.dim(`     ${suggestion.sql.split('\n')[0]}`))
          }
        }

        if (options.apply) {
          console.log()
          console.log(chalk.bold('  Applying auto-repair steps...'))
          const results = await applyRepairs(suggestions, project.schemaPath, cwd)
          for (const r of results) {
            console.log(
              `    ${r.success ? chalk.green('✓') : chalk.red('✖')} ${r.migrationName}${r.error ? chalk.dim(` — ${r.error}`) : ''}`,
            )
          }
        } else {
          console.log()
          console.log(chalk.dim('  To auto-apply safe repairs: prisma-flow repair --apply'))
        }

        console.log()

        await Promise.all([
          writeAuditEntry(cwd, 'drift.repair', 'success', {
            items: driftResult.items.length,
            applied: options.apply,
          }),
          trackEvent('repair', driftResult.items.length),
        ]).catch(() => {})

        process.exit(driftResult.items.length > 0 && !options.apply ? 2 : 0)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✖  ${message}`))
        process.exit(1)
      }
    })
}
