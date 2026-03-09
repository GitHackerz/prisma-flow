/**
 * `prisma-flow diff` — show schema diff between current schema and the database,
 * or between two named environments.
 */

import type { SchemaDiff } from '@prisma-flow/shared'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { diffSchemaVsDatabase } from '../core/schema-differ.js'
import { trackEvent } from '../core/telemetry.js'

export function diffCommand() {
  return new Command('diff')
    .description('Show schema diff between your Prisma schema and the live database')
    .option('--from <url>', 'Source database URL (defaults to DATABASE_URL)')
    .option('--json', 'Output as JSON')
    .option('--breaking-only', 'Show only breaking changes')
    .action(async (options: { from?: string; json?: boolean; breakingOnly?: boolean }) => {
      const cwd = process.cwd()
      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found.'))
          process.exit(1)
        }

        const dbUrl = options.from ?? project.databaseUrl ?? process.env.DATABASE_URL
        if (!dbUrl) {
          console.error(chalk.red('✖  No database URL found.'))
          console.error(chalk.dim('   Set DATABASE_URL or use --from <url>'))
          process.exit(1)
        }

        if (!options.json) {
          process.stdout.write(chalk.dim('  Computing schema diff...\n'))
        }

        const { sql, diffs } = await diffSchemaVsDatabase(project.schemaPath, dbUrl, cwd)

        const filtered: SchemaDiff[] = options.breakingOnly
          ? diffs.filter((d) => d.breaking)
          : diffs

        if (options.json) {
          process.stdout.write(`${JSON.stringify({ diffs: filtered, sql }, null, 2)}\n`)
          process.exit(0)
        }

        console.log()
        console.log(chalk.bold.cyan(' 📐  Schema Diff'))
        console.log(chalk.dim('━'.repeat(50)))

        if (filtered.length === 0) {
          console.log(chalk.green('  ✔  Schema is in sync with database — no differences found.'))
          console.log()
          process.exit(0)
        }

        for (const diff of filtered) {
          const icon = diff.breaking ? chalk.red('✖') : chalk.green('+')
          const label = diff.breaking ? chalk.red('BREAKING') : chalk.green('safe')
          const name = diff.modelName
            ? diff.fieldName
              ? `${diff.modelName}.${diff.fieldName}`
              : diff.modelName
            : (diff.entity ?? 'unknown')
          console.log(`  ${icon} [${label}] ${chalk.bold(name)}`)
          console.log(`    ${chalk.dim(diff.description)}`)
          if (diff.oldType || diff.newType) {
            console.log(`    ${chalk.dim(diff.oldType ?? '?')} → ${chalk.dim(diff.newType ?? '?')}`)
          }
        }

        const breaking = filtered.filter((d) => d.breaking).length
        console.log()
        console.log(
          chalk.dim(
            `  ${filtered.length} difference(s) found — ${breaking} breaking, ${filtered.length - breaking} safe`,
          ),
        )
        console.log()

        await Promise.all([
          writeAuditEntry(cwd, 'schema.diff', 'success', { diffs: filtered.length, breaking }),
          trackEvent('diff', filtered.length),
        ]).catch(() => {})

        process.exit(breaking > 0 ? 2 : 0)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✖  ${message}`))
        process.exit(1)
      }
    })
}
