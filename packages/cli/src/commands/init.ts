import fs from 'node:fs/promises'
import path from 'node:path'
import { Command } from 'commander'

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
   * Feature flags — set to true to enable (requires Pro licence key).
   */
  features: {
    riskAnalysis:      true,
    webhookAlerts:     false,
    auditLog:          false,
    ciAnnotations:     false,
  },

  /**
   * Webhook URLs to notify on drift / failure events.
   * Supports Slack, Discord, or any HTTP endpoint.
   *
   * webhooks: [
   *   { type: 'slack',   url: process.env.SLACK_WEBHOOK_URL! },
   *   { type: 'discord', url: process.env.DISCORD_WEBHOOK_URL! },
   * ],
   */
  webhooks: [],
}

export default config
`

export function initCommand() {
  return new Command('init')
    .description('Create a prismaflow.config.ts in the current project')
    .option('-f, --force', 'Overwrite existing config file')
    .action(async (options: { force?: boolean }) => {
      const dest = path.join(process.cwd(), 'prismaflow.config.ts')

      try {
        await fs.access(dest)
        if (!options.force) {
          process.exit(0)
        }
      } catch {
        // file does not exist — safe to create
      }

      await fs.writeFile(dest, CONFIG_TEMPLATE, 'utf-8')
    })
}
