import chalk from 'chalk'
import { Command } from 'commander'
import { getProjectStatus } from '../core/migration-analyzer.js'
import { detectPrismaProject } from '../core/prisma-detector.js'

export function statusCommand() {
  return new Command('status')
    .description('Show current migration and database status')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        const project = await detectPrismaProject(process.cwd())

        if (!project) {
          process.exit(1)
        }

        const status = await getProjectStatus(process.cwd())

        if (options.json) {
          process.stdout.write(`${JSON.stringify(status, null, 2)}\n`)
          process.exit(0)
        }

        const _bar = '━'.repeat(44)
        if (status.hasDrift) {
        } else {
        }
        const _riskColor =
          status.riskLevel === 'high'
            ? chalk.red
            : status.riskLevel === 'medium'
              ? chalk.yellow
              : chalk.green
      } catch (error: unknown) {
        const _message = error instanceof Error ? error.message : String(error)
        process.exit(1)
      }
    })
}
