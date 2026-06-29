import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
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
   * V1 local-first feature flags. Core safety features are free.
   */
  features: {
    riskAnalysis:  true,
    simulation:    true,
    ciAnnotations: true,
  },

  /**
   * Named environments are reserved for the roadmap.
   * environments: [
   *   { name: 'staging',    databaseUrl: process.env.STAGING_DATABASE_URL! },
   *   { name: 'production', databaseUrl: process.env.PROD_DATABASE_URL! },
   * ],
   */
  environments: [],

  /**
   * Risk level that triggers warnings in CI output.
   * One of: 'low' | 'medium' | 'high' | 'critical'
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
          console.log(chalk.green('✔  Created prismaflow.config.ts'))
          console.log(chalk.dim('   Edit it to customise PrismaFlow for your project.'))
          console.log()
          console.log(chalk.dim('   Next steps:'))
          console.log(chalk.dim('     1. Confirm DATABASE_URL is set'))
          console.log(chalk.dim('     2. Run: prisma-flow doctor'))
          console.log(chalk.dim('     3. Run: prisma-flow dashboard'))
        } catch (writeErr: unknown) {
          const message = writeErr instanceof Error ? writeErr.message : String(writeErr)
          console.error(chalk.red(`✖  Failed to write config: ${message}`))
          process.exit(4)
        }
      }

      await trackEvent('init', 0).catch(() => {})
    })
}
