import fs from 'node:fs/promises'
import path from 'node:path'
import type { DeploymentPlan, DeploymentPlanAction } from '@prisma-flow/shared'
import chalk from 'chalk'
import { Command } from 'commander'
import { writeAuditEntry } from '../core/audit.js'
import { buildDeploymentPlan } from '../core/deployment-plan.js'
import { trackEvent } from '../core/telemetry.js'

type PlanFormat = 'human' | 'json' | 'markdown'

function normalizeFormat(format: string | undefined, json?: boolean): PlanFormat {
  if (json) return 'json'
  if (format === 'json' || format === 'markdown' || format === 'md') {
    return format === 'md' ? 'markdown' : format
  }
  return 'human'
}

function renderMarkdown(plan: DeploymentPlan): string {
  const lines = [
    '# PrismaFlow Deployment Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    `Decision: ${plan.decision}`,
    `Score: ${plan.score}/100`,
    '',
    plan.summary,
    '',
    '## Project',
    '',
    `- Schema: ${plan.project.schemaPath}`,
    `- Migrations: ${plan.project.migrationsPath}`,
    `- Provider: ${plan.project.provider ?? 'unknown'}`,
    `- Prisma version: ${plan.project.prismaVersion ?? 'unknown'}`,
    `- Package manager: ${plan.project.packageManager ?? 'unknown'}`,
    `- DATABASE_URL detected: ${plan.project.hasDatabaseUrl ? 'yes' : 'no'}`,
    '',
    '## Readiness Checks',
    '',
    '| Check | Status | Message |',
    '| --- | --- | --- |',
    ...plan.checks.map(
      (check) => `| ${check.label} | ${check.passed ? 'pass' : 'fail'} | ${check.message} |`,
    ),
    '',
    '## Migration Summary',
    '',
    `- Total: ${plan.migrations.total}`,
    `- Applied: ${plan.migrations.applied}`,
    `- Pending: ${plan.migrations.pending}`,
    `- Failed: ${plan.migrations.failed}`,
    `- Drift: ${plan.drift.detected ? `${plan.drift.count} item(s)` : 'none'}`,
    '',
    '## Next Actions',
    '',
    ...plan.actions.map(
      (action) =>
        `- **${action.priority}: ${action.title}** — ${action.detail}${
          action.command ? `\n  - Command: \`${action.command}\`` : ''
        }`,
    ),
    '',
    '## Useful Commands',
    '',
    ...plan.commands.map((command) => `- \`${command.command}\` — ${command.reason}`),
    '',
  ]

  if (plan.migrations.highestRisk) {
    lines.splice(
      lines.indexOf('## Next Actions') - 1,
      0,
      '',
      '## Highest Risk',
      '',
      `- Migration: ${plan.migrations.highestRisk.name}`,
      `- Level: ${plan.migrations.highestRisk.level}`,
      `- Score: ${plan.migrations.highestRisk.score}/100`,
    )
  }

  return `${lines.join('\n')}\n`
}

async function writeOutput(content: string, outputPath?: string): Promise<string | null> {
  if (!outputPath) {
    process.stdout.write(content)
    return null
  }

  const resolved = path.resolve(process.cwd(), outputPath)
  await fs.mkdir(path.dirname(resolved), { recursive: true })
  await fs.writeFile(resolved, content, 'utf-8')
  return resolved
}

function actionIcon(priority: DeploymentPlanAction['priority']): string {
  if (priority === 'blocker') return chalk.red('!')
  if (priority === 'recommended') return chalk.yellow('>')
  return chalk.dim('-')
}

function decisionColor(decision: DeploymentPlan['decision']) {
  if (decision === 'ready') return chalk.green
  if (decision === 'attention') return chalk.yellow
  return chalk.red
}

