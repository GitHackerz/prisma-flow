import Link from "next/link"
import {
  ArrowRight,
  Shield,
  Activity,
  GitBranch,
  Terminal,
  Globe,
  Zap,
  Eye,
  AlertTriangle,
  BarChart3,
  Webhook,
  Lock,
  Check,
  ChevronRight,
  Clock,
  Download,
  Layers,
  Database,
  Search,
  Server,
  FileCode,
} from "lucide-react"
import { Navbar } from "./components/Navbar"
import { Footer } from "./components/Footer"
import { CodeBlock } from "./components/CodeBlock"
import { FeatureCard } from "./components/FeatureCard"
import { Section, SectionHeader } from "./components/Section"

/* ─────────────────────────────────────────────────── Hero ── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background grid + glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[400px] rounded-full bg-emerald-500/[0.05] blur-[100px]" />
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
          <span className="gradient-text">Migration Management</span>
        </h1>

        <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
          Detect schema drift, analyse migration risks, and ship database
          changes safely — <strong className="text-foreground">CLI + web dashboard</strong> for
          every Prisma project.
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
              <div className="mt-3 text-white/60">🔍 Detecting Prisma project...</div>
              <div className="mt-1.5">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> Prisma project detected</span>
              </div>
              <div className="text-white/40 pl-4">Schema: &nbsp;&nbsp;&nbsp;prisma/schema.prisma</div>
              <div className="text-white/40 pl-4">Migrations: 12 found</div>
              <div className="mt-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> Database connected</span>
              </div>
              <div className="mt-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-white/80"> PrismaFlow dashboard running</span>
              </div>
              <div className="mt-1.5 text-violet-400">
                → http://localhost:5555?token=a3f8c2...
              </div>
              <div className="mt-3 text-white/40">Auth token printed above — keep it private.</div>
              <div className="text-white/40">Press Ctrl+C to stop</div>
              <div className="mt-2 inline-block h-4 w-2 animate-pulse-slow bg-white/60" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────── Features Grid ── */
function FeaturesGrid() {
  const features = [
    {
      icon: Eye,
      title: "Schema Drift Detection",
      description:
        "Continuously compare your Prisma schema to the live database. Detect manual ALTER TABLE changes, orphaned indexes, and constraint mismatches in real time.",
      iconColor: "text-primary" as const,
    },
    {
      icon: AlertTriangle,
      title: "Risk Analysis",
      description:
        "Every migration is scanned for destructive operations — DROP TABLE, DROP COLUMN, TRUNCATE, bulk DELETE. Color-coded risk badges protect you from dangerous deploys.",
      iconColor: "text-amber-400" as const,
    },
    {
      icon: Activity,
      title: "Live Dashboard",
      description:
        "A browser-based UI that auto-updates every few seconds. See connection status, pending/applied/failed migrations, and drift alerts at a glance.",
      iconColor: "text-emerald-400" as const,
    },
    {
      icon: Terminal,
      title: "Powerful CLI",
      description:
        "Five sub-commands — dashboard, status, check, init, doctor — give you full control from the terminal. JSON output for scripting, structured exit codes for CI.",
      iconColor: "text-sky-400" as const,
    },
    {
      icon: GitBranch,
      title: "CI/CD Ready",
      description:
        "Run prisma-flow check --ci in GitHub Actions, GitLab CI, or Jenkins. Structured exit codes (0–4) and JSON output integrate with any pipeline.",
      iconColor: "text-primary" as const,
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description:
        "Per-session 192-bit auth tokens, local-only CORS policy, execFile() for child processes (no shell injection), and no external network calls.",
      iconColor: "text-emerald-400" as const,
    },
    {
      icon: Webhook,
      title: "Webhook Notifications",
      description:
        "Get Slack, Discord, or generic HTTP notifications when drift is detected or a migration fails. Configure per-event or for all events.",
      iconColor: "text-amber-400" as const,
    },
    {
      icon: BarChart3,
      title: "Migration Timeline",
      description:
        "A horizontal visual timeline showing the chronological history of all migrations — applied, pending, and failed — with hover-to-inspect details.",
      iconColor: "text-sky-400" as const,
    },
    {
      icon: Server,
      title: "Docker Ready",
      description:
        "Multi-stage Dockerfile and docker-compose.yml included. Mount your project, set DATABASE_URL, and run locally or in any containerized environment.",
      iconColor: "text-primary" as const,
    },
  ]

  return (
    <Section id="features">
      <SectionHeader
        badge="Features"
        title="Everything you need to manage Prisma migrations"
        description="From drift detection to risk analysis, PrismaFlow gives your team full visibility into database changes — before they hit production."
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
      number: "01",
      icon: Search,
      title: "Detect",
      description: "PrismaFlow scans your project — finds the schema, discovers migrations, checks DATABASE_URL. Zero configuration needed.",
    },
    {
      number: "02",
      icon: Activity,
      title: "Analyse",
      description: "Runs prisma migrate status and prisma migrate diff under the hood. Parses SQL output to classify every difference and assign risk levels.",
    },
    {
      number: "03",
      icon: Layers,
      title: "Visualise",
      description: "Results are served via a local Hono API server and displayed in a Next.js dashboard with auto-refreshing status cards, timelines, and alerts.",
    },
    {
      number: "04",
      icon: Shield,
      title: "Protect",
      description: "Integrate with CI/CD using the check command. Block deploys when drift or failed migrations are detected. Alert your team via webhooks.",
    },
  ]

  return (
    <Section id="how-it-works" className="bg-card/30">
      <SectionHeader
        badge="How It Works"
        title="Four steps to safe migrations"
        description="PrismaFlow wraps the Prisma CLI — no Prisma dependency changes, no database modifications."
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
            <CodeBlock code={`npm install -g prisma-flow\nprisma-flow`} filename="terminal" />
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
          <span className="font-medium text-foreground">Requirements:</span>{" "}
          Node.js 20+, Prisma 5+, DATABASE_URL set in .env
        </p>
      </div>
    </Section>
  )
}

