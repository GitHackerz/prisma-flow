# PrismaFlow

**Visual Prisma Migration Management** — Safe, observable, production-ready migration tooling for Prisma-based Node.js projects.

[![CI](https://github.com/your-org/prisma-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/prisma-flow/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/prisma-flow)](https://www.npmjs.com/package/prisma-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node ≥ 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## Overview

PrismaFlow gives you:

- **Visual migration timeline** — applied / pending / failed states at a glance
- **Real-time schema drift detection** — knows when someone changed the database manually
- **Risk analysis** — flags destructive operations (`DROP TABLE`, `DROP COLUMN`, etc.) per migration
- **Per-session auth token** — the embedded API server is accessible only by the browser tab that opens it
- **CI/CD integration** — `prisma-flow check --ci` with structured exit codes
- **Webhook notifications** — Slack, Discord, or any HTTP endpoint on drift or failures

## Requirements

| Tool | Version |
|:-----|:--------|
| Node.js | ≥ 20 |
| Prisma CLI | ≥ 5.0 |
| npm | ≥ 10 |

## Quick Start

```bash
# No global install needed
cd your-prisma-project
npx prisma-flow               # opens http://localhost:5555 in your browser
```

The dashboard reads your `prisma/schema.prisma`, runs `prisma migrate status` and
`prisma migrate diff` against your `DATABASE_URL`, then streams live updates.

## Installation

### npx (zero config)
```bash
npx prisma-flow
```

### Global install
```bash
npm install -g prisma-flow
prisma-flow
```

### Project dev dependency
```bash
npm install --save-dev prisma-flow
```
```jsonc
// package.json
{
  "scripts": {
    "migrations":       "prisma-flow",
    "migrations:check": "prisma-flow check --ci"
  }
}
```

### Docker
```bash
# Build the image locally
docker build -t prisma-flow:local .

# Run it (mounts current project read-only)
docker run --rm \
  -p 5555:5555 \
  -e DATABASE_URL="$DATABASE_URL" \
  -v "$(pwd):/project:ro" \
  prisma-flow:local

# Or use docker compose (includes Postgres)
docker compose up -d
```

## Commands

```bash
# Open the visual dashboard (default)
prisma-flow

# Print project status in the terminal
prisma-flow status
prisma-flow status --json        # machine-readable

# Run a full environment health check
prisma-flow doctor

# Initialise a prismaflow.config.ts in your project
prisma-flow init

# CI/CD check — exits non-zero on problems
prisma-flow check --ci
prisma-flow check --ci --json    # structured output for parsers
```

### Exit codes

| Code | Meaning |
|:-----|:--------|
| 0 | All good |
| 1 | Pending migrations exist |
| 2 | Schema drift detected |
| 3 | Pending **and** drift |
| 4 | Unexpected runtime error |

## Configuration

`prisma-flow init` generates a `prismaflow.config.ts` at your project root:

```ts
import type { PrismaFlowConfig } from 'prisma-flow'

export default {
  port:        5555,
  logLevel:    'info',
  openBrowser: true,
  features: {
    driftDetection:    true,
    riskAnalysis:      true,
    auditLog:          true,
    webhooks:          false,
    advancedAnalytics: false,   // Pro
    teamCollaboration: false,   // Pro
  },
} satisfies PrismaFlowConfig
```

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `DATABASE_URL` | — | **Required.** Prisma datasource URL |
| `PRISMAFLOW_PORT` | `5555` | Port for the dashboard server |
| `PRISMAFLOW_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `PRISMAFLOW_OPEN_BROWSER` | `true` | Auto-open browser on start |
| `PRISMAFLOW_TELEMETRY` | `on` | Set to `off` to opt out of anonymous usage stats |
| `PRISMAFLOW_LICENCE_KEY` | — | Unlocks Pro/Enterprise features |
| `PRISMAFLOW_WEBHOOK_SLACK_URL` | — | Slack incoming-webhook URL |
| `PRISMAFLOW_WEBHOOK_DISCORD_URL` | — | Discord webhook URL |

See [`.env.example`](./.env.example) for the full list.

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| CLI | Commander.js + Node.js 20 (ESM) |
| API server | Hono v4 + `@hono/node-server` |
| Dashboard | Next.js 16 + React 19 + Tailwind v4 (static export) |
| Data fetching | SWR v2 |
| Logging | pino v9 with pino-pretty |
| Schemas / types | Zod v3 (shared package) |
| Build | tsup (CLI) + Next.js export (dashboard) |
| Monorepo | Turborepo + npm workspaces |
| Tests | Vitest v2 |

## Development

```bash
# Clone and install
git clone https://github.com/your-org/prisma-flow.git
cd prisma-flow
npm install

# Build everything (shared → dashboard → CLI)
npm run build

# Run tests
npm test

# Type-check all packages
npm run typecheck

# Start dashboard dev server
npm run dev --workspace=packages/dashboard

# Watch-build CLI
npm run dev --workspace=packages/cli
```

### Project structure

```
prisma-flow/
├── packages/
│   ├── shared/          # Zod schemas · domain types · error classes
│   ├── cli/             # Commander CLI + Hono API server
│   │   └── src/
│   │       ├── commands/   # init · doctor · status · check · dashboard
│   │       ├── core/       # drift-detector · migration-analyzer · ...
│   │       └── server/     # Hono app + routes
│   └── dashboard/       # Next.js 16 static dashboard
├── turbo.json
├── tsconfig.base.json
├── Dockerfile
└── docker-compose.yml
```

## Roadmap

### v0.1.0 — Current
- [x] Auto-detection of Prisma projects (single & multi-file schemas)
- [x] Visual migration timeline
- [x] Schema drift detection
- [x] Per-migration risk analysis
- [x] CI/CD check command with structured exit codes
- [x] Per-session auth token
- [x] Webhook notifications (Slack / Discord / HTTP)
- [x] Structured audit log
- [x] `doctor` and `init` commands
- [x] Docker support

### v0.2.0 — Planned
- [ ] Cloud-hosted dashboard (Pro)
- [ ] Team collaboration with real-time updates (Pro)
- [ ] Git branch integration
- [ ] Advanced rollback helpers

### v1.0.0 — Enterprise
- [ ] SSO + RBAC
- [ ] Self-hosted enterprise build
- [ ] Custom integrations / API

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)

