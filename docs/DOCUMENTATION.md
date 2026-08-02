# PrismaFlow Documentation

PrismaFlow V1 is a local-first open-source CLI and dashboard for Prisma migration visibility, schema understanding, drift detection, risk analysis, health scoring, and deployment readiness.

For the public website version of these docs, see `packages/website/app/docs/page.tsx`.

## Quick Start

```bash
cd /path/to/prisma-project
npx prisma-flow
```

The default command detects `schema.prisma`, starts the local API server, and opens the dashboard with an ephemeral session token.

## Commands

```bash
prisma-flow              # open the dashboard
prisma-flow status       # print health and deployment readiness
prisma-flow check --ci   # fail CI on pending, drift, or failed migrations
prisma-flow plan         # produce a deploy decision with next commands
prisma-flow report       # generate JSON or Markdown reports
prisma-flow simulate     # preview SQL and destructive operations
prisma-flow inspect      # inspect one migration
prisma-flow diff         # compare Prisma schema and live database
prisma-flow rollback     # generate rollback plan or rollback SQL
prisma-flow repair       # generate or apply drift repair suggestions
prisma-flow compare      # compare migration state across environments
prisma-flow history      # show migration history with risk and git metadata
prisma-flow doctor       # validate local setup
prisma-flow init         # create prismaflow.config.ts
```

## Dashboard Views

- Overview: detected project, database state, health score, deployment plan, and readiness checks.
- Migrations: applied, pending, and failed migrations with creation/applied dates and risk context.
- Drift: changed object, location, SQL evidence, reason it matters, and suggested action.
- Risks: low, medium, high, and critical migration risk analysis.
- Simulate: generated SQL, affected objects, destructive warnings, locks, and downtime estimate.
- Schema: models, fields, relations, enums, indexes, constraints, and ERD-style overview.

## Reports and CI

Generate local artifacts:

```bash
prisma-flow report --format json --output prismaflow-report.json
prisma-flow report --format markdown --output prismaflow-report.md
prisma-flow plan --format markdown --output prismaflow-plan.md
```

Use `check --ci` in any pipeline:

```bash
npx prisma-flow check --ci --json
npx prisma-flow plan --ci --json
```

Exit codes:

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| `0`  | Ready                                         |
| `1`  | Pending migrations                            |
| `2`  | Schema drift detected                         |
| `3`  | Failed migrations                             |
| `4`  | Runtime or configuration error                |
| `5`  | Risk threshold exceeded with `--fail-on-risk` |

## API Endpoints

The local dashboard API requires the generated session token.

| Endpoint                    | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `GET /api/status`           | Project health, drift, risk, and readiness summary |
| `GET /api/plan`             | Deployment decision, blockers, actions, and commands |
| `GET /api/migrations`       | Paginated migration timeline                       |
| `GET /api/migrations/:name` | Migration SQL and risk details                     |
| `GET /api/drift`            | Cached drift detection result                      |
| `POST /api/drift/check`     | Fresh drift check                                  |
| `GET /api/risks`            | Migration risk scores                              |
| `GET /api/risks/:migration` | Risk details for one migration                     |
| `GET /api/simulate/:name`   | Migration simulation result                        |
| `GET /api/rollback/:name`   | Rollback plan for one migration                    |
| `GET /api/repair`           | Drift repair suggestions                           |
| `POST /api/repair/apply`    | Apply safe repair suggestions                      |
| `GET /api/diff`             | Schema/database diff                               |
| `GET /api/compare`          | Environment comparison                             |
| `GET /api/git`              | Git-aware migration metadata                       |
| `GET /api/audit`            | Local PrismaFlow audit log entries                 |
| `GET /api/config`           | Safe config view                                   |
| `GET /api/events`           | Server-sent events stream                          |
| `GET /api/schema`           | Parsed schema explorer data                        |

## V1 Boundaries

V1 intentionally excludes AI, cloud sync, billing, team workspaces, enterprise controls, audit logs, notifications, approval workflows, and analytics. Core local features are free with no artificial limits.
