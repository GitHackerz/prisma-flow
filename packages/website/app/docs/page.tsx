'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CheckCircle2,
  Database,
  FileCode,
  Gauge,
  GitBranch,
  HelpCircle,
  Layers,
  Network,
  Shield,
  Terminal,
} from 'lucide-react'
import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  children?: { id: string; label: string }[]
}

const sidebarNav: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Layers,
    children: [
      { id: 'mission', label: 'Mission' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'scope', label: 'V1 scope' },
    ],
  },
  {
    id: 'installation',
    label: 'Installation',
    icon: Terminal,
  },
  {
    id: 'cli-reference',
    label: 'CLI Reference',
    icon: FileCode,
    children: [
      { id: 'command-matrix', label: 'Command matrix' },
      { id: 'core-workflow', label: 'Core workflow' },
      { id: 'analysis-safety', label: 'Analysis and safety' },
      { id: 'advanced-utilities', label: 'Advanced utilities' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Gauge,
  },
  {
    id: 'reports-ci',
    label: 'Reports and CI',
    icon: BarChart3,
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    icon: Network,
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Database,
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    icon: HelpCircle,
  },
]

const commandRows = [
  ['prisma-flow', 'Open the local dashboard. Alias for `dashboard`.', ''],
  [
    'dashboard',
    'Start the Hono API and bundled Next.js dashboard.',
    '-p, --port <port>; --no-open',
  ],
  ['status', 'Print project health, drift, risk, and readiness.', '--json; --quiet'],
  [
    'check',
    'CI-friendly safety gate for pending, failed, drifted, or risky migrations.',
    '--ci; --json; --fail-on-risk <level>; --quiet',
  ],
  [
    'report',
    'Generate JSON or Markdown reports for reviews and CI artifacts.',
    '--format <format>; --json; -o, --output <path>',
  ],
  ['doctor', 'Validate local Node, Prisma, schema, migrations, and database setup.', '--json'],
  [
    'inspect <migration>',
    'Inspect one migration, SQL, risks, and rollback plan.',
    '--json; --sql; --rollback',
  ],
  [
    'simulate <migration>',
    'Preview SQL statements and destructive warnings.',
    '--json; --fail-on-destructive',
  ],
  ['history', 'Show the migration timeline in the terminal.', '--limit <n>; --json; --git'],
  [
    'diff',
    'Compare Prisma schema against a database URL.',
    '--from <url>; --json; --breaking-only',
  ],
  ['compare', 'Compare named environments from config.', '--envs <names>; --json'],
  ['repair', 'Suggest drift repairs and optionally apply safe repair steps.', '--apply; --json'],
  [
    'rollback <migration>',
    'Generate rollback SQL for a migration.',
    '--json; --print-sql; --include-manual',
  ],
  ['init', 'Create `prismaflow.config.ts` with documented defaults.', '-f, --force'],
]

const apiRows = [
  ['GET /health', 'Unauthenticated process health for local monitors.'],
  ['GET /api/status', 'Project health, drift, risk, readiness, and detected metadata.'],
  ['GET /api/migrations?page=1&limit=20', 'Paginated migration timeline.'],
  ['GET /api/migrations/:name', 'Single migration SQL, risk score, and details.'],
  ['GET /api/drift', 'Cached drift result, refreshed every 10 seconds.'],
  ['POST /api/drift/check', 'Force a fresh drift check.'],
  ['GET /api/risks', 'Risk score for every migration.'],
  ['GET /api/risks/:migration', 'Risk score for one migration.'],
  ['GET /api/simulate/:migration', 'Static or shadow simulation result.'],
  ['GET /api/schema', 'Parsed models, fields, relations, enums, indexes, and constraints.'],
  ['GET /api/diff?breaking=true', 'Schema/database diff used by advanced tooling.'],
  ['GET /api/rollback/:migration?format=sql', 'Rollback plan or SQL download.'],
  ['GET /api/repair', 'Drift repair suggestions.'],
  ['POST /api/repair/apply', 'Apply automated repair steps. Review before use.'],
  ['GET /api/compare', 'Environment comparison when at least two environments are configured.'],
  ['GET /api/git', 'Migration git metadata, conflicts, and uncommitted migration files.'],
  ['GET /api/audit?limit=100', 'Local audit log entries from `.prismaflow/audit.jsonl`.'],
  ['GET /api/config', 'Resolved non-sensitive configuration.'],
  ['GET /api/events', 'Local server-sent events stream.'],
]

const configRows = [
  ['port', '`5555`', 'Dashboard/API port. Override with `PRISMAFLOW_PORT`.'],
  [
    'logLevel',
    '`info`',
    '`trace`, `debug`, `info`, `warn`, or `error`. Override with `PRISMAFLOW_LOG_LEVEL`.',
  ],
  ['openBrowser', '`true`', 'Set `PRISMAFLOW_NO_OPEN=1` to disable auto-open.'],
  ['features.riskAnalysis', '`true`', 'Enable migration risk scoring.'],
  ['features.simulation', '`true`', 'Enable migration simulation.'],
  ['features.ciAnnotations', '`true`', 'Keep CI output structured for annotations.'],
  ['environments', '`[]`', 'Named database URLs for `compare`; not shown in the V1 dashboard.'],
  [
    'riskThreshold',
    '`medium`',
    'Default warning threshold. Override with `PRISMAFLOW_RISK_THRESHOLD`.',
  ],
]

function Sidebar({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="space-y-1">
      {sidebarNav.map((item) => {
        const isParentActive =
          active === item.id || item.children?.some((child) => active === child.id)

        return (
          <div key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault()
                onSelect(item.id)
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isParentActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                    onClick={(event) => {
                      event.preventDefault()
                      onSelect(child.id)
                      document.getElementById(child.id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                      active === child.id
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
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

function DocsContent() {
  return (
    <div className="prose-docs space-y-20">
      <section id="overview">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
        <p id="mission" className="mt-4 text-muted-foreground leading-relaxed">
          PrismaFlow is a local-first CLI and dashboard for understanding Prisma migration history,
          schema health, drift, risk, and deployment readiness in seconds.
        </p>

        <h3 id="architecture" className="mt-10 text-xl font-semibold text-foreground">
          Architecture
        </h3>
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
                <td className="py-3 pr-4">CLI</td>
                <td className="py-3 pr-4">Node.js 20, Commander</td>
                <td className="py-3">Project detection, commands, local server startup</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">Core engines</td>
                <td className="py-3 pr-4">TypeScript, Prisma CLI</td>
                <td className="py-3">
                  Migration timeline, drift detection, risk scoring, simulation
                </td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-3 pr-4">API</td>
                <td className="py-3 pr-4">Hono</td>
                <td className="py-3">Authenticated local REST and SSE API</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Dashboard</td>
                <td className="py-3 pr-4">Next.js</td>
                <td className="py-3">
                  Visual migration, drift, risk, simulation, and schema views
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 id="scope" className="mt-10 text-xl font-semibold text-foreground">
          V1 Scope
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            [
              'Included',
              'Local dashboard, CLI checks, reports, risk analysis, simulation, schema explorer, and token-protected local API.',
            ],
            [
              'Not included yet',
              'Hosted cloud sync, accounts, team RBAC, paid limits, and a first-class multi-environment dashboard.',
            ],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border bg-card p-4">
              <h4 className="font-medium text-foreground">{title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="installation">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Installation</h2>
        <p className="mt-4 text-muted-foreground">
          Run PrismaFlow from the root of a project that contains `prisma/schema.prisma`.
          Requirements: Node.js 20+, Prisma 5+, and `DATABASE_URL` for live database checks.
        </p>
        <CodeBlock
          filename="terminal"
          language="bash"
          code={`cd /path/to/prisma-project
npx prisma-flow

# Optional installs
npm install --save-dev prisma-flow
npm install -g prisma-flow`}
        />
      </section>

      <section id="cli-reference">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">CLI Reference</h2>
        <p className="mt-4 text-muted-foreground">
          The default command opens the dashboard. Use focused commands for CI, terminal workflows,
          generated artifacts, and advanced local maintenance.
        </p>

        <h3 id="command-matrix" className="mt-10 text-xl font-semibold text-foreground">
          Command Matrix
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Command</th>
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Use</th>
                <th className="py-3 text-left font-semibold text-foreground">Options</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {commandRows.map(([command, use, options]) => (
                <tr key={command} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono text-xs text-foreground">{command}</td>
                  <td className="py-3 pr-4">{use}</td>
                  <td className="py-3 font-mono text-xs">{options || 'none'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 id="core-workflow" className="mt-10 text-xl font-semibold text-foreground">
          Core Workflow
        </h3>
        <CodeBlock
          filename="terminal"
          language="bash"
          code={`prisma-flow dashboard --port 5555
prisma-flow status --json
prisma-flow check --ci --fail-on-risk high
prisma-flow report --format markdown --output prismaflow-report.md
prisma-flow doctor --json`}
        />

        <h3 id="analysis-safety" className="mt-10 text-xl font-semibold text-foreground">
          Analysis and Safety
        </h3>
        <CodeBlock
          filename="terminal"
          language="bash"
          code={`prisma-flow inspect 20260228120000_add_billing --sql --rollback
prisma-flow simulate 20260228120000_add_billing --fail-on-destructive
prisma-flow history --limit 25 --git`}
        />

        <h3 id="advanced-utilities" className="mt-10 text-xl font-semibold text-foreground">
          Advanced Local Utilities
        </h3>
        <p className="mt-3 text-muted-foreground">
          These commands are available for local automation and maintenance. Review output before
          applying repairs or using generated rollback SQL.
        </p>
        <CodeBlock
          filename="terminal"
          language="bash"
          code={`prisma-flow diff --from "$DATABASE_URL" --breaking-only
prisma-flow compare --envs dev,staging,prod --json
prisma-flow repair --json
prisma-flow repair --apply
prisma-flow rollback 20260228120000_add_billing --print-sql`}
        />
      </section>

      <section id="dashboard">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="mt-4 text-muted-foreground">
          The V1 dashboard focuses on the main migration safety workflow: Overview, Migrations,
          Drift, Risks, Simulate, and Schema.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            [
              'Overview',
              'Detected project, health score, readiness checks, and suggested next actions.',
            ],
            [
              'Migrations',
              'Timeline with applied, pending, failed, created, applied, duration, and risk fields.',
            ],
            ['Drift', 'What changed, where, why it matters, SQL evidence, and suggested action.'],
            ['Risks', 'Low, medium, high, and critical migration risk analysis.'],
            [
              'Simulate',
              'Generated SQL, destructive statements, affected objects, locks, and mode.',
            ],
            [
              'Schema',
              'Models, fields, relations, enums, indexes, constraints, and ERD-style overview.',
            ],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {title}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="reports-ci">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports and CI</h2>
        <p className="mt-4 text-muted-foreground">
          V1 reports and CI checks are free, local, and suitable for GitHub Actions or any shell
          pipeline.
        </p>
        <CodeBlock
          filename=".github/workflows/prismaflow.yml"
          language="yaml"
          code={`name: PrismaFlow

on: [pull_request]

jobs:
  prismaflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma-flow check --ci --json
      - run: npx prisma-flow report --format markdown --output prismaflow-report.md`}
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Exit code</th>
                <th className="py-3 text-left font-semibold text-foreground">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['0', 'Ready'],
                ['1', 'Pending migrations'],
                ['2', 'Schema drift detected'],
                ['3', 'Failed migrations'],
                ['4', 'Runtime or configuration error'],
                ['5', 'Risk threshold exceeded with --fail-on-risk'],
              ].map(([code, meaning]) => (
                <tr key={code} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono">{code}</td>
                  <td className="py-3">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="api-reference">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">API Reference</h2>
        <p className="mt-4 text-muted-foreground">
          The dashboard uses a local authenticated API. The token is generated per server process
          and passed as `?token=...` or `Authorization: Bearer ...`.
        </p>
        <CodeBlock
          filename="GET /api/status"
          language="json"
          code={`{
  "success": true,
  "data": {
    "connected": true,
    "migrationsApplied": 10,
    "migrationsPending": 0,
    "migrationsFailed": 0,
    "driftDetected": false,
    "driftCount": 0,
    "riskLevel": "low",
    "healthScore": 100,
    "deploymentReadiness": {
      "status": "ready",
      "score": 100,
      "summary": "Ready for deployment",
      "checks": []
    },
    "provider": "postgresql",
    "schemaPath": "prisma/schema.prisma",
    "packageManager": "npm",
    "hasDatabaseUrl": true
  }
}`}
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Endpoint</th>
                <th className="py-3 text-left font-semibold text-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {apiRows.map(([endpoint, purpose]) => (
                <tr key={endpoint} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono text-xs">{endpoint}</td>
                  <td className="py-3">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="configuration">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configuration</h2>
        <p className="mt-4 text-muted-foreground">
          PrismaFlow works with zero configuration. Use `prisma-flow init` only when you want local
          defaults checked into your project.
        </p>
        <CodeBlock
          filename="prismaflow.config.ts"
          language="typescript"
          code={`import type { PrismaFlowConfig } from 'prisma-flow'

export default {
  port: 5555,
  logLevel: 'info',
  openBrowser: true,
  features: {
    riskAnalysis: true,
    simulation: true,
    ciAnnotations: true,
  },
  environments: [],
  riskThreshold: 'medium',
} satisfies PrismaFlowConfig`}
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Setting</th>
                <th className="py-3 pr-4 text-left font-semibold text-foreground">Default</th>
                <th className="py-3 text-left font-semibold text-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {configRows.map(([setting, defaultValue, notes]) => (
                <tr key={setting} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono text-xs text-foreground">{setting}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{defaultValue}</td>
                  <td className="py-3">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="security">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Security</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li>PrismaFlow runs locally and does not require an account or cloud service.</li>
          <li>The dashboard API requires a per-session token with 192 bits of entropy.</li>
          <li>CORS accepts localhost and same-origin browser requests only.</li>
          <li>Child processes use argument arrays instead of shell-built commands.</li>
          <li>Database URLs, schema files, SQL, and project paths stay local by default.</li>
          <li>Usage telemetry is disabled unless `PRISMAFLOW_TELEMETRY=on` is set.</li>
        </ul>
      </section>

      <section id="troubleshooting">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Troubleshooting</h2>
        <div className="mt-6 space-y-6">
          {[
            [
              'No Prisma project found',
              'Run PrismaFlow from the directory containing prisma/schema.prisma or a package that owns that schema.',
            ],
            [
              'Prisma CLI unavailable',
              'Install Prisma in the project or run npm install before drift, status, check, simulate, or report commands.',
            ],
            [
              'Database unreachable',
              'Check DATABASE_URL, local database availability, credentials, and network access before running drift or readiness checks.',
            ],
            [
              'Dashboard token rejected',
              'Open the URL printed by the current prisma-flow process. Tokens are regenerated every time the server starts.',
            ],
            [
              'Dashboard port in use',
              'Start the dashboard with a different port: prisma-flow dashboard --port 7777.',
            ],
            [
              'Slow drift checks',
              'Drift detection calls Prisma migrate diff. Large schemas and remote databases can take longer.',
            ],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold text-foreground">{question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function DocsPage() {
  const [active, setActive] = useState('overview')

  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
              <GitBranch className="h-3.5 w-3.5" />
              Local-first V1
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Documentation</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Install PrismaFlow, inspect migration safety, generate reports, automate checks, and
              understand every local CLI and API surface.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <Sidebar active={active} onSelect={setActive} />
              </div>
            </aside>

            <article className="min-w-0">
              <DocsContent />
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
