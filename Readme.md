# PrismaFlow

**Visual Prisma Operations** - an open-source CLI and dashboard for Prisma migration visibility, schema health, drift detection, migration risk, and deployment readiness.

PrismaFlow turns Prisma migration state into a safety workflow: what changed, what is risky, whether the database drifted, and whether the project is ready to deploy.

## V1 Scope

PrismaFlow V1 is local-first and open source. It does not require an account, cloud sync, billing, AI, team workspace, or hosted service.

Included in V1:

- Project detection for `schema.prisma`, migrations, provider, Prisma version, package manager, and `DATABASE_URL` state.
- Migration timeline for applied, pending, and failed migrations.
- Drift detection with changed objects, SQL evidence, impact, and repair suggestions.
- Risk analysis for destructive SQL, dropped tables/columns, type changes, constraints, nullable changes, and index changes.
- Migration simulation for SQL previews, destructive statements, warnings, and dry-run status.
- Schema explorer for models, fields, relations, enums, indexes, and constraints.
- Health score and deployment readiness checks.
- Actionable deployment plan with blockers, next commands, and review guidance.
- Local JSON/Markdown reports for reviews and CI artifacts.
- CI gate with structured exit codes.
- Token-protected local dashboard API.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- A Prisma project with `prisma/schema.prisma`.
- `DATABASE_URL` for live database checks, drift detection, and deployment readiness.

## Quick Start

```bash
cd your-prisma-project
npx prisma-flow
```

The default command detects the Prisma project, starts a local Hono API server, and opens the bundled dashboard at `http://localhost:5555?token=<session-token>`.

## Installation

```bash
# One-off usage
npx prisma-flow

# Project dependency
npm install --save-dev prisma-flow

# Global install
npm install -g prisma-flow
```

The package exposes both command names:

```bash
prisma-flow status
pf status
```

## CLI Commands

| Command                                 | Purpose                                                                    | Useful options                                         |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| `prisma-flow` / `prisma-flow dashboard` | Start the local API and dashboard.                                         | `--port <port>`, `--no-open`                           |
| `prisma-flow status`                    | Print database, migration, drift, risk, health, and readiness state.       | `--json`, `--quiet`                                    |
| `prisma-flow check`                     | CI-friendly migration safety gate.                                         | `--ci`, `--json`, `--fail-on-risk <level>`, `--quiet`  |
| `prisma-flow plan`                      | Generate an actionable deploy plan with blockers and next commands.        | `--format human\|json\|markdown`, `--json`, `--ci`     |
| `prisma-flow report`                    | Generate a local review or CI report.                                      | `--format json\|markdown`, `--json`, `--output <path>` |
| `prisma-flow doctor`                    | Validate Node, Prisma CLI, schema, config, git, and database reachability. | `--json`                                               |
| `prisma-flow init`                      | Create `prismaflow.config.ts`.                                             | `--force`                                              |
| `prisma-flow inspect <migration>`       | Inspect SQL, risk factors, simulation, and optional rollback plan.         | `--json`, `--sql`, `--rollback`                        |
| `prisma-flow simulate <migration>`      | Dry-run a migration and mark destructive statements.                       | `--json`, `--fail-on-destructive`                      |
| `prisma-flow diff`                      | Compare Prisma schema against a live database.                             | `--from <url>`, `--json`, `--breaking-only`            |
| `prisma-flow rollback <migration>`      | Generate a rollback plan or rollback SQL.                                  | `--json`, `--print-sql`, `--include-manual`            |
| `prisma-flow repair`                    | Detect drift and generate/apply safe repair suggestions.                   | `--json`, `--apply`                                    |
| `prisma-flow compare`                   | Compare migration state across configured environments.                    | `--envs dev,staging,prod`, `--json`                    |
| `prisma-flow history`                   | Show migration history with risk and optional git metadata.                | `--limit <n>`, `--json`, `--git`                       |

## Dashboard

The dashboard is bundled into the CLI package and served locally.

- **Overview**: health score, deployment plan, detected project, next actions, and migration summary.
- **Migrations**: applied, pending, and failed migration timeline.
- **Drift**: detected schema/database differences and suggested action.
- **Risks**: migration risk scores and destructive-change factors.
- **Simulate**: migration dry-run output and destructive SQL warnings.
- **Schema**: parsed Prisma models, fields, relations, enums, indexes, and constraints.

The dashboard reads the session token from `?token=...` and preserves it while navigating.

## Reports and CI

Generate local artifacts:

```bash
prisma-flow plan --format markdown --output prismaflow-plan.md
prisma-flow report --format json --output prismaflow-report.json
prisma-flow report --format markdown --output prismaflow-report.md
```

Use PrismaFlow as a CI gate:

```bash
npx prisma-flow plan --ci --json
npx prisma-flow check --ci --json --fail-on-risk high
```

