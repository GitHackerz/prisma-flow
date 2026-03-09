/**
 * `prisma-flow history` — show migration history enriched with git metadata,
 * risk scores, and timestamps.
 */

import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { getGitMigrationInfo, isGitRepo } from '../core/git-awareness.js'
import { getMigrations } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

export function historyCommand() {
  return new Command('history')
    .description('Show migration history with risk and git metadata')
    .option('--limit <n>', 'Show last N migrations', '20')
    .option('--json', 'Output as JSON')
    .option('--git', 'Include git information (slower)')
    .action(async (options: { limit?: string; json?: boolean; git?: boolean }) => {
      const cwd = process.cwd()
      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found.'))
          process.exit(1)
        }

        const limit = Number.parseInt(options.limit ?? '20', 10)
        const all = await getMigrations(cwd)
        const migrations = all.slice(-limit).reverse() // most recent first

        const gitInfo: Map<
          string,
          {
            committed: boolean
            commitHash?: string
            commitAuthor?: string
            commitDate?: string
            commitMessage?: string
          }
        > = new Map()

        if (options.git) {
          const inRepo = await isGitRepo(cwd)
          if (inRepo) {
            const raw = await getGitMigrationInfo(project.migrationsPath, cwd)
            for (const info of raw) {
              gitInfo.set(info.migrationName, info)
            }
          }
        }

        if (options.json) {
          const output = migrations.map((m) => ({
            ...m,
            git: gitInfo.get(m.name),
          }))
          process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
          process.exit(0)
        }

        console.log()
        console.log(chalk.bold.cyan(` 📜  Migration History (last ${limit})`))
        console.log(chalk.dim('━'.repeat(65)))

        for (const m of migrations) {
          const status = m.status ?? 'applied'
          const statusColor =
            status === 'applied'
              ? chalk.green
              : status === 'pending'
                ? chalk.yellow
                : status === 'failed'
                  ? chalk.red
                  : chalk.gray

          const riskLabel = m.riskScore
            ? m.riskScore.level === 'critical' || m.riskScore.level === 'high'
              ? chalk.red(`[${m.riskScore.level}]`)
              : m.riskScore.level === 'medium'
                ? chalk.yellow(`[${m.riskScore.level}]`)
                : chalk.dim(`[${m.riskScore.level}]`)
            : ''

          console.log(`  ${statusColor('●')} ${chalk.bold(m.name)} ${riskLabel}`)
          console.log(
            `    ${chalk.dim('Applied:')} ${m.appliedAt ?? m.timestamp}  ${chalk.dim('Status:')} ${statusColor(status)}`,
          )

          if (options.git) {
            const git = gitInfo.get(m.name)
            if (git?.committed) {
              console.log(
                `    ${chalk.dim('Author:')}  ${git.commitAuthor ?? 'unknown'}  ${chalk.dim('Commit:')} ${git.commitHash?.slice(0, 8) ?? '-'}`,
              )
              if (git.commitMessage) {
                console.log(`    ${chalk.dim('Message:')} ${git.commitMessage}`)
              }
            } else if (git) {
              console.log(`    ${chalk.yellow('⚠')} Not committed to git`)
            }
          }
        }

        console.log()
        console.log(chalk.dim(`  Showing ${migrations.length} of ${all.length} total migrations`))
        console.log()

        await Promise.all([
          writeAuditEntry(cwd, 'migration.history', 'success', { count: migrations.length }),
          trackEvent('history', migrations.length),
        ]).catch(() => {})

        process.exit(0)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✖  ${message}`))
        process.exit(1)
      }
    })
}
