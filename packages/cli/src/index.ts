#!/usr/bin/env node
import { Command } from 'commander'
import { checkCommand } from './commands/check.js'
import { compareCommand } from './commands/compare.js'
import { dashboardCommand } from './commands/dashboard.js'
import { diffCommand } from './commands/diff.js'
import { doctorCommand } from './commands/doctor.js'
import { historyCommand } from './commands/history.js'
import { initCommand } from './commands/init.js'
import { inspectCommand } from './commands/inspect.js'
import { repairCommand } from './commands/repair.js'
import { rollbackCommand } from './commands/rollback.js'
import { simulateCommand } from './commands/simulate.js'
import { statusCommand } from './commands/status.js'

const program = new Command()

program
  .name('prisma-flow')
  .description('Visual Prisma migration management — safe, observable, production-ready')
  .version(process.env.npm_package_version ?? '0.1.0')

program.addCommand(dashboardCommand(), { isDefault: true })
program.addCommand(statusCommand())
program.addCommand(checkCommand())
program.addCommand(initCommand())
program.addCommand(doctorCommand())

// ── Analysis & Safety ──────────────────────────────────────────────────────
program.addCommand(inspectCommand())
program.addCommand(diffCommand())
program.addCommand(simulateCommand())
program.addCommand(rollbackCommand())

// ── Drift & Repair ────────────────────────────────────────────────────────
program.addCommand(repairCommand())

// ── Multi-environment ─────────────────────────────────────────────────────
program.addCommand(compareCommand())

// ── History & Audit ───────────────────────────────────────────────────────
program.addCommand(historyCommand())

program.parse(process.argv)
