# Changelog

All notable changes to PrismaFlow are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] — 2026-02-01

### Added

#### Monorepo & Tooling
- Turborepo task pipeline (`build`, `typecheck`, `lint`, `test`, `clean`)
- `tsconfig.base.json` — shared strict TypeScript config across all packages
- `.prettierrc` — consistent formatting (no semi, single quotes, trailing commas)
- `.nvmrc` — pins Node.js 20
- `.env.example` — documents all environment variables
- `packages/shared` — new internal package `@prisma-flow/shared`
  - Zod schemas for all domain types
  - Shared domain types (`Migration`, `DriftItem`, `ProjectStatus`, `PrismaFlowConfig`, ...)
  - Typed error classes (`SchemaNotFoundError`, `DatabaseConnectionError`, `DriftDetectionError`, ...)
- Husky pre-commit hook with `lint-staged`
- Multi-stage `Dockerfile` (shared → dashboard → CLI → minimal Alpine runtime)
- `docker-compose.yml` — PrismaFlow + Postgres for local dev

#### CLI (`prisma-flow`)
- `prisma-flow init` — generates `prismaflow.config.ts` in the target project
- `prisma-flow doctor` — validates environment: Node version, Prisma CLI, schema, `DATABASE_URL`, migrations dir, DB reachability
- `pino` structured logging with `PRISMAFLOW_LOG_LEVEL` env var and `pino-pretty` in dev
- `scripts/copy-dashboard.mjs` — build pipeline: copies Next.js `out/` into CLI `public/` before `tsup`
- Multi-file Prisma schema support (`prisma/schema/` directory, Prisma v5.15+)
- `driftCount` field added to `ProjectStatus`
- Audit log — appends JSONL entries to `.prismaflow/audit.jsonl`
- Opt-in anonymous telemetry (respects `PRISMAFLOW_TELEMETRY=off`)
- Feature gating (free / pro / enterprise) via `PRISMAFLOW_LICENCE_KEY`
- Webhook notifications — Slack, Discord, and generic HTTP destinations

#### API Server
- Per-session random Bearer token (48 hex chars) — printed to terminal, required on all `/api/*` routes
- CORS restricted to `localhost` and `127.0.0.1` origins only
- `secureHeaders()` middleware (`X-Content-Type-Options`, `X-Frame-Options`, etc.)
- Request ID middleware — `X-Request-Id` header on every response
- Graceful shutdown on `SIGTERM` / `SIGINT`
- Pagination on `GET /api/migrations` (`?page=&limit=`, max 100)
- 10-second server-side cache on `GET /api/drift`; `POST /api/drift/check` always forces a fresh run
- Typed Hono context (`Variables: { projectPath, requestId }`) — no more `any`

#### Dashboard
- SWR v2 data fetching with auto-refresh (5 s status, 10 s migrations, 15 s drift)
- `react-error-boundary` wrapping — connection errors shown gracefully instead of crashing
- `sonner` toast notifications
- `DriftAlert` — returns `null` until drift is confirmed (no premature render)
- `DriftAlert` — Force re-check button with spinner
- `MigrationTimeline` / `MigrationList` — receive migrations as props (single SWR call in parent, no duplicate fetches)
- All hardcoded `bg-white` / `text-slate-900` replaced with CSS theme tokens (`bg-card`, `text-card-foreground`, `border-border`) — dark mode now works
- `packages/dashboard/lib/api.ts` — typed API client with token management

#### Testing & CI
- Vitest v2 configured for both CLI and dashboard
- CLI unit tests: `drift-detector.test.ts`, `migration-analyzer.test.ts`
- CLI API integration tests: `server.test.ts` — all routes, auth guard, security headers
- Dashboard component tests: `StatusCards.test.tsx`
- GitHub Actions `ci.yml` — Node 20 + 22 matrix, typecheck / lint / test / build
- GitHub Actions `release.yml` — builds, tests, creates GitHub release, publishes to npm with provenance

### Fixed

- **Critical — command injection**: All `execAsync(\`npx prisma ... "${userPath}"\`)` replaced with `execFileAsync('npx', [...args, schemaPath])` — no shell string interpolation
- **Drift suppressed when pending migrations exist**: `hasDrift = drift.length > 0 && pendingCount === 0` → drift is now always reported independently of pending state
- **`getMigrationStatusMap` TODO completed**: Now correctly parses both "pending" and "failed" migration sections from `prisma migrate status` output
- **`@ts-ignore` in `schema-parser.ts`**: Replaced with typed dynamic import and version-safe extraction of `getDMMF`
- **40-line comment block in `commands/dashboard.ts`**: Removed
- Unused `@prisma/client` and `ora` dependencies removed from CLI

### Security

- CORS origin: was `*` → restricted to localhost only
- Authentication: was none → per-session random Bearer token on all API routes
- Child processes: `exec` with template strings → `execFile` with explicit argument arrays

[Unreleased]: https://github.com/your-org/prisma-flow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/prisma-flow/releases/tag/v0.1.0
