# PrismaFlow Architecture

PrismaFlow V1 is a local-first DevTool. The CLI runs in the user's Prisma project, starts a local API server, and serves the dashboard with an ephemeral session token.

## Runtime Flow

```text
Prisma project
  -> prisma-flow CLI
  -> project detection
  -> Prisma CLI commands and local engine analysis
  -> Hono API server on localhost
  -> Next.js dashboard served from CLI assets
```

## Current Packages

- `packages/cli`: Commander commands, Hono API server, and current V1 engines.
- `packages/dashboard`: Next.js dashboard for timeline, drift, risk, simulation, schema, health, and readiness.
- `packages/shared`: TypeScript contracts, Zod schemas, and shared errors.
- `packages/website`: public documentation website.

## Target Refactor

V1 should prioritize working functionality before structural expansion. Once behavior is stable, move toward:

```text
apps/
  dashboard/
  website/
packages/
  cli/
  core/
  drift-engine/
  risk-engine/
  schema-engine/
  ui/
```

Do not add cloud, AI, billing, enterprise, collaboration, or multi-tenant packages during V1.

## Core Boundaries

- Project detection finds Prisma schema, migration folder, datasource provider, Prisma version, and environment state.
- Drift engine compares Prisma schema and live datasource through Prisma tooling.
- Risk engine analyzes migration SQL and returns explanations plus recommendations.
- Simulation engine previews migration statements without mutating production data.
- Schema engine parses Prisma DMMF into dashboard-friendly model, field, enum, and relation data.
- Dashboard renders API data only; it should not duplicate migration or risk logic.

## Security Model

- Local dashboard binds to localhost by default.
- API routes require a per-process bearer token.
- Database credentials stay in the user's environment or local `.env` files.
- Child processes must use explicit argument arrays.
- Logs and outputs must avoid leaking `DATABASE_URL`, auth tokens, or credentials.
