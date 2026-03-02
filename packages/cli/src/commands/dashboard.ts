import { Command } from 'commander'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { createServer, startServer } from '../server/index.js'
import open from 'open'
import chalk from 'chalk'

export function dashboardCommand() {
  return new Command('dashboard')
    .description('Launch PrismaFlow dashboard')
    .option('-p, --port <port>', 'Port to run dashboard on', '5555')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🔍 Detecting Prisma project...\n'))

        const project = await detectPrismaProject(process.cwd())

        if (!project) {
          console.log(chalk.red('❌ No Prisma project found'))
          console.log(chalk.yellow('\nMake sure you are in a directory with prisma/schema.prisma'))
          process.exit(1)
        }

        console.log(chalk.green('✓ Prisma project detected'))
        console.log(chalk.gray(`  Schema:     ${project.schemaPath}`))
        console.log(chalk.gray(`  Migrations: ${project.migrations.length} found\n`))

        const { app, token } = createServer(process.cwd())
        const port = parseInt(options.port, 10)

        const url = `http://localhost:${port}?token=${token}`
        startServer(app, port)

        console.log(chalk.green(`\n✓ PrismaFlow dashboard running`))
        console.log(chalk.cyan(`  → ${url}\n`))
        console.log(chalk.gray('  Auth token printed above — keep it private.'))
        console.log(chalk.gray('  Press Ctrl+C to stop\n'))

        if (options.open) {
          await open(url)
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(chalk.red(`\n❌ Error: ${message}`))
        process.exit(1)
      }
    })
}