function renderHuman(plan: DeploymentPlan): string {
  const color = decisionColor(plan.decision)
  const lines = [
    '',
    chalk.bold.cyan(' PrismaFlow Deployment Plan'),
    chalk.dim('━'.repeat(60)),
    `${chalk.bold('Decision:')} ${color(plan.decision.toUpperCase())}`,
    `${chalk.bold('Score:')}    ${color(`${plan.score}/100`)}`,
    `${chalk.bold('Summary:')}  ${plan.summary}`,
    '',
    chalk.bold('Project'),
    `  Schema:     ${chalk.dim(plan.project.schemaPath)}`,
    `  Migrations: ${chalk.dim(plan.project.migrationsPath)}`,
    `  Provider:   ${chalk.dim(plan.project.provider ?? 'unknown')}`,
    '',
    chalk.bold('Readiness'),
  ]

  for (const check of plan.checks) {
    lines.push(
      `  ${check.passed ? chalk.green('✓') : chalk.red('✗')} ${check.label}: ${chalk.dim(
        check.message,
      )}`,
    )
  }

  lines.push(
    '',
    chalk.bold('Migrations'),
    `  ${plan.migrations.applied} applied / ${plan.migrations.pending} pending / ${plan.migrations.failed} failed`,
  )

  if (plan.migrations.highestRisk) {
    lines.push(
      `  Highest risk: ${plan.migrations.highestRisk.name} ${chalk.dim(
        `(${plan.migrations.highestRisk.level}, ${plan.migrations.highestRisk.score}/100)`,
      )}`,
    )
  }

  lines.push('', chalk.bold('Next Actions'))
  for (const action of plan.actions) {
    lines.push(`  ${actionIcon(action.priority)} ${chalk.bold(action.title)}`)
    lines.push(`    ${chalk.dim(action.detail)}`)
    if (action.command) lines.push(`    ${chalk.cyan(action.command)}`)
  }

  lines.push('', chalk.bold('Useful Commands'))
  for (const command of plan.commands.slice(0, 5)) {
    lines.push(`  ${chalk.cyan(command.command)}`)
    lines.push(`    ${chalk.dim(command.reason)}`)
  }

  lines.push('', chalk.dim('━'.repeat(60)), '')
  return `${lines.join('\n')}`
}

function exitCodeForPlan(plan: DeploymentPlan, ci?: boolean): number {
  if (!ci) return 0
  if (plan.decision === 'blocked') return 2
  if (plan.decision === 'attention') return 1
  return 0
}

export function planCommand() {
  return new Command('plan')
    .description('Generate an actionable migration deployment plan')
    .option('--format <format>', 'Output format: human, json, or markdown', 'human')
    .option('--json', 'Shortcut for --format json')
    .option('--ci', 'Exit non-zero when the plan is attention or blocked')
    .option('-o, --output <path>', 'Write JSON or Markdown output to a file')
    .action(
      async (options: {
        format?: string
        json?: boolean
        ci?: boolean
        output?: string
      }) => {
        const cwd = process.cwd()
        const format = normalizeFormat(options.format, options.json)

        try {
          const plan = await buildDeploymentPlan(cwd)
          const content =
            format === 'json'
              ? `${JSON.stringify(plan, null, 2)}\n`
              : format === 'markdown'
                ? renderMarkdown(plan)
                : renderHuman(plan)

          const writtenPath = await writeOutput(content, options.output)
          if (writtenPath) {
            process.stdout.write(`${chalk.green('✓ Plan written:')} ${writtenPath}\n`)
          }

          await Promise.all([
            writeAuditEntry(
              cwd,
              'deployment.plan',
              plan.decision === 'ready' ? 'success' : 'warning',
              {
                decision: plan.decision,
                score: plan.score,
                pending: plan.migrations.pending,
                failed: plan.migrations.failed,
                drift: plan.drift.count,
              },
            ),
            trackEvent('plan', plan.migrations.total),
          ]).catch(() => {})

          process.exit(exitCodeForPlan(plan, options.ci))
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          if (format === 'json') {
            process.stdout.write(`${JSON.stringify({ error: message }, null, 2)}\n`)
          } else {
            process.stderr.write(`${chalk.red(`✖ Plan failed: ${message}`)}\n`)
          }
          await writeAuditEntry(cwd, 'deployment.plan', 'failure', { error: message }).catch(
            () => {},
          )
          process.exit(4)
        }
      },
    )
}
