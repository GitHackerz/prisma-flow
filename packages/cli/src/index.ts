#!/usr/bin/env node
import { Command } from 'commander'
import { checkCommand } from './commands/check.js'
import { dashboardCommand } from './commands/dashboard.js'
import { doctorCommand } from './commands/doctor.js'
import { initCommand } from './commands/init.js'
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

program.parse(process.argv)
