import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { getConfig } from '../core/config-loader.js'
import { getMigrations, getProjectStatus } from '../core/migration-analyzer.js'
import { buildWebhooksFromEnv, notify } from '../core/notifications.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

/**
 * Exit codes (documented in README):
 *   0 – All good
 *   1 – Pending migrations
 *   2 – Schema drift detected
 *   3 – Failed migrations
 *   4 – Runtime error
 *   5 – Risk threshold exceeded (when --fail-on-risk is used)
 */
export function checkCommand() {
  return new Command('check')
    .description('Validate database migration state (CI-friendly)')
    .option('--ci', 'Exit with a non-zero code when issues are found (for CI pipelines)')
    .option('--json', 'Output result as JSON to stdout')
    .option(
      '--fail-on-risk <level>',
      'Exit code 5 when risk meets or exceeds this level (low|medium|high)',
    )
    .option('--quiet', 'Suppress non-essential output')
    .action(
      async (options: { ci?: boolean; json?: boolean; failOnRisk?: string; quiet?: boolean }) => {
        const cwd = process.cwd()

        try {
          const project = await detectPrismaProject(cwd)

          if (!project) {
            if (options.json) {
              process.stdout.write(
                `${JSON.stringify({ ok: false, error: 'No Prisma project found' })}\n`,
              )
            } else if (!options.quiet) {
              console.error(chalk.red('✖ No Prisma project found.'))
              console.error(chalk.dim('  Run prisma init to create a schema, then try again.'))
            }
            process.exit(4)
          }

          const [status, migrations, config] = await Promise.all([
            getProjectStatus(cwd),
            getMigrations(cwd),
            getConfig(cwd),
          ])

          const ok =
            status.migrationsFailed === 0 && !status.driftDetected && status.migrationsPending === 0

          const result = {
            ok,
            connected: status.connected,
            pendingCount: status.migrationsPending,
            failedCount: status.migrationsFailed,
            driftDetected: status.driftDetected,
            driftCount: status.driftCount,
            riskLevel: status.riskLevel,
            lastSync: status.lastSync,
            provider: status.provider,
          }

          if (options.json) {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
          } else if (!options.quiet) {
            // ── Human-readable output ──────────────────────────────────────
            const bar = chalk.dim('━'.repeat(50))
            console.log()
            console.log(chalk.bold.cyan(' 🔍  PrismaFlow Check'))
            console.log(bar)

            // Connection status
            if (status.connected) {
              console.log(
                chalk.green(' ✔  Database connected') +
                  (status.provider ? chalk.dim(` (${status.provider})`) : ''),
              )
            } else {
              console.log(chalk.red(' ✖  Database unreachable — check DATABASE_URL'))
            }

            // Applied migrations
            console.log(
              chalk.green(` ✔  Applied migrations: `) +
                chalk.bold(String(status.migrationsApplied)),
            )

            // Pending migrations
            if (status.migrationsPending > 0) {
              console.log(
                chalk.yellow(` ⚠  Pending migrations: `) +
                  chalk.bold.yellow(String(status.migrationsPending)),
              )
              const pendingMigrations = migrations.filter((m) => m.status === 'pending').slice(0, 3)
              for (const m of pendingMigrations) {
                console.log(chalk.dim(`     • ${m.name}`))
              }
              if (status.migrationsPending > 3) {
                console.log(chalk.dim(`     … and ${status.migrationsPending - 3} more`))
              }
            } else {
              console.log(chalk.green(' ✔  No pending migrations'))
            }

            // Failed migrations
            if (status.migrationsFailed > 0) {
              console.log(
                chalk.red(` ✖  Failed migrations: `) +
                  chalk.bold.red(String(status.migrationsFailed)),
              )
              const failedMigrations = migrations.filter((m) => m.status === 'failed').slice(0, 3)
              for (const m of failedMigrations) {
                console.log(chalk.dim(`     • ${m.name}`))
              }
            } else {
              console.log(chalk.green(' ✔  No failed migrations'))
            }

            // Drift
            if (status.driftDetected) {
              console.log(
                chalk.red(` ✖  Schema drift detected: `) +
                  chalk.bold.red(
                    `${status.driftCount} difference${status.driftCount !== 1 ? 's' : ''}`,
                  ),
              )
              console.log(chalk.dim('     Run: prisma-flow repair to generate a fix'))
            } else {
              console.log(chalk.green(' ✔  No schema drift detected'))
            }

            // Risk level
            const riskColors: Record<string, (text: string) => string> = {
              low: chalk.green,
              medium: chalk.yellow,
              high: chalk.red,
            }
            const riskColor = riskColors[status.riskLevel] ?? chalk.white
            console.log(` 🔒  Risk level: ` + riskColor(chalk.bold(status.riskLevel.toUpperCase())))

            // Risk factors from highest-scored migration
            const highestRiskMigration = migrations
              .filter((m) => m.riskScore.score > 0)
              .sort((a, b) => b.riskScore.score - a.riskScore.score)[0]

            if (highestRiskMigration?.riskScore.factors.length) {
              console.log(chalk.dim(`\n     Top risk in ${highestRiskMigration.name}:`))
              for (const factor of highestRiskMigration.riskScore.factors.slice(0, 2)) {
                console.log(chalk.dim(`       • ${factor.description}`))
              }
            }

            console.log(bar)

            // Overall status
            if (ok) {
              console.log(chalk.bold.green(' ✔  All checks passed'))
            } else {
              console.log(chalk.bold.red(` ✖  Issues detected — review above`))
              if (status.migrationsFailed > 0) {
                console.log(chalk.dim('     → Fix: Run prisma migrate resolve'))
              }
              if (status.migrationsPending > 0) {
                console.log(chalk.dim('     → Fix: Run prisma migrate deploy'))
              }
              if (status.driftDetected) {
                console.log(chalk.dim('     → Fix: Run prisma-flow repair'))
              }
            }
            console.log()
          }

          // ── Audit & telemetry (non-blocking) ──────────────────────────────
          await Promise.all([
            writeAuditEntry(cwd, 'migration.check', ok ? 'success' : 'warning', {
              pendingCount: status.migrationsPending,
              failedCount: status.migrationsFailed,
              driftDetected: status.driftDetected,
              riskLevel: status.riskLevel,
            }),
            trackEvent('check', migrations.length),
            // Notify on check-complete via webhooks
            (async () => {
              const webhooks = (
                config.webhooks.length > 0 ? config.webhooks : buildWebhooksFromEnv()
              ) as import('@prisma-flow/shared').WebhookConfig[]
              await notify(webhooks, {
                event: 'check-complete',
                message: ok ? 'All migration checks passed' : 'Migration check found issues',
                detail: {
                  pending: status.migrationsPending,
                  failed: status.migrationsFailed,
                  drift: status.driftDetected,
                },
              })
            })(),
            // Notify if drift or failed migrations (separate urgent alert)
            (async () => {
              if (status.driftDetected || status.migrationsFailed > 0) {
                const webhooks = (
                  config.webhooks.length > 0 ? config.webhooks : buildWebhooksFromEnv()
                ) as import('@prisma-flow/shared').WebhookConfig[]
                if (status.migrationsFailed > 0) {
                  await notify(webhooks, {
                    event: 'migration-failed',
                    message: `${status.migrationsFailed} migration(s) have failed`,
                    detail: {
                      failed: migrations.filter((m) => m.status === 'failed').map((m) => m.name),
                    },
                  })
                }
                if (status.driftDetected) {
                  await notify(webhooks, {
                    event: 'drift-detected',
                    message: `Schema drift detected: ${status.driftCount} difference(s)`,
                  })
                }
              }
            })(),
          ]).catch(() => {
            /* background tasks — never fail the command */
          })

          // ── Exit codes ────────────────────────────────────────────────────
          if (options.failOnRisk) {
            const riskOrder: Record<string, number> = { low: 1, medium: 2, high: 3 }
            const threshold = riskOrder[options.failOnRisk] ?? 2
            const current = riskOrder[status.riskLevel] ?? 1
            if (current >= threshold) process.exit(5)
          }

          if (options.ci) {
            if (status.migrationsFailed > 0) process.exit(3)
            if (status.driftDetected) process.exit(2)
            if (status.migrationsPending > 0) process.exit(1)
            process.exit(0)
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          if (options.json) {
            process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`)
          } else if (!options.quiet) {
            console.error(chalk.red(`✖ Error: ${message}`))
          }
          await writeAuditEntry(cwd, 'migration.check', 'failure', { error: message }).catch(
            () => {},
          )
          process.exit(4)
        }
      },
    )
}
