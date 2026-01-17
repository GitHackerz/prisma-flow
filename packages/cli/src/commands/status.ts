import { Command } from 'commander'
import { detectPrismaProject } from '../core/prisma-detector'
import { getProjectStatus } from '../core/migration-analyzer'
import chalk from 'chalk'

export function statusCommand() {
  return new Command('status')
    .description('Check migration status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const project = await detectPrismaProject(process.cwd())
        
        if (!project) {
          console.log(chalk.red('❌ No Prisma project found'))
          process.exit(1)
        }
        
        const status = await getProjectStatus(process.cwd())
        
        if (options.json) {
          console.log(JSON.stringify(status, null, 2))
          return
        }
        
        console.log(chalk.bold('\nPrismaFlow Status Check'))
        console.log('━'.repeat(40))
        console.log(chalk.green('✓ Prisma project detected'))
        console.log(status.connected ? chalk.green('✓ Database connected') : chalk.red('❌ Database connection failed'))
        
        console.log(chalk.bold('\nMigrations:'))
        console.log(`  Applied:  ${chalk.green(status.appliedCount)} migrations`)
        console.log(`  Pending:  ${chalk.yellow(status.pendingCount)} migrations`)
        console.log(`  Failed:   ${chalk.red(status.failedCount)} migrations`)
        
        console.log(chalk.bold('\nSchema Drift:'))
        if (status.hasDrift) {
          console.log(chalk.yellow(`  ⚠ Drift detected`))
        } else {
          console.log(chalk.green('  ✓ No drift detected'))
        }
        
        console.log(chalk.gray(`\n⚠ Run 'npx prisma-flow' to open dashboard\n`))
        
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`))
        process.exit(1)
      }
    })
}
