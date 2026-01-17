import { Command } from 'commander'
import { detectPrismaProject } from '../core/prisma-detector'
import { createServer, startServer } from '../server'
import open from 'open'
import chalk from 'chalk'

export function dashboardCommand() {
  return new Command('dashboard')
    .description('Launch PrismaFlow dashboard')
    .option('-p, --port <port>', 'Port to run dashboard on', '5555')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🔍 Detecting Prisma project...\n'))
        
        const project = await detectPrismaProject(process.cwd())
        
        if (!project) {
          console.log(chalk.red('❌ No Prisma project found'))
          console.log(chalk.yellow('\nMake sure you are in a directory with prisma/schema.prisma'))
          process.exit(1)
        }
        
        console.log(chalk.green('✓ Prisma project detected'))
        console.log(chalk.gray(`  Schema: ${project.schemaPath}`))
        console.log(chalk.gray(`  Migrations: ${project.migrations.length} found\n`))
        
        // Create and start Hono server
        const app = createServer(process.cwd())
        const port = parseInt(options.port)
        
        startServer(app, port)
        
        console.log(chalk.green(`\n✓ PrismaFlow dashboard running`))
        console.log(chalk.cyan(`  → http://localhost:${port}\n`))
        
        // Open browser
        if (options.open) {
          // In a real scenario, we would serve the static frontend OR run the dev server.
          // Since the prompt asks to run the Hono server and "Launch ... dashboard",
          // and "Web dashboard (Next.js)" is in packages/dashboard...
          // We need to serve the built Next.js app or start it.
          
          // The prompt says "Launch a local web dashboard with a Hono-powered API backend".
          // And "npx prisma-flow" launches it.
          // BUT the Next.js app is in `packages/dashboard`.
          
          // If we are running locally in dev, we might want to start the next dev server too?
          // Or we expect the user to have built it?
          // The prompt build instructions say "Build a working prototype ready for npm publishing".
          
          // Usually, for a tool like this, the dashboard is exported as static HTML and served by Hono.
          // OR we spawn `next start`?
          // Hono can serve static files.
          // Given the complexity of "next start" inside a CLI package, it's better to build the dashboard to `out/` and serve it.
          // However, the prompt instruction for `dashboard.ts` just starts the Hono server and opens localhost:5555.
          // AND `packages/dashboard/package.json` says "dev": "next dev --port 5555".
          // Wait, if Hono runs on 5555, Next.js cannot run on 5555.
          
          // Let's re-read carefully.
          // "Launch a local web dashboard with a Hono-powered API backend."
          // "Hono API Server ... port 5555".
          // "Dashboard ... next dev --port 5555". -> Conflict!
          
          // I will assume:
          // API on 5555.
          // Dashboard on 3000 (or random).
          // OR: API on 5555, Dashboard talks to it.
          
          // The prompt says: "Configure API endpoint to call localhost:5555".
          // So the Dashboard needs to be served.
          // For the prototype "npx prisma-flow" command:
          // It should probably start BOTH?
          // Or maybe the Hono server SERVES the Next.js static export?
          
          // Since the prompt shows `dashboardCommand` implementation ONLY starting Hono server:
          // ```typescript
          // startServer(app, port)
          // await open(`http://localhost:${port}`)
          // ```
          // This implies Hono IS the web server.
          // Meaning, Hono should serve the static assets of the dashboard.
          
          // I will add static file serving to `server/index.ts` later or assumes the user runs the dashboard separately?
          // "The MVP is ready when: ... User runs `npx prisma-flow` and Hono server starts ... Dashboard opens automatically showing data"
          
          // If I strictly follow the code in prompt, it only starts API.
          // If I open `localhost:5555` and it's just JSON API, that's not a dashboard.
          
          // I will assume I need to serve the static files from the Dashboard build.
          // But I'll stick to the prompt's `dashboard.ts` logic first.
          // And maybe `server/index.ts` needs to be updated to serve static files.
          // BUT the prompt `server/index.ts` does NOT show static file serving.
          
          // Perhaps the prompt implies I should run the dashboard separately during dev?
          // "Step 6: ... Connect Next.js dashboard to API ... Test end-to-end"
          
          // I will implement `dashboard.ts` as requested.
          // And I will assume for the MVP verification I might need to run the dashboard manually or I will ADD static serving to Hono (which is the robust way).
          
          // I'll add a comment about this.
          // For now, I'll stick to the prompt.
          await open(`http://localhost:${port}`)
        }
        
        console.log(chalk.gray('Press Ctrl+C to stop\n'))
        
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`))
        process.exit(1)
      }
    })
}
