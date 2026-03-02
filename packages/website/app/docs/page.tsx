"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  BookOpen,
  Terminal,
  Globe,
  Settings,
  Server,
  Webhook,
  Shield,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Database,
  Layers,
  FileCode,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { CodeBlock } from "../components/CodeBlock"

/* ─── Sidebar nav data ─── */
interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  children?: { id: string; label: string }[]
}

const sidebarNav: NavItem[] = [
  {
    id: "how-it-works",
    label: "How It Works",
    icon: Layers,
    children: [
      { id: "architecture", label: "Architecture" },
      { id: "data-flow", label: "Data Flow" },
    ],
  },
  {
    id: "requirements",
    label: "Requirements",
    icon: Settings,
  },
  {
    id: "installation",
    label: "Installation",
    icon: Terminal,
    children: [
      { id: "zero-install", label: "Zero Install (npx)" },
      { id: "global-install", label: "Global Install" },
      { id: "dev-dependency", label: "Dev Dependency" },
    ],
  },
  {
    id: "cli-reference",
    label: "CLI Reference",
    icon: Terminal,
    children: [
      { id: "cmd-dashboard", label: "dashboard" },
      { id: "cmd-status", label: "status" },
      { id: "cmd-check", label: "check" },
      { id: "cmd-init", label: "init" },
      { id: "cmd-doctor", label: "doctor" },
    ],
  },
  {
    id: "web-dashboard",
    label: "Web Dashboard",
    icon: Globe,
    children: [
      { id: "accessing-dashboard", label: "Accessing" },
      { id: "status-cards", label: "Status Cards" },
      { id: "migration-timeline", label: "Timeline" },
      { id: "migration-list", label: "Migration List" },
      { id: "drift-alert", label: "Drift Alert" },
      { id: "health-check", label: "Health Check" },
    ],
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: Settings,
  },
  {
    id: "environment-variables",
    label: "Environment Variables",
    icon: FileCode,
  },
  {
    id: "api-reference",
    label: "API Reference",
    icon: Server,
    children: [
      { id: "api-auth", label: "Authentication" },
      { id: "api-status", label: "GET /api/status" },
      { id: "api-migrations", label: "GET /api/migrations" },
      { id: "api-migration-detail", label: "GET /api/migrations/:name" },
      { id: "api-drift", label: "GET /api/drift" },
      { id: "api-drift-check", label: "POST /api/drift/check" },
      { id: "api-schema", label: "GET /api/schema" },
    ],
  },
  {
    id: "cicd-integration",
    label: "CI/CD Integration",
    icon: BarChart3,
    children: [
      { id: "github-actions", label: "GitHub Actions" },
      { id: "gitlab-ci", label: "GitLab CI" },
      { id: "jenkins", label: "Jenkins" },
    ],
  },
  {
    id: "docker",
    label: "Docker",
    icon: Server,
  },
  {
    id: "webhooks",
    label: "Webhooks",
    icon: Webhook,
  },
  {
    id: "feature-tiers",
    label: "Feature Tiers",
    icon: BarChart3,
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: HelpCircle,
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
  },
]

