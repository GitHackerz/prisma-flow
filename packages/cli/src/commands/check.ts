import { Command } from 'commander'
import { getProjectStatus } from '../core/migration-analyzer'

export function checkCommand() {
  return new Command('check')
    .description('Check migrations (CI-friendly)')
    .option('--ci', 'CI mode with exit codes')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const status = await getProjectStatus(process.cwd())
        
        if (options.json) {
          console.log(JSON.stringify(status, null, 2))
        }
        
        // Exit codes for CI
        if (options.ci) {
          if (status.failedCount > 0) {
            process.exit(3) // Failed migrations
          }
          if (status.hasDrift) {
            process.exit(2) // Drift detected
          }
          if (status.pendingCount > 0) {
            process.exit(1) // Pending migrations
          }
          process.exit(0) // All good
        }
        
      } catch (error: any) {
        console.error(`Error: ${error.message}`)
        process.exit(1)
      }
    })
}