`plan --ci` exits `0` when ready, `1` when attention is needed, `2` when blocked, and `4` for runtime/configuration errors.

Exit codes:

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| `0`  | Ready                                         |
| `1`  | Pending migrations                            |
| `2`  | Schema drift detected                         |
| `3`  | Failed migrations                             |
| `4`  | Runtime or configuration error                |
| `5`  | Risk threshold exceeded with `--fail-on-risk` |

GitHub Actions example:

```yaml
- name: PrismaFlow migration check
  run: npx prisma-flow check --ci --json --fail-on-risk high
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Configuration

Create a config file:

```bash
prisma-flow init
```

`prismaflow.config.ts` supports:

- `port`: local dashboard server port, default `5555`.
- `logLevel`: `trace`, `debug`, `info`, `warn`, or `error`.
- `openBrowser`: whether the dashboard opens automatically.
- `features`: local feature flags for risk analysis, simulation, CI annotations, environment comparison, rollback generation, git awareness, and webhooks.
- `environments`: named database URLs for `compare`.
- `webhooks`: Slack, Discord, or generic HTTP webhook definitions.
- `auditLogMaxMb`: local audit log rotation threshold.
- `riskThreshold`: `low`, `medium`, `high`, or `critical`.

Environment overrides:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE
PRISMAFLOW_PORT=5555
PRISMAFLOW_LOG_LEVEL=info
PRISMAFLOW_NO_OPEN=1
PRISMAFLOW_RISK_THRESHOLD=medium
PRISMAFLOW_TELEMETRY=on
```

Telemetry is disabled by default. When explicitly enabled, it sends only command name, migration-count bucket, Node major version, and OS platform. It does not send project paths, schema content, SQL, database URLs, or user data.

## Local API

The dashboard uses a local REST/SSE API. All `/api/*` endpoints require the generated token via `Authorization: Bearer <token>` or `?token=<token>`.

| Endpoint                       | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `GET /health`                  | Unauthenticated process health check.                        |
| `GET /api/status`              | Project health, migration state, drift, risk, and readiness. |
| `GET /api/plan`                | Deployment decision, blockers, actions, and commands.        |
| `GET /api/migrations`          | Paginated migration timeline.                                |
| `GET /api/migrations/:name`    | Migration SQL and details.                                   |
| `GET /api/drift`               | Cached drift result.                                         |
| `POST /api/drift/check`        | Fresh drift detection.                                       |
| `GET /api/risks`               | Migration risk list.                                         |
| `GET /api/risks/:migration`    | Risk details for one migration.                              |
| `GET /api/schema`              | Parsed schema explorer data.                                 |
| `GET /api/simulate/:migration` | Migration simulation result.                                 |
| `GET /api/rollback/:migration` | Rollback plan for a migration.                               |
| `GET /api/repair`              | Drift repair suggestions.                                    |
| `POST /api/repair/apply`       | Apply safe repair suggestions.                               |
| `GET /api/diff`                | Schema/database diff.                                        |
| `GET /api/compare`             | Environment comparison.                                      |
| `GET /api/git`                 | Git-aware migration metadata.                                |
| `GET /api/audit`               | Local PrismaFlow audit log entries.                          |
| `GET /api/config`              | Safe config view with sensitive fields removed.              |
| `GET /api/events`              | Server-sent events stream.                                   |

## Security Model

- The dashboard API binds locally and uses localhost-only CORS.
- Each server start generates a 192-bit random session token.
- API routes require the token; static dashboard assets and `/health` do not.
- Request logs record method, path, status, duration, and request id, not full tokenized URLs.
- Child processes use argument arrays rather than shell interpolation.
- Local audit entries are written to `.prismaflow/audit.jsonl` and should not be committed.
- `.env`, credentials, database URLs, private keys, build output, and generated PrismaFlow state are ignored.

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
npm run format:check
npm run security:audit
npm run verify:release # complete production release gate
```

Focused commands:

```bash
npm run dev --workspace=packages/website
npm run dev --workspace=packages/dashboard
npm run dev --workspace=packages/cli
npm test --workspace=packages/cli
npm test --workspace=packages/dashboard
```

## Repository Structure

```text
prisma-flow/
  packages/
    cli/          # prisma-flow npm package, Commander CLI, Hono API, migration engines
    dashboard/    # Next.js dashboard bundled into the CLI
    shared/       # shared TypeScript types, Zod schemas, and errors
    website/      # public documentation and marketing website
  docs/           # architecture, roadmap, product, and documentation notes
  test-project/   # sample Prisma SQLite project
  .github/        # CI, release, CodeQL, Dependabot, issue forms, PR template
```

## Open Source

The V1 local product remains free with no artificial limits on projects, databases, or local usage.

- [Contributing](./CONTRIBUTING.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Security](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)
