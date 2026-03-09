/**
 * `prisma-flow compare` — compare migration state across environments.
 * Reads environment URLs from prismaflow.config.ts or environment variables.
 */

import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { getConfig } from '../core/config-loader.js'
import { compareEnvironments } from '../core/env-comparator.js'
import { detectPrismaProject } from '../core/prisma-detector.js'
import { trackEvent } from '../core/telemetry.js'

export function compareCommand() {
  return new Command('compare')
    .description('Compare migration state across multiple environments')
    .option('--envs <names>', 'Comma-separated env names from config (e.g. dev,staging,prod)')
    .option('--json', 'Output as JSON')
    .action(async (options: { envs?: string; json?: boolean }) => {
      const cwd = process.cwd()
      try {
        const project = await detectPrismaProject(cwd)
        if (!project) {
          console.error(chalk.red('✖  No Prisma project found.'))
          process.exit(1)
        }

        const config = await getConfig(cwd)
        const configEnvList = config.environments ?? []

        // Build list of environments to compare
        type EnvEntry = { name: string; databaseUrl: string }
        let envList: EnvEntry[] = []

        if (options.envs) {
          for (const name of options.envs.split(',').map((s) => s.trim())) {
            const envEntry = configEnvList.find((e) => e.name === name)
            const url =
              envEntry?.databaseUrl ??
              process.env[`DATABASE_URL_${name.toUpperCase()}`] ??
              process.env.DATABASE_URL

            if (!url) {
              console.error(chalk.red(`✖  No database URL for environment "${name}".`))
              console.error(
                chalk.dim(
                  `   Add it to prismaflow.config.ts or set DATABASE_URL_${name.toUpperCase()}`,
                ),
              )
              process.exit(1)
            }
            envList.push({ name, databaseUrl: url })
          }
        } else if (configEnvList.length > 0) {
          for (const entry of configEnvList) {
            envList.push({ name: entry.name, databaseUrl: entry.databaseUrl })
          }
        } else {
          // Fallback: current env only
          const url = project.databaseUrl ?? process.env.DATABASE_URL
          if (!url) {
            console.error(chalk.red('✖  No environments configured and no DATABASE_URL found.'))
            console.error(
              chalk.dim('   Add environments to prismaflow.config.ts or use --envs <name,name>'),
            )
            process.exit(1)
          }
          envList = [{ name: 'default', databaseUrl: url }]
          if (envList.length < 2) {
            console.error(chalk.yellow('⚠  At least 2 environments are required for comparison.'))
            process.exit(1)
          }
        }

        if (envList.length < 2) {
          console.error(chalk.yellow('⚠  At least 2 environments are needed for comparison.'))
          process.exit(1)
        }

        if (!options.json) {
          process.stdout.write(
            chalk.dim(`  Comparing ${envList.map((e) => e.name).join(' vs ')}...\n`),
          )
        }

        const comparison = await compareEnvironments(envList, project.schemaPath, cwd)

        if (options.json) {
          process.stdout.write(`${JSON.stringify(comparison, null, 2)}\n`)
          process.exit(0)
        }

        console.log()
        console.log(chalk.bold.cyan(' 🌐  Environment Comparison'))
        console.log(chalk.dim('━'.repeat(55)))

        for (const env of comparison.environments) {
          const reach = env.reachable ? chalk.green('●') : chalk.red('×')
          console.log(
            `  ${reach} ${chalk.bold(env.name.padEnd(15))} applied: ${env.appliedCount}, pending: ${env.pendingCount}${env.failedCount > 0 ? chalk.red(`, failed: ${env.failedCount}`) : ''}`,
          )
        }

        console.log()

        for (const diff of comparison.diffs) {
          const icon = diff.inSync ? chalk.green('✓') : chalk.yellow('⚠')
          console.log(
            `  ${icon} ${diff.sourceEnv} ↔ ${diff.targetEnv}: ${diff.inSync ? chalk.green('in sync') : chalk.yellow('out of sync')}`,
          )
          if (!diff.inSync) {
            if (diff.onlyInSource.length > 0) {
              console.log(
                `     ${chalk.dim('Only in')} ${diff.sourceEnv}: ${diff.onlyInSource.join(', ')}`,
              )
            }
            if (diff.onlyInTarget.length > 0) {
              console.log(
                `     ${chalk.dim('Only in')} ${diff.targetEnv}: ${diff.onlyInTarget.join(', ')}`,
              )
            }
            if (diff.divergencePoint) {
              console.log(`     ${chalk.dim('Diverged after:')} ${diff.divergencePoint}`)
            }
          }
        }

        console.log()
        if (comparison.allInSync) {
          console.log(chalk.bold.green('  ✔  All environments are in sync.'))
        } else {
          console.log(chalk.bold.yellow('  ⚠  Environments are out of sync — review diffs above.'))
        }
        console.log()

        await Promise.all([
          writeAuditEntry(cwd, 'env.compare', 'success', {
            environments: envList.map((e) => e.name),
            allInSync: comparison.allInSync,
          }),
          trackEvent('compare', envList.length),
        ]).catch(() => {})

        process.exit(comparison.allInSync ? 0 : 2)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✖  ${message}`))
        process.exit(1)
      }
    })
}
