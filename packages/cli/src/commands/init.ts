import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { trackEvent } from '../core/telemetry.js'

const CONFIG_TEMPLATE = `import type { PrismaFlowConfig } from 'prisma-flow'

const config: PrismaFlowConfig = {
  /**
   * Port for the local dashboard server.
   * Can also be set via PRISMAFLOW_PORT env var.
   */
  port: 5555,

  /**
   * Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error'
   * Can also be set via PRISMAFLOW_LOG_LEVEL env var.
   */
  logLevel: 'info',

  /**
   * Automatically open the browser when the dashboard starts.
   */
  openBrowser: true,

  /**
   * Feature flags — set to true to enable (some require a Pro licence key).
   */
  features: {
    riskAnalysis:  true,   // Free — basic risk labels
    webhookAlerts: false,  // Pro  — Slack/Discord/HTTP notifications
    auditLog:      false,  // Pro  — append-only .prismaflow/audit.jsonl
    ciAnnotations: false,  // Pro  — GitHub Actions / GitLab CI annotations
    envComparison: false,  // Pro  — cross-environment schema diff
    rollbackGen:   false,  // Pro  — auto-generate rollback SQL
    simulation:    false,  // Pro  — run migrations against a shadow database
    gitAwareness:  false,  // Pro  — detect branch conflicts in migration history
  },

  /**
   * Named environments for cross-environment comparison (Pro+).
   * environments: [
   *   { name: 'staging',    databaseUrl: process.env.STAGING_DATABASE_URL! },
   *   { name: 'production', databaseUrl: process.env.PROD_DATABASE_URL! },
   * ],
   */
  environments: [],

  /**
   * Webhook URLs to notify on drift / failure / check events.
   * Supports Slack, Discord, or any HTTP endpoint.
   * Can also be set via SLACK_WEBHOOK_URL / DISCORD_WEBHOOK_URL env vars.
   *
   * webhooks: [
   *   { type: 'slack',   url: process.env.SLACK_WEBHOOK_URL! },
   *   { type: 'discord', url: process.env.DISCORD_WEBHOOK_URL! },
   * ],
   */
  webhooks: [],

  /**
   * Maximum audit log file size before rotation (default: 10 MB).
   */
  auditLogMaxMb: 10,

  /**
   * Risk level that triggers warnings in CI output.
   * One of: 'low' | 'medium' | 'high'
   */
  riskThreshold: 'medium',
}

export default config
`

export function initCommand() {
  return new Command('init')
    .description('Create a prismaflow.config.ts in the current project')
    .option('-f, --force', 'Overwrite existing config file')
    .action(async (options: { force?: boolean }) => {
      const cwd = process.cwd()
      const dest = path.join(cwd, 'prismaflow.config.ts')

      try {
        await fs.access(dest)
        if (!options.force) {
          console.log(chalk.yellow('⚠  prismaflow.config.ts already exists.'))
          console.log(chalk.dim('   Use --force to overwrite: prisma-flow init --force'))
          process.exit(0)
        }
        // Force overwrite
        await fs.writeFile(dest, CONFIG_TEMPLATE, 'utf-8')
        console.log(chalk.green('✔  prismaflow.config.ts overwritten.'))
      } catch {
        // File does not exist — create it
        try {
          await fs.writeFile(dest, CONFIG_TEMPLATE, 'utf-8')
          console.log(chalk.green(`✔  Created prismaflow.config.ts`))
          console.log(chalk.dim(`   Edit it to customise PrismaFlow for your project.`))
          console.log()
          console.log(chalk.dim('   Next steps:'))
          console.log(chalk.dim('     1. Set PRISMAFLOW_LICENCE_KEY to unlock Pro features'))
          console.log(chalk.dim('     2. Add webhooks for Slack / Discord notifications'))
          console.log(chalk.dim('     3. Run: prisma-flow dashboard'))
        } catch (writeErr: unknown) {
          const message = writeErr instanceof Error ? writeErr.message : String(writeErr)
          console.error(chalk.red(`✖  Failed to write config: ${message}`))
          process.exit(4)
        }
      }

      await Promise.all([
        writeAuditEntry(cwd, 'migration.check', 'success', { action: 'init' }),
        trackEvent('init', 0),
      ]).catch(() => {})
    })
}
