#!/usr/bin/env node
import { Command } from 'commander'
import { dashboardCommand } from './commands/dashboard'
import { statusCommand } from './commands/status'
import { checkCommand } from './commands/check'

const program = new Command()

program
  .name('prisma-flow')
  .description('Prisma Migration Management CLI')
  .version('0.1.0')

program.addCommand(dashboardCommand(), { isDefault: true })
program.addCommand(statusCommand())
program.addCommand(checkCommand())

program.parse(process.argv)
