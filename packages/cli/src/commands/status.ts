import { Command } from 'commander'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { getProjectStatus } from '../core/migration-analyzer.js'
import chalk from 'chalk'

export function statusCommand() {
  return new Command('status')
    .description('Show current migration and database status')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        const project = await detectPrismaProject(process.cwd())

        if (!project) {
          console.error(chalk.red('❌ No Prisma project found'))
          console.error(chalk.yellow('  Make sure you are in a directory with prisma/schema.prisma'))
          process.exit(1)
        }

        const status = await getProjectStatus(process.cwd())

        if (options.json) {
          process.stdout.write(JSON.stringify(status, null, 2) + '\n')
          process.exit(0)
        }

        const bar = '━'.repeat(44)
        console.log(chalk.bold(`\nPrismaFlow • Status`))
        console.log(chalk.gray(bar))
        console.log(chalk.green('✓ Prisma project detected'))
        console.log(
          status.connected
            ? chalk.green('✓ Database connected')
            : chalk.red('❌ Database connection failed'),
        )

        console.log(chalk.bold('\nMigrations:'))
        console.log(`  Applied : ${chalk.green(String(status.appliedCount))}`)
        console.log(`  Pending : ${chalk.yellow(String(status.pendingCount))}`)
        console.log(`  Failed  : ${status.failedCount > 0 ? chalk.red(String(status.failedCount)) : chalk.green('0')}`)

        console.log(chalk.bold('\nSchema Drift:'))
        if (status.hasDrift) {
          console.log(chalk.yellow(`  ⚠ Drift detected (${status.driftCount} difference${status.driftCount !== 1 ? 's' : ''})`)
          )
        } else {
          console.log(chalk.green('  ✓ No drift detected'))
        }

        console.log(chalk.bold('\nRisk Level:'))
        const riskColor =
          status.riskLevel === 'high'   ? chalk.red :
          status.riskLevel === 'medium' ? chalk.yellow : chalk.green
        console.log(`  ${riskColor(status.riskLevel.toUpperCase())}`)

        console.log(chalk.gray(`\n  Run ${chalk.cyan('npx prisma-flow')} to open the dashboard\n`))
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(chalk.red(`\n❌ Error: ${message}`))
        process.exit(1)
      }
    })
}