/* ─── Sidebar component ─── */
function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <nav className="space-y-1">
      {sidebarNav.map((item) => {
        const isParentActive = active === item.id || item.children?.some((c) => active === c.id)
        return (
          <div key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                onSelect(item.id)
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isParentActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </a>
            {item.children && isParentActive && (
              <div className="ml-6 mt-1 space-y-0.5 border-l border-border/50 pl-3">
                {item.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onSelect(child.id)
                      document.getElementById(child.id)?.scrollIntoView({ behavior: "smooth" })
                    }}
                    className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                      active === child.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ─── Docs content ─── */
function DocsContent() {
  return (
    <div className="prose-docs space-y-20">
      {/* How it Works */}
      <section id="how-it-works">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">How It Works</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          PrismaFlow has two layers that work together: a <strong className="text-foreground">CLI</strong> that wraps the Prisma CLI to analyse your migration
          state, and a <strong className="text-foreground">web dashboard</strong> that visualises the results in real time.
        </p>

        <h3 id="architecture" className="mt-10 text-xl font-semibold text-foreground">Architecture</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Layer</th>
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Technology</th>
                <th className="py-3 text-left font-semibold text-foreground">Role</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">CLI binary</td>
                <td className="py-3 pr-4">Node.js 20 + Commander.js</td>
                <td className="py-3">Entry point, project detection, sub-commands</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">Core modules</td>
                <td className="py-3 pr-4">TypeScript (ESM)</td>
                <td className="py-3">Drift detection, migration analysis, schema parsing</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">API server</td>
                <td className="py-3 pr-4">Hono v4 + @hono/node-server</td>
                <td className="py-3">REST endpoints, auth, CORS, static serving</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">Dashboard UI</td>
                <td className="py-3 pr-4">Next.js 16 (static export)</td>
                <td className="py-3">Visual interface served from CLI dist</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Shared types</td>
                <td className="py-3 pr-4">Zod v3 (@prisma-flow/shared)</td>
                <td className="py-3">Schema validation, domain types, error classes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 id="data-flow" className="mt-10 text-xl font-semibold text-foreground">Data Flow</h3>
        <div className="mt-4">
          <CodeBlock
            filename="data-flow.txt"
            language="text"
            code={`1. CLI starts
   └─ detectPrismaProject(cwd)
       ├─ Looks for prisma/schema.prisma
       ├─ Checks prisma/schema/ directory (multi-file, Prisma v5.15+)
       └─ Reads DATABASE_URL from .env / prisma/.env

2. Server starts
   ├─ Generates random 48-char hex session token
   ├─ Prints token + URL to terminal
   └─ Opens browser: http://localhost:5555?token=<token>

3. Dashboard opens
   └─ Extracts token from ?token= URL param
       └─ Attaches as Authorization: Bearer <token> on every request

4. API requests
   ├─ GET /api/status      → prisma migrate status + diff
   ├─ GET /api/migrations  → reads migrations/ dir + status
   ├─ GET /api/drift       → prisma migrate diff (cached 10s)
   ├─ POST /api/drift/check → fresh drift check (bypasses cache)
   └─ GET /api/schema      → @prisma/internals getDMMF`}
          />
        </div>
      </section>

      {/* Requirements */}
      <section id="requirements">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Requirements</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Dependency</th>
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Minimum</th>
                <th className="py-3 text-left font-semibold text-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4 font-medium text-foreground">Node.js</td>
                <td className="py-3 pr-4">20.x</td>
                <td className="py-3">Use nvm or fnm to manage versions</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4 font-medium text-foreground">npm</td>
                <td className="py-3 pr-4">10.x</td>
                <td className="py-3">Ships with Node 20</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4 font-medium text-foreground">Prisma CLI</td>
                <td className="py-3 pr-4">5.0</td>
                <td className="py-3">Must be available via npx prisma</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-foreground">DATABASE_URL</td>
                <td className="py-3 pr-4">—</td>
                <td className="py-3">Set in .env or prisma/.env</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> PrismaFlow does not install itself as a Prisma dependency. It wraps the Prisma CLI via <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npx prisma ...</code> so it follows whatever version your project uses.
        </div>
      </section>

      {/* Installation */}
      <section id="installation">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Installation</h2>

        <h3 id="zero-install" className="mt-10 text-xl font-semibold text-foreground">Option A — Zero Install (recommended)</h3>
        <p className="mt-3 text-muted-foreground">Download and run in one command. Nothing persisted globally.</p>
        <div className="mt-4">
          <CodeBlock filename="terminal" code={`cd /path/to/your-prisma-project\nnpx prisma-flow`} />
        </div>

        <h3 id="global-install" className="mt-10 text-xl font-semibold text-foreground">Option B — Global Install</h3>
        <p className="mt-3 text-muted-foreground">Install once, use from any Prisma project.</p>
        <div className="mt-4">
          <CodeBlock filename="terminal" code={`npm install -g prisma-flow\n\n# Then from any project:\ncd /path/to/your-project\nprisma-flow`} />
        </div>

        <h3 id="dev-dependency" className="mt-10 text-xl font-semibold text-foreground">Option C — Dev Dependency</h3>
        <p className="mt-3 text-muted-foreground">Pin the version for your team and add convenience scripts.</p>
        <div className="mt-4">
          <CodeBlock filename="terminal" code={`npm install --save-dev prisma-flow\n# or: yarn add --dev prisma-flow\n# or: pnpm add -D prisma-flow`} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Then add scripts to your package.json:</p>
        <div className="mt-3">
          <CodeBlock
            filename="package.json"
            language="json"
            code={`{
  "scripts": {
    "migrations":       "prisma-flow",
    "migrations:check": "prisma-flow check --ci",
    "migrations:status": "prisma-flow status"
  }
}`}
          />
        </div>
      </section>

      {/* CLI Reference */}
      <section id="cli-reference">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">CLI Reference</h2>
        <p className="mt-4 text-muted-foreground">All commands are run from inside your Prisma project root (the directory containing <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prisma/</code>).</p>

        <div className="mt-6">
          <CodeBlock filename="terminal" code={`Usage: prisma-flow [command] [options]\n\nCommands:\n  dashboard  Launch the visual dashboard (default)\n  status     Print migration & drift status\n  check      Validate state for CI/CD\n  init       Create prismaflow.config.ts\n  doctor     Validate environment & project setup`} />
        </div>

        {/* dashboard */}
        <h3 id="cmd-dashboard" className="mt-12 text-xl font-semibold text-foreground">
          <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-primary">dashboard</code>
          <span className="ml-2 text-sm font-normal text-muted-foreground">(default command)</span>
        </h3>
        <p className="mt-3 text-muted-foreground">Launches the HTTP server and opens the visual dashboard in your browser.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Option</th>
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Default</th>
                <th className="py-2 text-left font-semibold text-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30">
                <td className="py-2 pr-4 font-mono text-xs">-p, --port &lt;port&gt;</td>
                <td className="py-2 pr-4">5555</td>
                <td className="py-2">Port to bind the server to</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">--no-open</td>
                <td className="py-2 pr-4">—</td>
                <td className="py-2">Do not open the browser automatically</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <CodeBlock filename="examples" code={`# Default — opens http://localhost:5555\nnpx prisma-flow\n\n# Custom port\nnpx prisma-flow --port 7777\n\n# Headless (no browser)\nnpx prisma-flow --no-open`} />
        </div>

        {/* status */}
        <h3 id="cmd-status" className="mt-12 text-xl font-semibold text-foreground">
          <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-primary">status</code>
        </h3>
        <p className="mt-3 text-muted-foreground">Prints a human-readable or JSON summary of migration and drift state. Does not start a server.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Option</th>
                <th className="py-2 text-left font-semibold text-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">--json</td>
                <td className="py-2">Output raw JSON instead of colored text</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <CodeBlock
            filename="JSON output"
            language="json"
            code={`{
  "connected": true,
  "appliedCount": 10,
  "pendingCount": 2,
  "failedCount": 0,
  "hasDrift": false,
  "driftCount": 0,
  "riskLevel": "low",
  "lastSync": "2026-02-28T12:00:00.000Z"
}`}
          />
        </div>

        {/* check */}
        <h3 id="cmd-check" className="mt-12 text-xl font-semibold text-foreground">
          <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-primary">check</code>
        </h3>
        <p className="mt-3 text-muted-foreground">Validates migration state and exits with a structured exit code. Designed for CI/CD.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Exit Code</th>
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Meaning</th>
                <th className="py-2 text-left font-semibold text-foreground">When</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono">0</td><td className="py-2 pr-4">Healthy</td><td className="py-2">No pending, no drift, no failures</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono">1</td><td className="py-2 pr-4">Pending migrations</td><td className="py-2">Unapplied migrations exist</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono">2</td><td className="py-2 pr-4">Schema drift</td><td className="py-2">Database differs from migration history</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono">3</td><td className="py-2 pr-4">Failed migrations</td><td className="py-2">At least one migration failed</td></tr>
              <tr><td className="py-2 pr-4 font-mono">4</td><td className="py-2 pr-4">Runtime error</td><td className="py-2">Cannot connect, no project found, etc.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <CodeBlock filename="terminal" code={`# Fail pipeline on any issue\nnpx prisma-flow check --ci\n\n# Output JSON for scripting\nnpx prisma-flow check --ci --json`} />
        </div>

        {/* init */}
        <h3 id="cmd-init" className="mt-12 text-xl font-semibold text-foreground">
          <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-primary">init</code>
        </h3>
        <p className="mt-3 text-muted-foreground">Creates a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prismaflow.config.ts</code> with all available options documented inline.</p>
        <div className="mt-4">
          <CodeBlock filename="terminal" code={`prisma-flow init\n\n# Overwrite existing config:\nprisma-flow init --force`} />
        </div>

        {/* doctor */}
        <h3 id="cmd-doctor" className="mt-12 text-xl font-semibold text-foreground">
          <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-primary">doctor</code>
        </h3>
        <p className="mt-3 text-muted-foreground">Runs environment checks and reports results. Useful for first-time setup or debugging.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Check</th>
                <th className="py-2 text-left font-semibold text-foreground">What it verifies</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Node.js &ge; 20</td><td className="py-2">process.versions.node</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Prisma CLI available</td><td className="py-2">npx prisma --version resolves</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Schema found</td><td className="py-2">prisma/schema.prisma exists</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">DATABASE_URL set</td><td className="py-2">In .env, prisma/.env, or env</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Migrations dir exists</td><td className="py-2">prisma/migrations/ present</td></tr>
              <tr><td className="py-2 pr-4">Database reachable</td><td className="py-2">prisma migrate status succeeds</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Web Dashboard Guide */}
      <section id="web-dashboard">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Web Dashboard Guide</h2>

        <h3 id="accessing-dashboard" className="mt-10 text-xl font-semibold text-foreground">Accessing the Dashboard</h3>
        <ol className="mt-4 space-y-2 text-muted-foreground list-decimal list-inside">
          <li>Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prisma-flow</code> from your project root</li>
          <li>Your browser opens automatically at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">http://localhost:5555?token=&lt;token&gt;</code></li>
          <li>If the browser does not open (headless/remote), copy the URL from the terminal</li>
        </ol>
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          <strong className="text-amber-400">Important:</strong> The <code className="rounded bg-muted px-1.5 py-0.5 text-xs">?token=</code> query parameter is required. Without it, API requests return 401 and the dashboard shows a connection error.
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Remote / SSH access:</strong>
        </div>
        <div className="mt-2">
          <CodeBlock filename="terminal" code="ssh -L 5555:localhost:5555 user@your-server" />
        </div>

        <h3 id="status-cards" className="mt-10 text-xl font-semibold text-foreground">Status Cards</h3>
        <p className="mt-3 text-muted-foreground">Four cards at the top update every <strong className="text-foreground">5 seconds</strong>:</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Card</th>
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Green</th>
                <th className="py-2 text-left font-semibold text-foreground">Yellow/Red</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Database Status</td><td className="py-2 pr-4">Connected</td><td className="py-2">Cannot reach DB</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Pending Migrations</td><td className="py-2 pr-4">0 pending</td><td className="py-2">Unapplied migrations exist</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Failed Migrations</td><td className="py-2 pr-4">0 failed</td><td className="py-2">Manual recovery needed</td></tr>
              <tr><td className="py-2 pr-4">Risk Level</td><td className="py-2 pr-4">low</td><td className="py-2">medium = drift; high = failed</td></tr>
            </tbody>
          </table>
        </div>

        <h3 id="migration-timeline" className="mt-10 text-xl font-semibold text-foreground">Migration Timeline</h3>
        <p className="mt-3 text-muted-foreground">
          A horizontal visual timeline showing all migrations chronologically. <strong className="text-foreground">Filled dots</strong> = applied, <strong className="text-foreground">empty dots</strong> = pending, <strong className="text-red-400">red dots</strong> = failed. Updates every 10 seconds.
        </p>

        <h3 id="migration-list" className="mt-10 text-xl font-semibold text-foreground">Migration List</h3>
        <p className="mt-3 text-muted-foreground">A scrollable table (newest first) showing name, status badge, applied-at timestamp, and risk badges.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Risk Badge</th>
                <th className="py-2 text-left font-semibold text-foreground">SQL Pattern</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Drops table</td><td className="py-2">DROP TABLE</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Drops column</td><td className="py-2">DROP COLUMN</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Bulk deletion</td><td className="py-2">DELETE FROM</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Truncates</td><td className="py-2">TRUNCATE</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Alters structure</td><td className="py-2">ALTER TABLE</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">Removes index</td><td className="py-2">DROP INDEX</td></tr>
              <tr><td className="py-2 pr-4">Removes constraint</td><td className="py-2">DROP CONSTRAINT</td></tr>
            </tbody>
          </table>
        </div>

        <h3 id="drift-alert" className="mt-10 text-xl font-semibold text-foreground">Drift Alert</h3>
        <p className="mt-3 text-muted-foreground">
          An amber banner that appears only when schema drift is confirmed. Lists the SQL differences and provides a <strong className="text-foreground">Re-check</strong> button.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          <strong className="text-foreground">What causes drift?</strong> Direct ALTER TABLE by a DBA, seed scripts creating unknown tables, editing migrations after they were applied.
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <strong className="text-foreground">How to fix:</strong>
        </div>
        <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>Click Re-check to confirm it&apos;s not stale cache</li>
          <li>Review the listed SQL differences</li>
          <li>Create a migration: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prisma migrate dev --name fix_drift</code></li>
          <li>Or revert the manual DB change and re-apply via migration</li>
        </ol>

        <h3 id="health-check" className="mt-10 text-xl font-semibold text-foreground">Health Check Panel</h3>
        <p className="mt-3 text-muted-foreground">
          Live-updating panel showing connection status, applied/pending/failed counts, and drift count — equivalent to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prisma-flow status</code>.
        </p>
      </section>

      {/* Configuration */}
      <section id="configuration">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configuration</h2>
        <p className="mt-4 text-muted-foreground">
          Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">prisma-flow init</code> to create a config file. It is optional — PrismaFlow works without it.
        </p>
        <div className="mt-6">
          <CodeBlock
            filename="prismaflow.config.ts"
            language="typescript"
            showLineNumbers
            code={`import type { PrismaFlowConfig } from 'prisma-flow'

const config: PrismaFlowConfig = {
  port: 5555,
  logLevel: 'info',
  openBrowser: true,

  features: {
    riskAnalysis:  true,
    webhookAlerts: false,   // Pro
    auditLog:      false,   // Pro
    ciAnnotations: false,   // Pro
  },

  webhooks: [
    // { type: 'slack', url: process.env.SLACK_WEBHOOK_URL!, events: 'all' },
    // { type: 'discord', url: process.env.DISCORD_WEBHOOK_URL!, events: 'drift' },
    // { type: 'http', url: 'https://example.com/webhook', events: 'failure' },
  ],
}

export default config`}
          />
        </div>
      </section>

      {/* Environment Variables */}
      <section id="environment-variables">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Environment Variables</h2>
        <p className="mt-4 text-muted-foreground">All environment variables override config file values.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Variable</th>
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Default</th>
                <th className="py-2 text-left font-semibold text-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">DATABASE_URL</td><td className="py-2 pr-4">—</td><td className="py-2"><strong className="text-foreground">Required.</strong> Prisma connection string</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_PORT</td><td className="py-2 pr-4">5555</td><td className="py-2">Dashboard HTTP port</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_LOG_LEVEL</td><td className="py-2 pr-4">info</td><td className="py-2">trace/debug/info/warn/error</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_OPEN_BROWSER</td><td className="py-2 pr-4">true</td><td className="py-2">Set false for headless</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_TELEMETRY</td><td className="py-2 pr-4">on</td><td className="py-2">Set off to opt out</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_LICENCE_KEY</td><td className="py-2 pr-4">—</td><td className="py-2">Unlock Pro/Enterprise features</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_WEBHOOK_SLACK_URL</td><td className="py-2 pr-4">—</td><td className="py-2">Slack incoming webhook URL</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">PRISMAFLOW_WEBHOOK_DISCORD_URL</td><td className="py-2 pr-4">—</td><td className="py-2">Discord webhook URL</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* API Reference */}
      <section id="api-reference">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">API Reference</h2>
        <p className="mt-4 text-muted-foreground">
          The Hono server exposes a REST API at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">http://localhost:&lt;port&gt;/api/*</code>.
        </p>

        <h3 id="api-auth" className="mt-10 text-xl font-semibold text-foreground">Authentication</h3>
        <p className="mt-3 text-muted-foreground">Every <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/*</code> request requires a valid session token:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
          <li>Generated fresh each start (48 hex chars, 192-bit entropy)</li>
          <li>Sent as <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;token&gt;</code> header</li>
          <li>Or as <code className="rounded bg-muted px-1.5 py-0.5 text-xs">?token=&lt;token&gt;</code> query parameter</li>
        </ul>

        <h3 id="api-status" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">GET</span>
          /api/status
        </h3>
        <p className="mt-3 text-muted-foreground">Returns overall project and database health.</p>
        <div className="mt-4">
          <CodeBlock
            filename="response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "connected": true,
    "migrationsApplied": 10,
    "migrationsPending": 2,
    "migrationsFailed": 0,
    "driftDetected": false,
    "driftCount": 0,
    "riskLevel": "low",
    "lastSync": "2026-02-28T12:00:00.000Z"
  }
}`}
          />
        </div>

        <h3 id="api-migrations" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">GET</span>
          /api/migrations
        </h3>
        <p className="mt-3 text-muted-foreground">Paginated migration list. Params: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">page</code> (default 1), <code className="rounded bg-muted px-1.5 py-0.5 text-xs">limit</code> (default 20, max 100).</p>
        <div className="mt-4">
          <CodeBlock
            filename="response"
            language="json"
            code={`{
  "success": true,
  "data": [
    {
      "name": "20240101120000_init",
      "status": "applied",
      "appliedAt": "2024-01-01T12:00:00.000Z",
      "risks": []
    }
  ],
  "pagination": {
    "page": 1, "limit": 20, "total": 12, "pages": 1
  }
}`}
          />
        </div>

        <h3 id="api-migration-detail" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">GET</span>
          /api/migrations/:name
        </h3>
        <p className="mt-3 text-muted-foreground">Full SQL content and risk analysis for a single migration.</p>

        <h3 id="api-drift" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">GET</span>
          /api/drift
        </h3>
        <p className="mt-3 text-muted-foreground">Current drift state. Cached for 10 seconds to avoid repeated database hits.</p>
        <div className="mt-4">
          <CodeBlock
            filename="response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "hasDrift": true,
    "driftCount": 2,
    "differences": [
      {
        "sql": "ALTER TABLE \\"User\\" ADD COLUMN \\"legacy\\" TEXT",
        "type": "column-mismatch",
        "description": "Column or table structure mismatch"
      }
    ]
  }
}`}
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <p className="mb-3 text-sm font-semibold text-foreground">Drift item types:</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Type</th>
                <th className="py-2 text-left font-semibold text-foreground">Triggered by</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">table-missing</td><td className="py-2">CREATE TABLE in diff</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">table-extra</td><td className="py-2">DROP TABLE in diff</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">column-mismatch</td><td className="py-2">ALTER TABLE (no CONSTRAINT)</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">index-change</td><td className="py-2">CREATE/DROP/ALTER INDEX</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">constraint-change</td><td className="py-2">CONSTRAINT statement</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-xs">unknown</td><td className="py-2">Anything else</td></tr>
            </tbody>
          </table>
        </div>

        <h3 id="api-drift-check" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-400">POST</span>
          /api/drift/check
        </h3>
        <p className="mt-3 text-muted-foreground">Force-refresh drift analysis, bypassing the 10-second cache. Same response shape as GET /api/drift.</p>

        <h3 id="api-schema" className="mt-10 text-xl font-semibold text-foreground">
          <span className="mr-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">GET</span>
          /api/schema
        </h3>
        <p className="mt-3 text-muted-foreground">Parsed Prisma schema — all models and enums as structured data.</p>

        <h4 className="mt-8 text-lg font-semibold text-foreground">Error Responses</h4>
        <div className="mt-4">
          <CodeBlock
            filename="error shape"
            language="json"
            code={`{
  "success": false,
  "error": "Human-readable error message"
}`}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Status</th>
                <th className="py-2 text-left font-semibold text-foreground">When</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4">401</td><td className="py-2">Missing or invalid auth token</td></tr>
              <tr className="border-b border-border/30"><td className="py-2 pr-4">404</td><td className="py-2">Migration name not found</td></tr>
              <tr><td className="py-2 pr-4">500</td><td className="py-2">Unexpected server error</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CI/CD Integration */}
      <section id="cicd-integration">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">CI/CD Integration</h2>

        <h3 id="github-actions" className="mt-10 text-xl font-semibold text-foreground">GitHub Actions</h3>
        <div className="mt-4">
          <CodeBlock
            filename=".github/workflows/deploy.yml"
            language="yaml"
            showLineNumbers
            code={`name: Deploy
on:
  push:
    branches: [main]

jobs:
  migration-check:
    name: Check Migrations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - name: Check migration state
        run: npx prisma-flow check --ci
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}

  deploy:
    needs: migration-check
    # ... rest of your deployment`}
          />
        </div>

        <h3 id="gitlab-ci" className="mt-10 text-xl font-semibold text-foreground">GitLab CI</h3>
        <div className="mt-4">
          <CodeBlock
            filename=".gitlab-ci.yml"
            language="yaml"
            showLineNumbers
            code={`migration-check:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npx prisma-flow check --ci --json | tee result.json
  artifacts:
    paths:
      - result.json
    when: always
  variables:
    DATABASE_URL: $DATABASE_URL`}
          />
        </div>

        <h3 id="jenkins" className="mt-10 text-xl font-semibold text-foreground">Jenkins</h3>
        <div className="mt-4">
          <CodeBlock
            filename="Jenkinsfile"
            language="groovy"
            showLineNumbers
            code={`stage('Migration Check') {
  steps {
    sh 'npx prisma-flow check --ci'
  }
  post {
    failure {
      script {
        def result = readJSON file: 'migration-check.json'
        if (result.driftDetected) {
          slackSend message: "Schema drift in \${env.BRANCH_NAME}"
        }
      }
    }
  }
}`}
          />
        </div>
      </section>

      {/* Docker */}
      <section id="docker">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Docker</h2>

        <h3 className="mt-8 text-xl font-semibold text-foreground">Quick Start</h3>
        <div className="mt-4">
          <CodeBlock
            filename="terminal"
            code={`# Build the image
docker build -t prisma-flow:local .

# Run against current project (mounted read-only)
docker run --rm \\
  -p 5555:5555 \\
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \\
  -v "$(pwd):/project:ro" \\
  prisma-flow:local`}
          />
        </div>

        <h3 className="mt-10 text-xl font-semibold text-foreground">Docker Compose</h3>
        <p className="mt-3 text-muted-foreground">The included docker-compose.yml starts PrismaFlow plus a local Postgres instance:</p>
        <div className="mt-4">
          <CodeBlock
            filename="terminal"
            code={`docker compose up -d\ndocker compose logs -f prisma-flow  # get the auth token\ndocker compose down`}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Service</th>
                <th className="py-2 text-left font-semibold text-foreground">Port</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/30"><td className="py-2 pr-4">PrismaFlow dashboard</td><td className="py-2">5555</td></tr>
              <tr><td className="py-2 pr-4">Postgres</td><td className="py-2">5433 (avoids local pg conflicts)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Webhooks &amp; Notifications</h2>
        <p className="mt-4 text-muted-foreground">
          Send notifications to Slack, Discord, or any HTTP endpoint when drift is detected or a migration fails.
        </p>

        <h3 className="mt-8 text-xl font-semibold text-foreground">Via Environment Variables</h3>
        <div className="mt-4">
          <CodeBlock
            filename=".env"
            code={`PRISMAFLOW_WEBHOOK_SLACK_URL=https://hooks.slack.com/services/T.../B.../xxx
PRISMAFLOW_WEBHOOK_DISCORD_URL=https://discord.com/api/webhooks/...`}
          />
        </div>

        <h3 className="mt-8 text-xl font-semibold text-foreground">Payload Shape (HTTP)</h3>
        <div className="mt-4">
          <CodeBlock
            filename="webhook payload"
            language="json"
            code={`{
  "event": "drift",
  "project": "your-project",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "data": {
    "driftCount": 2,
    "differences": ["..."]
  }
}`}
          />
        </div>
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <strong className="text-primary">Pro feature:</strong> Webhooks require a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">PRISMAFLOW_LICENCE_KEY</code> to enable.
        </div>
      </section>

      {/* Feature Tiers */}
      <section id="feature-tiers">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Feature Tiers</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">Feature</th>
                <th className="py-2 pr-4 text-center font-semibold text-foreground">Free</th>
                <th className="py-2 pr-4 text-center font-semibold text-foreground">Pro</th>
                <th className="py-2 text-center font-semibold text-foreground">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["Visual migration timeline", true, true, true],
                ["Drift detection",           true, true, true],
                ["Risk analysis",             true, true, true],
                ["CI/CD check command",       true, true, true],
                ["doctor & init commands",    true, true, true],
                ["Webhook notifications",     false, true, true],
                ["Audit log (JSONL)",         false, true, true],
                ["CI annotations",            false, true, true],
                ["Advanced analytics",        false, false, true],
                ["Team collaboration",        false, false, true],
              ].map(([feature, free, pro, ent], i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-2 pr-4">{feature as string}</td>
                  <td className="py-2 pr-4 text-center">{free ? "✓" : "—"}</td>
                  <td className="py-2 pr-4 text-center">{pro ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{ent ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Troubleshooting</h2>

        {[
          {
            q: '"No Prisma project found"',
            a: 'PrismaFlow looks for prisma/schema.prisma in the current working directory. Make sure you cd into the right directory — in monorepos, cd into the package that owns the schema.',
          },
          {
            q: '"Database connection failed"',
            a: 'Test independently with npx prisma migrate status. Check that DATABASE_URL is set in .env. Run prisma-flow doctor for a full diagnostic.',
          },
          {
            q: '"Could not validate token" / 401 errors',
            a: 'The session token changes on every restart. Copy the full URL (including ?token=...) from the terminal output and paste it into your browser.',
          },
          {
            q: 'Port already in use',
            a: 'Kill the process on port 5555 (lsof -i :5555) or use a different port: prisma-flow --port 7777.',
          },
          {
            q: 'Dashboard shows "Loading..." indefinitely',
            a: 'The browser opened before the server finished starting, or the token is missing. Refresh using the URL from the terminal.',
          },
          {
            q: 'Drift false positives',
            a: 'PrismaFlow uses prisma migrate diff internally. If your schema uses extensions or RLS, run the diff manually to inspect raw output.',
          },
          {
            q: 'High memory / slow response',
            a: 'Each API call spawns a short-lived npx prisma subprocess. The drift endpoint caches results for 10 seconds.',
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="mt-8">
            <h3 className="text-lg font-semibold text-foreground">{q}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </div>
        ))}
      </section>

      {/* Security */}
      <section id="security">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Security</h2>
        <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            Session token: 192-bit entropy (crypto.randomBytes(24)), ephemeral per process
          </li>
          <li className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            CORS restricted to localhost and 127.0.0.1 origins only
          </li>
          <li className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            All child processes use execFile() with explicit arg arrays (no shell injection)
          </li>
          <li className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            No external network requests from the server (telemetry is opt-in, fire-and-forget)
          </li>
          <li className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            Dashboard served from local filesystem only
          </li>
        </ul>
      </section>
    </div>
  )
}

/* ─── Main docs page ─── */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("how-it-works")

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-border/50 py-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">Documentation</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">Documentation</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Everything you need to install, configure, and use PrismaFlow.
            </p>
          </div>

          {/* Content grid */}
          <div className="relative mt-8 flex gap-10 pb-24">
            {/* Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24">
                <Sidebar active={activeSection} onSelect={setActiveSection} />
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1">
              <DocsContent />
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
