# PrismaFlow

**Visual Prisma Operations** - an open-source dashboard and CLI for understanding database evolution, migration history, schema health, drift, migration risk, and deployment readiness in seconds.

PrismaFlow answers one question:

> Why install PrismaFlow instead of only using Prisma CLI?

Because it turns Prisma migration state into a visual, safety-focused workflow: what changed, what is risky, whether the database drifted, and whether the project is ready to deploy.

## V1 Scope

PrismaFlow V1 is local-first and open source. No account, cloud sync, billing, AI, team workspace, or enterprise setup is required.

- **Project detection**: finds `schema.prisma`, migration folder, database provider, Prisma version, and environment state.
- **Migration timeline**: shows applied, pending, and failed migrations with creation/applied dates, status, and risk context.
- **Drift detection**: explains what changed, where it changed, why it matters, and what to do next.
- **Risk analysis**: detects destructive and risky SQL such as table drops, column drops, type changes, constraints, nullable changes, and index changes.
- **Migration simulation**: previews generated SQL, destructive statements, warnings, and dry-run status.
- **Schema explorer**: visualizes models, fields, relations, enums, indexes, and constraints.
- **Health score and deployment readiness**: summarizes whether the project is safe to deploy.
- **Reports**: generates local JSON or Markdown artifacts for reviews and CI logs.
- **CI integration**: `prisma-flow check --ci` returns structured exit codes and JSON output.

## Quick Start

```bash
cd your-prisma-project
npx prisma-flow
```

The CLI detects your Prisma project, starts a local API server, and opens the dashboard at `http://localhost:5555?token=<session-token>`.

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

## Commands

```bash
prisma-flow              # open the dashboard
prisma-flow status       # show database, migration, drift, health, and readiness state
prisma-flow check --ci   # CI gate with structured exit codes
prisma-flow report       # generate JSON or Markdown reports
prisma-flow doctor       # validate local environment and Prisma setup
prisma-flow inspect      # inspect one migration's SQL, risks, and simulation
prisma-flow simulate     # dry-run a migration
prisma-flow diff         # compare schema and database state
prisma-flow history      # terminal migration timeline
prisma-flow init         # create prismaflow.config.ts
```

Use `--json` on supported commands for machine-readable output.

## CI Exit Codes

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| `0`  | Ready                                         |
| `1`  | Pending migrations                            |
| `2`  | Schema drift detected                         |
| `3`  | Failed migrations                             |
| `4`  | Runtime or configuration error                |
| `5`  | Risk threshold exceeded with `--fail-on-risk` |

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```

Useful focused commands:

```bash
npm run dev --workspace=packages/dashboard
npm run dev --workspace=packages/cli
npm test --workspace=packages/cli
npm test --workspace=packages/dashboard
```

## Repository Structure

```text
prisma-flow/
  packages/
    cli/          # Commander CLI, local Hono API server, V1 engines
    dashboard/    # Next.js dashboard served by the CLI
    shared/       # shared TypeScript types, Zod schemas, errors
    website/      # public documentation website
  docs/           # architecture, roadmap, security, and product docs
  test-project/   # sample Prisma SQLite project
  .github/        # CI and release workflows
```

The long-term direction is to move user-facing apps to `apps/dashboard` and `apps/website`, then extract reusable engine packages (`core`, `drift-engine`, `risk-engine`, `schema-engine`, `ui`) once V1 behavior is stable.

## Open Source Promise

The V1 product remains free forever:

- CLI and dashboard
- Drift detection
- Migration timeline
- Risk analysis
- Migration simulation
- Schema explorer and ERD-style visualization
- Reports
- CI integration
- Health score
- Deployment readiness

No artificial limits on projects, databases, or local usage.

## Documentation

- [Contributing](./CONTRIBUTING.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Security](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)
