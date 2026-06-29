import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Database,
  Download,
  Eye,
  FileCode,
  GitBranch,
  Layers,
  Search,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { CodeBlock } from './components/CodeBlock'
import { FeatureCard } from './components/FeatureCard'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { Section, SectionHeader } from './components/Section'

/* ─────────────────────────────────────────────────── Hero ── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-border/70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          <Zap className="h-3.5 w-3.5" />
          Open Source &middot; MIT Licensed
          <ChevronRight className="h-3.5 w-3.5" />
        </div>

        {/* Heading */}
        <h1 className="animate-fade-in-up-delay-1 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Visual Prisma
          <br />
          <span className="gradient-text">Migration Safety</span>
        </h1>

        <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
          See migration state, schema drift, risk, and deployment readiness before you ship - a{' '}
          <strong className="text-foreground">CLI + web dashboard</strong> for every Prisma project.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#installation"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Read the Docs
          </Link>
        </div>

        {/* Quick install */}
        <div className="mx-auto mt-12 max-w-md">
          <CodeBlock code="npx prisma-flow" filename="terminal" />
        </div>

        {/* Terminal preview */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-[hsl(224,71%,4%)] shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2 font-mono text-xs text-white/30">prisma-flow</span>
            </div>
            <div className="p-6 font-mono text-sm leading-7">
              <div className="text-white/40">$ npx prisma-flow</div>
              <div className="mt-3 text-white/60">Detecting Prisma project...</div>
              <div className="mt-1.5">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> Prisma project detected</span>
              </div>
              <div className="text-white/40 pl-4">
                Schema: &nbsp;&nbsp;&nbsp;prisma/schema.prisma
              </div>
              <div className="text-white/40 pl-4">Migrations: 12 found</div>
              <div className="mt-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> Database connected</span>
              </div>
              <div className="mt-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> PrismaFlow dashboard running</span>
              </div>
              <div className="mt-1.5 text-violet-400">→ http://localhost:5555?token=a3f8c2...</div>
              <div className="mt-3 text-white/40">Auth token printed above - keep it private.</div>
              <div className="text-white/40">Press Ctrl+C to stop</div>
              <div className="mt-2 inline-block h-4 w-2 animate-pulse-slow bg-white/60" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────── Workflow Snapshot ── */
function WorkflowSnapshot() {
  const items = [
    {
      icon: Database,
      title: 'Project detection',
      description:
        'Finds schema, migrations, provider, Prisma version, package manager, and DATABASE_URL state.',
    },
    {
      icon: Activity,
      title: 'Live readiness',
      description:
        'Combines connection, pending migrations, failed migrations, drift, and critical risks into one score.',
    },
    {
      icon: Shield,
      title: 'Risk evidence',
      description:
        'Highlights destructive SQL and explains what needs review before a deploy proceeds.',
    },
    {
      icon: GitBranch,
      title: 'CI artifacts',
      description:
        'Produces deterministic exit codes and JSON or Markdown reports for pull requests.',
    },
  ]

  return (
    <Section>
      <SectionHeader
        badge="V1 Workflow"
        title="What you see in the first minute"
        description="PrismaFlow is built for fast operational clarity: detect the project, assess readiness, inspect the evidence, and export the result."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border/50 bg-card/50 p-5">
            <item.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─────────────────────────────────────── Product Preview ── */
function ProductPreview() {
  return (
    <Section className="pt-0">
      <SectionHeader
        badge="Dashboard"
        title="A real control surface for migration review"
        description="The dashboard turns raw Prisma state into scan-friendly project metadata, readiness checks, and deploy actions."
      />
      <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-2xl shadow-primary/5">
        <img
          src="/dashboard-preview.png"
          alt="PrismaFlow dashboard showing project status, readiness, and migration risk"
          className="block h-auto w-full"
        />
      </div>
    </Section>
  )
}

/* ──────────────────────────────────────────── Features Grid ── */
function FeaturesGrid() {
  const features = [
    {
      icon: Eye,
      title: 'Schema Drift Detection',
      description:
        'Compare your Prisma schema to the live database. Detect manual ALTER TABLE changes, orphaned indexes, and constraint mismatches before deploy.',
      iconColor: 'text-primary' as const,
    },
    {
      icon: AlertTriangle,
      title: 'Risk Analysis',
      description:
        'Every migration is scanned for destructive operations — DROP TABLE, DROP COLUMN, TRUNCATE, bulk DELETE. Color-coded risk badges protect you from dangerous deploys.',
      iconColor: 'text-amber-400' as const,
    },
    {
      icon: Activity,
      title: 'Live Dashboard',
      description:
        'A browser-based UI that auto-updates every few seconds. See connection status, pending/applied/failed migrations, and drift alerts at a glance.',
      iconColor: 'text-emerald-400' as const,
    },
    {
      icon: Terminal,
      title: 'Powerful CLI',
      description:
        'Dashboard, status, check, report, doctor, inspect, simulate, and history commands give you control from the terminal. JSON output supports scripts and CI.',
      iconColor: 'text-sky-400' as const,
    },
    {
      icon: GitBranch,
      title: 'CI/CD Ready',
      description:
        'Run prisma-flow check --ci in GitHub Actions, GitLab CI, or Jenkins. Structured exit codes (0-5) and JSON output integrate with any pipeline.',
      iconColor: 'text-primary' as const,
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description:
        'Per-session 192-bit auth tokens, localhost-only CORS policy, execFile() child processes, and no cloud calls unless telemetry is explicitly enabled.',
      iconColor: 'text-emerald-400' as const,
    },
    {
      icon: Layers,
      title: 'Schema Explorer',
      description:
        'Browse Prisma models, fields, relations, enums, indexes, and constraints with an ERD-style overview built from your schema.',
      iconColor: 'text-amber-400' as const,
    },
    {
      icon: BarChart3,
      title: 'Migration Timeline',
      description:
        'A visual timeline showing applied, pending, and failed migrations with timestamps, duration, and risk context.',
      iconColor: 'text-sky-400' as const,
    },
    {
      icon: Zap,
      title: 'Deployment Readiness',
      description:
        'A health score and readiness checklist summarize drift, failed migrations, pending work, and critical risks before deploy.',
      iconColor: 'text-primary' as const,
    },
  ]

  return (
    <Section id="features">
      <SectionHeader
        badge="Features"
        title="Everything V1 needs for Prisma migration confidence"
        description="From drift detection to schema exploration, PrismaFlow gives developers clear visibility into database changes before they hit production."
      />
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </Section>
  )
}

/* ──────────────────────────────────────── How It Works ── */
function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Detect',
      description:
        'PrismaFlow scans your project — finds the schema, discovers migrations, checks DATABASE_URL. Zero configuration needed.',
    },
    {
      number: '02',
      icon: Activity,
      title: 'Analyse',
      description:
        'Runs prisma migrate status and prisma migrate diff under the hood. Parses SQL output to classify every difference and assign risk levels.',
    },
    {
      number: '03',
      icon: Layers,
      title: 'Visualise',
      description:
        'Results are served via a local Hono API server and displayed in a Next.js dashboard with auto-refreshing status cards, timelines, and alerts.',
    },
    {
      number: '04',
      icon: Shield,
      title: 'Protect',
      description:
        'Integrate with CI/CD using the check command. Block deploys when drift, failed migrations, or critical risks are detected.',
    },
  ]

  return (
    <Section id="how-it-works" className="bg-card/30">
      <SectionHeader
        badge="How It Works"
        title="Four steps to safe migrations"
        description="PrismaFlow wraps the Prisma CLI. Dashboard, status, check, and report flows are read-only by default."
      />
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="relative text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="mb-2 font-mono text-xs text-primary/60">{step.number}</div>
            <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Architecture diagram */}
      <div className="mx-auto mt-20 max-w-3xl">
        <CodeBlock
          filename="architecture"
          language="text"
          showLineNumbers={false}
          code={`Your Project Directory
        │
        ▼
┌────────────────────────────────────────┐
│          prisma-flow CLI               │
│                                        │
│  1. Reads  prisma/schema.prisma        │
│  2. Runs   prisma migrate status       │ ◄── Prisma CLI
│  3. Runs   prisma migrate diff         │
│  4. Classifies drift & assigns risk    │
│  5. Starts Hono HTTP server            │
│     • Per-session auth token           │
│     • Serves static dashboard          │
│     • Exposes /api/* REST endpoints    │
└──────────────────┬─────────────────────┘
                   │  http://localhost:5555
                   ▼
┌────────────────────────────────────────┐
│      Web Dashboard (Next.js)           │
│                                        │
│  • Polls /api/status   every  5 s      │
│  • Polls /api/migrations every 10 s    │
│  • Polls /api/drift    every 15 s      │
│  • Renders live migration state        │
│  • Shows drift alerts w/ re-check btn  │
└────────────────────────────────────────┘`}
        />
      </div>
    </Section>
  )
}

