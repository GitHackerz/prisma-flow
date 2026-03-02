import { Command } from 'commander'
import open from 'open'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { createServer, startServer } from '../server/index.js'

export function dashboardCommand() {
  return new Command('dashboard')
    .description('Launch PrismaFlow dashboard')
    .option('-p, --port <port>', 'Port to run dashboard on', '5555')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      try {
        const project = await detectPrismaProject(process.cwd())

        if (!project) {
          process.exit(1)
        }

        const { app, token } = createServer(process.cwd())
        const port = Number.parseInt(options.port, 10)

        const url = `http://localhost:${port}?token=${token}`
        startServer(app, port)

        if (options.open) {
          await open(url)
        }
      } catch (error: unknown) {
        const _message = error instanceof Error ? error.message : String(error)
        process.exit(1)
      }
    })
}
