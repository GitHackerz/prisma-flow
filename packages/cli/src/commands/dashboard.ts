import chalk from 'chalk'
import { Command } from 'commander'
import open from 'open'
import { writeAuditEntry } from '../core/audit.js'
import { getConfig } from '../core/config-loader.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'
import { createServer, startServer } from '../server/index.js'

export function dashboardCommand() {
  return new Command('dashboard')
    .description('Launch PrismaFlow dashboard')
    .option('-p, --port <port>', 'Port to run dashboard on')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options: { port?: string; open?: boolean }) => {
      const cwd = process.cwd()
      try {
        const config = await getConfig(cwd)

        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found in the current directory.'))
          console.error(chalk.dim('   Make sure prisma/schema.prisma exists.'))
          process.exit(1)
        }

        const port = options.port ? Number.parseInt(options.port, 10) : (config.port ?? 5555)
        const shouldOpen = options.open !== false && config.openBrowser

        const { app, token } = createServer(cwd)
        const url = `http://localhost:${port}?token=${token}`
        startServer(app, port)

        console.log()
        console.log(chalk.bold.cyan(' 🚀  PrismaFlow Dashboard'))
        console.log(chalk.dim('━'.repeat(40)))
        console.log(`  ${chalk.bold('URL:')} ${chalk.underline(url)}`)
        console.log(`  ${chalk.bold('Project:')} ${project.schemaPath}`)
        if (project.provider) {
          console.log(`  ${chalk.bold('Provider:')} ${project.provider}`)
        }
        console.log()
        console.log(chalk.dim('  Press Ctrl+C to stop the server.'))
        console.log()

        if (shouldOpen) {
          await open(url)
        }

        await Promise.all([
          writeAuditEntry(cwd, 'dashboard.start', 'success', { port }),
          trackEvent('dashboard', project.migrations.length),
        ]).catch(() => {})
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(chalk.red(`✖  Failed to start dashboard: ${message}`))
        process.exit(1)
      }
    })
}