/* ─────────────────────────────────── Installation ── */
function Installation() {
  return (
    <Section id="installation">
      <SectionHeader
        badge="Get Started"
        title="Up and running in 30 seconds"
        description="No configuration files. No Prisma dependency changes. Just run the command from your project root."
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
        {/* Option A */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
          <div className="mb-4 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Recommended
          </div>
          <h3 className="text-lg font-semibold text-foreground">Zero Install</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Download and run in one command. Nothing persisted globally.
          </p>
          <div className="mt-4">
            <CodeBlock code="npx prisma-flow" filename="terminal" />
          </div>
        </div>

        {/* Option B */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
          <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Daily Use
          </div>
          <h3 className="text-lg font-semibold text-foreground">Global Install</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Install once, use from any Prisma project on your machine.
          </p>
          <div className="mt-4">
            <CodeBlock code={'npm install -g prisma-flow\nprisma-flow'} filename="terminal" />
          </div>
        </div>

        {/* Option C */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
          <div className="mb-4 inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            Teams
          </div>
          <h3 className="text-lg font-semibold text-foreground">Dev Dependency</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pin the version for your team. Add scripts to package.json.
          </p>
          <div className="mt-4">
            <CodeBlock code="npm install --save-dev prisma-flow" filename="terminal" />
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mx-auto mt-12 max-w-xl text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Requirements:</span> Node.js 20+, Prisma 5+,
          DATABASE_URL set in .env
        </p>
      </div>
    </Section>
  )
}

/* ───────────────────────────────── CLI Reference ── */
function CLISection() {
  const commands = [
    {
      name: 'prisma-flow',
      aka: 'dashboard',
      description: 'Launch the visual dashboard in your browser',
      flags: ['-p, --port <port>', '--no-open'],
    },
    {
      name: 'prisma-flow status',
      aka: null,
      description: 'Print migration & drift state to the terminal',
      flags: ['--json', '--quiet'],
    },
    {
      name: 'prisma-flow check',
      aka: null,
      description: 'Validate state for CI/CD with structured exit codes (0-5)',
      flags: ['--ci', '--json', '--fail-on-risk <level>'],
    },
    {
      name: 'prisma-flow report',
      aka: null,
      description: 'Generate a local JSON or Markdown report for reviews and CI artifacts',
      flags: ['--format <format>', '-o, --output <path>'],
    },
    {
      name: 'prisma-flow init',
      aka: null,
      description: 'Create prismaflow.config.ts with documented defaults',
      flags: ['-f, --force'],
    },
    {
      name: 'prisma-flow doctor',
      aka: null,
      description: 'Run environment checks (Node, Prisma, DB, schema, migrations)',
      flags: ['--json'],
    },
    {
      name: 'prisma-flow inspect',
      aka: null,
      description: 'Inspect one migration with SQL, risk analysis, and simulation summary',
      flags: ['--json', '--sql', '--rollback'],
    },
    {
      name: 'prisma-flow simulate',
      aka: null,
      description: 'Preview migration statements and destructive warnings before execution',
      flags: ['--json', '--fail-on-destructive'],
    },
    {
      name: 'prisma-flow history',
      aka: null,
      description: 'Show a terminal migration timeline with status and risk context',
      flags: ['--limit <n>', '--json', '--git'],
    },
    {
      name: 'prisma-flow diff',
      aka: null,
      description: 'Compare the Prisma schema with a database URL',
      flags: ['--from <url>', '--json', '--breaking-only'],
    },
    {
      name: 'prisma-flow compare',
      aka: null,
      description: 'Compare configured environments for migration divergence',
      flags: ['--envs <names>', '--json'],
    },
    {
      name: 'prisma-flow repair',
      aka: null,
      description: 'List drift repair suggestions and optionally apply safe steps',
      flags: ['--apply', '--json'],
    },
    {
      name: 'prisma-flow rollback',
      aka: null,
      description: 'Generate rollback SQL for a migration',
      flags: ['--json', '--print-sql', '--include-manual'],
    },
  ]

  return (
    <Section id="cli" className="bg-card/30">
      <SectionHeader
        badge="CLI"
        title="Complete local CLI surface"
        description="The website now covers the full shipped command set: core dashboard and CI commands, analysis tools, and advanced local utilities."
      />

      <div className="mx-auto mt-16 max-w-4xl space-y-4">
        {commands.map((cmd) => (
          <div
            key={cmd.name}
            className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-sm text-primary">
                  {cmd.name}
                </code>
                {cmd.aka && <span className="text-xs text-muted-foreground">(default)</span>}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{cmd.description}</p>
            </div>
            {cmd.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cmd.flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md border border-border/50 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CI/CD example */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
          CI/CD Integration — GitHub Actions
        </h3>
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
      - name: Generate report
        run: npx prisma-flow report --format markdown --output prismaflow-report.md`}
        />
      </div>
    </Section>
  )
}

/* ───────────────────────────────── API Preview ── */
function APIPreview() {
  return (
    <Section id="api">
      <SectionHeader
        badge="REST API"
        title="Programmatic access to local migration state"
        description="The dashboard is powered by a token-protected local REST API. Use it from scripts, custom dashboards, or local monitors."
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Endpoints
          </h3>
          <div className="space-y-3">
            {[
              {
                method: 'GET',
                path: '/api/status',
                desc: 'Project & database health',
              },
              {
                method: 'GET',
                path: '/api/migrations',
                desc: 'Paginated migration list with risks',
              },
              {
                method: 'GET',
                path: '/api/migrations/:name',
                desc: 'Single migration SQL + analysis',
              },
              {
                method: 'GET',
                path: '/api/drift',
                desc: 'Current drift state (cached 10s)',
              },
              {
                method: 'POST',
                path: '/api/drift/check',
                desc: 'Force-refresh drift analysis',
              },
              {
                method: 'GET',
                path: '/api/risks',
                desc: 'Risk score for all migrations',
              },
              {
                method: 'GET',
                path: '/api/simulate/:name',
                desc: 'Migration simulation result',
              },
              {
                method: 'GET',
                path: '/api/schema',
                desc: 'Parsed models & enums',
              },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3"
              >
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                    ep.method === 'GET'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {ep.method}
                </span>
                <code className="flex-1 font-mono text-sm text-foreground">{ep.path}</code>
                <span className="hidden text-xs text-muted-foreground sm:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <CodeBlock
          filename="GET /api/status — Response"
          language="json"
          showLineNumbers
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
    "healthScore": 100,
    "deploymentReadiness": {
      "status": "ready",
      "score": 100
    },
    "provider": "postgresql",
    "lastSync": "2026-02-28T12:00:00Z"
  }
}`}
        />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/docs#api-reference"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View full API reference
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Section>
  )
}

/* ──────────────────────────────────── Open Source ── */
function OpenSource() {
  const features = [
    'Unlimited local Prisma projects',
    'Visual migration timeline',
    'Drift detection with explanations',
    'Risk analysis and recommendations',
    'Migration simulation',
    'Schema explorer and ERD-style overview',
    'Health score and deployment readiness',
    'Reports and CI integration',
  ]

  return (
    <Section id="open-source">
      <SectionHeader
        badge="Open Source"
        title="V1 is free, local-first, and unlimited"
        description="No account, no cloud dependency, no artificial usage limits. PrismaFlow V1 focuses only on Prisma migration visibility and deployment confidence."
      />

      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border/50 bg-card/50 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Open Source V1</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything needed to understand and safely ship Prisma database changes.
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">$0</span>
            <span className="text-sm text-muted-foreground">forever</span>
          </div>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href="#installation"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </Link>
      </div>
    </Section>
  )
}

/* ──────────────────────────────────── Stats ── */
function Stats() {
  const stats = [
    { label: 'CLI Commands', value: '13' },
    { label: 'API Endpoints', value: '18+' },
    { label: 'Risk Detectors', value: '7' },
    { label: 'Drift Types', value: '6' },
  ]

  return (
    <Section className="bg-card/30">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl font-bold text-foreground">{s.value}</div>
            <div className="mt-1.5 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ──────────────────────────────── Bottom CTA ── */
function BottomCTA() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/[0.03] px-8 py-16 text-center sm:px-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/30" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to ship migrations safely?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Get started in under a minute. No sign-up required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#installation"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Install PrismaFlow
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <FileCode className="h-4 w-4" />
              Read Documentation
            </Link>
          </div>
          <div className="mt-6">
            <CodeBlock code="npx prisma-flow" filename="terminal" />
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ──────────────────────────────── Page ── */
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <WorkflowSnapshot />
        <ProductPreview />
        <FeaturesGrid />
        <HowItWorks />
        <Installation />
        <CLISection />
        <APIPreview />
        <OpenSource />
        <BottomCTA />
      </main>
      <Footer />
    </>
  )
}
