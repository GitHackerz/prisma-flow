/**
 * copy-dashboard.mjs
 *
 * Copies the Next.js static export (packages/dashboard/out/) into
 * packages/cli/public/ so that the Hono server can serve the dashboard.
 *
 * Runs automatically before the CLI build via the "build" npm script.
 * If the dashboard hasn't been built yet this script is a no-op — a warning
 * is printed so developers know they need to run `npm run build:dashboard` first.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..', '..', '..')

const src = resolve(root, 'packages', 'dashboard', 'out')
const dest = resolve(root, 'packages', 'cli', 'public')

if (!existsSync(src)) {
  process.exit(0)
}

// Clean and recreate destination
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true })
}
mkdirSync(dest, { recursive: true })

// Copy dashboard build output
cpSync(src, dest, { recursive: true })
