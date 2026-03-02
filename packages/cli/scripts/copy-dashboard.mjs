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

import { cpSync, existsSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = resolve(__dirname, '..', '..', '..')

const src  = resolve(root, 'packages', 'dashboard', 'out')
const dest = resolve(root, 'packages', 'cli', 'public')

if (!existsSync(src)) {
  console.warn(
    '\n⚠  Dashboard static export not found at packages/dashboard/out/\n' +
    '   Run: npm run build:dashboard  (or: cd packages/dashboard && npm run build)\n' +
    '   Continuing CLI build without embedded dashboard assets.\n',
  )
  process.exit(0)
}

// Clean and recreate destination
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true })
}
mkdirSync(dest, { recursive: true })

// Copy dashboard build output
cpSync(src, dest, { recursive: true })

console.log(`✓ Dashboard assets copied → packages/cli/public/`)