/* ───────────────────────────────── CLI Reference ── */
function CLISection() {
  const commands = [
    {
      name: "prisma-flow",
      aka: "dashboard",
      description: "Launch the visual dashboard in your browser",
      flags: ["-p, --port <port>", "--no-open"],
    },
    {
      name: "prisma-flow status",
      aka: null,
      description: "Print migration & drift state to the terminal",
      flags: ["--json"],
    },
    {
      name: "prisma-flow check",
      aka: null,
      description: "Validate state for CI/CD — structured exit codes (0-4)",
      flags: ["--ci", "--json"],
    },
    {
      name: "prisma-flow init",
      aka: null,
      description: "Create prismaflow.config.ts with documented defaults",
      flags: ["-f, --force"],
    },
    {
      name: "prisma-flow doctor",
      aka: null,
      description: "Run environment checks (Node, Prisma, DB, schema, migrations)",
      flags: [],
    },
  ]

  return (
    <Section id="cli" className="bg-card/30">
      <SectionHeader
        badge="CLI"
        title="Five commands, full control"
        description="Everything you need from the terminal — interactive dashboard, quick status checks, CI/CD validation, and environment diagnostics."
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
                {cmd.aka && (
                  <span className="text-xs text-muted-foreground">(default)</span>
                )}
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
          DATABASE_URL: \${{ secrets.DATABASE_URL }}`}
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
        title="Programmatic access to everything"
        description="The dashboard is powered by a clean REST API. Use it from scripts, custom dashboards, or monitoring tools."
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Endpoints</h3>
          <div className="space-y-3">
            {[
              { method: "GET",  path: "/api/status",            desc: "Project & database health" },
              { method: "GET",  path: "/api/migrations",        desc: "Paginated migration list with risks" },
              { method: "GET",  path: "/api/migrations/:name",  desc: "Single migration SQL + analysis" },
              { method: "GET",  path: "/api/drift",             desc: "Current drift state (cached 10s)" },
              { method: "POST", path: "/api/drift/check",       desc: "Force-refresh drift analysis" },
              { method: "GET",  path: "/api/schema",            desc: "Parsed models & enums" },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3"
              >
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                    ep.method === "GET"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
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

/* ──────────────────────────────────── Pricing ── */
function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Everything you need for solo projects and small teams.",
      features: [
        "Visual migration timeline",
        "Real-time drift detection",
        "Risk analysis for every migration",
        "CI/CD check command",
        "doctor & init commands",
        "Local REST API",
        "Docker support",
      ],
      cta: "Get Started",
      ctaHref: "#installation",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "Advanced features for teams shipping to production daily.",
      features: [
        "Everything in Free",
        "Webhook notifications (Slack, Discord, HTTP)",
        "JSONL audit log",
        "CI annotations",
        "Priority support",
        "Extended analytics",
      ],
      cta: "Coming Soon",
      ctaHref: "#",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For organizations with strict compliance and scale requirements.",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Advanced analytics dashboard",
        "SSO / SAML support",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantees",
      ],
      cta: "Contact Us",
      ctaHref: "mailto:hello@prismaflow.dev",
      highlighted: false,
    },
  ]

  return (
    <Section id="pricing">
      <SectionHeader
        badge="Pricing"
        title="Start free, scale when ready"
        description="The core features are free and open source. Upgrade for team-oriented features like webhooks, audit logs, and collaboration."
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border p-8 ${
              tier.highlighted
                ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/10"
                : "border-border/50 bg-card/50"
            }`}
          >
            {tier.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{tier.price}</span>
              {tier.period && (
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>

            <ul className="mt-8 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={tier.ctaHref}
              className={`mt-8 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                tier.highlighted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ──────────────────────────────────── Stats ── */
function Stats() {
  const stats = [
    { label: "CLI Commands",    value: "5" },
    { label: "API Endpoints",   value: "6" },
    { label: "Risk Detectors",  value: "7" },
    { label: "Drift Types",     value: "6" },
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
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-primary/[0.08] blur-[100px]" />
        </div>
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
        <FeaturesGrid />
        <HowItWorks />
        <Installation />
        <CLISection />
        <APIPreview />
        <Pricing />
        <BottomCTA />
      </main>
      <Footer />
    </>
  )
}
