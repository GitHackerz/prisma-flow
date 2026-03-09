# PrismaFlow — Documentation

> Visual Prisma migration management — safe, observable, production-ready.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Requirements](#requirements)
3. [Installation](#installation)
   - [CLI Users](#cli-users)
   - [Web Dashboard Users](#web-dashboard-users)
4. [CLI Reference](#cli-reference)
   - [dashboard (default)](#dashboard-default-command)
   - [status](#status-command)
   - [check](#check-command)
   - [init](#init-command)
   - [doctor](#doctor-command)
5. [Web Dashboard Guide](#web-dashboard-guide)
   - [Accessing the Dashboard](#accessing-the-dashboard)
   - [Status Cards](#status-cards)
   - [Migration Timeline](#migration-timeline)
   - [Migration List](#migration-list)
   - [Drift Alert](#drift-alert)
   - [Health Check Panel](#health-check-panel)
6. [Configuration](#configuration)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [CI/CD Integration](#cicd-integration)
10. [Docker](#docker)
11. [Webhooks & Notifications](#webhooks--notifications)
12. [Feature Tiers](#feature-tiers)
13. [Troubleshooting](#troubleshooting)

---

## How It Works

PrismaFlow has two layers that work together:

```
Your Project Directory
        │
        ▼
  ┌─────────────────────────────────────────┐
  │           prisma-flow CLI               │
  │                                         │
  │  1. Reads  prisma/schema.prisma         │
  │  2. Runs   prisma migrate status        │  ◄── Prisma CLI (npx)
  │  3. Runs   prisma migrate diff          │
  │  4. Parses SQL to classify drift        │
  │  5. Starts Hono HTTP server             │
  │     • Per-session auth token            │
  │     • Serves static dashboard HTML      │
  │     • Exposes /api/* REST endpoints     │
  └────────────────────┬────────────────────┘
                       │  http://localhost:5555?token=<session-token>
                       ▼
  ┌─────────────────────────────────────────┐
  │         Web Dashboard (Next.js)         │
  │                                         │
  │  • Polls /api/status   every  5 s       │
  │  • Polls /api/migrations every 10 s     │
  │  • Polls /api/drift    every 15 s       │
  │  • Renders live migration state         │
  │  • Shows drift alerts w/ re-check btn   │
  └─────────────────────────────────────────┘
```

### Architecture Layers

| Layer | Technology | Role |
|:------|:-----------|:-----|
| CLI binary | Node.js 20 + Commander.js | Entry point, project detection, sub-commands |
| Core modules | TypeScript (ESM) | Drift detection, migration analysis, schema parsing |
| API server | Hono v4 + @hono/node-server | REST endpoints, auth, CORS, static file serving |
| Dashboard UI | Next.js 16 static export | Visual interface (served from `public/` inside the CLI dist) |
| Shared types | Zod v3 (`@prisma-flow/shared`) | Schema validation, domain types, error classes |

### Data Flow

```
1. CLI starts
   └─ detectPrismaProject(cwd)
       ├─ Looks for prisma/schema.prisma
       ├─ Also checks prisma/schema/ directory (multi-file, Prisma v5.15+)
       └─ Reads DATABASE_URL from .env / prisma/.env

2. Server starts
   ├─ Generates random 48-char hex session token
   ├─ Prints token + URL to terminal
   └─ Opens browser: http://localhost:5555?token=<token>

3. Dashboard opens
   └─ Extracts token from ?token= URL param
       └─ Attaches as Authorization: Bearer <token> on every API request

4. API requests
   ├─ GET /api/status
   │   └─ Runs: prisma migrate status (detects pending/failed)
   │            + prisma migrate diff  (measures drift)
   │   Returns: connected, appliedCount, pendingCount, failedCount,
   │            hasDrift, driftCount, riskLevel, lastSync
   │
   ├─ GET /api/migrations?page=1&limit=20
   │   └─ Reads: migrations/ directory on disk
   │            + prisma migrate status output
   │   Returns: paginated list of { name, status, appliedAt, risks[] }
   │
   ├─ GET /api/migrations/:name
   │   └─ Reads: migrations/<name>/migration.sql
   │   Returns: full SQL + risk analysis
   │
   ├─ GET /api/drift          (cached 10 s)
   │   └─ Runs: prisma migrate diff --from-schema-datamodel --to-schema-datasource
   │   Returns: hasDrift, driftCount, differences[]
   │
   ├─ POST /api/drift/check   (force-fresh, bypasses cache)
   │
   └─ GET /api/schema
       └─ Calls: @prisma/internals getDMMF
       Returns: models[], enums[]
```

---

## Requirements

| Dependency | Minimum version | Notes |
|:-----------|:----------------|:------|
| **Node.js** | 20.x | Required. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://fnm.vercel.app) |
| **npm** | 10.x | Ships with Node 20 |
| **Prisma CLI** | 5.0 | Must be available in the project via `npx prisma` |
| **DATABASE_URL** | — | Must be set in `.env` or `prisma/.env` |

> PrismaFlow does **not** install itself as a Prisma dependency — it wraps the
> Prisma CLI via `npx prisma ...` so it follows whatever version your project uses.

---

## Installation

### CLI Users

#### Option A — Zero install (recommended for one-time use)

```bash
cd /path/to/your-prisma-project
npx prisma-flow
```

`npx` downloads and runs the latest version automatically. No global state is
modified. This is the recommended default.

#### Option B — Global install (recommended for daily use)

```bash
npm install -g prisma-flow
```

Then from any Prisma project:

```bash
cd /path/to/your-project
prisma-flow
```

Upgrade later with:

```bash
npm update -g prisma-flow
```

#### Option C — Project dev dependency

Add PrismaFlow as a dev dependency so all contributors use it automatically:

```bash
npm install --save-dev prisma-flow
# or
yarn add --dev prisma-flow
# or
pnpm add -D prisma-flow
```

Then add convenience scripts to `package.json`:

```json
{
  "scripts": {
    "migrations":       "prisma-flow",
    "migrations:check": "prisma-flow check --ci",
    "migrations:status":"prisma-flow status"
  }
}
```

Run with:

```bash
npm run migrations
```

---

### Web Dashboard Users

The web dashboard is **bundled inside the CLI** — there is nothing separate to
install. When you run `prisma-flow` (any install method above), the server
automatically:

1. Builds and serves the dashboard from `public/` inside the package
2. Opens your default browser at `http://localhost:5555?token=<session-token>`
3. Passes the auth token in the URL so the dashboard can reach the API

If you cannot open it automatically, copy the URL from the terminal and paste
it into any browser. The token in the URL is required — the dashboard will show
a connection error without it.

> **Note:** The dashboard is a static HTML/JS/CSS export of a Next.js app. It
> does not need a separate Next.js process — Hono serves the files.

---

## CLI Reference

All commands are run from inside your Prisma project's root directory (the
directory that contains your `prisma/` folder).

```
Usage: prisma-flow [command] [options]

Commands:
  dashboard  Launch the visual dashboard (default)
  status     Print migration & drift status to the terminal
  check      Validate state for CI/CD pipelines
  init       Create prismaflow.config.ts
  doctor     Validate the environment & project setup
  help       Display help for a command
```

---

### `dashboard` (default command)

Launches the HTTP server and opens the visual dashboard in your browser.

```bash
prisma-flow [dashboard] [options]
```

| Option | Default | Description |
|:-------|:--------|:------------|
| `-p, --port <port>` | `5555` | Port to bind the server to |
| `--no-open` | — | Do not open the browser automatically |

**Examples:**

```bash
# Default — opens http://localhost:5555
npx prisma-flow

# Custom port
npx prisma-flow --port 7777

# Start server without opening browser (useful in headless / remote environments)
npx prisma-flow --no-open
```

**What happens:**

```
🔍 Detecting Prisma project...

✓ Prisma project detected
  Schema:     /project/prisma/schema.prisma
  Migrations: 12 found

✓ PrismaFlow dashboard running
  → http://localhost:5555?token=a3f8c2...

  Auth token printed above — keep it private.
  Press Ctrl+C to stop
```

---

### `status` command

Prints a human-readable or JSON summary of the current migration and drift
state. Does not start a server.

```bash
prisma-flow status [options]
```

| Option | Description |
|:-------|:------------|
| `--json` | Output raw JSON to stdout instead of coloured text |

**Human-readable output:**

```
PrismaFlow • Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Prisma project detected
✓ Database connected

Migrations:
  Applied : 10
  Pending : 2
  Failed  : 0

Schema Drift:
  ✓ No drift detected

Risk Level:
  LOW

  Run npx prisma-flow to open the dashboard
```

**JSON output** (`--json`):

```json
{
  "connected": true,
  "appliedCount": 10,
  "pendingCount": 2,
  "failedCount": 0,
  "hasDrift": false,
  "driftCount": 0,
  "riskLevel": "low",
  "lastSync": "2026-02-28T12:00:00.000Z"
}
```

**Usage in scripts:**

```bash
# Check drift count from a shell script
DRIFT=$(npx prisma-flow status --json | jq '.driftCount')
echo "Drift items: $DRIFT"
```

---

### `check` command

Validates the migration state and exits with a structured non-zero code when
issues are found. Designed for CI/CD pipelines.

```bash
prisma-flow check [options]
```

| Option | Description |
|:-------|:------------|
| `--ci` | Exit with a non-zero code corresponding to the issue found |
| `--json` | Output structured JSON to stdout |

**Exit codes:**

| Code | Meaning | When to expect it |
|:-----|:--------|:------------------|
| `0` | Everything is healthy | No pending, no drift, no failures |
| `1` | Pending migrations | Unapplied migrations exist |
| `2` | Schema drift detected | Database diverged from migration history |
| `3` | Failed migrations | At least one migration is in a failed state |
| `4` | Runtime error | Could not connect, no project found, etc. |

**Human-readable output:**

```
PrismaFlow • Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Database connected
✓ No failed migrations
⚠  2 pending migration(s)
✓ No schema drift
```

**JSON output** (`--json`):

```json
{
  "ok": false,
  "connected": true,
  "pendingCount": 2,
  "failedCount": 0,
  "driftDetected": false,
  "driftCount": 0,
  "riskLevel": "low",
  "lastSync": "2026-02-28T12:00:00.000Z"
}
```

**GitHub Actions example:**

```yaml
- name: Check migration state
  run: npx prisma-flow check --ci
  # Fails the pipeline if there are pending migrations, drift, or failures
```

**Jenkins / custom pipeline:**

```bash
npx prisma-flow check --ci --json > migration-check.json
EXIT_CODE=$?

if [ $EXIT_CODE -eq 2 ]; then
  echo "Schema drift detected — alerting team"
  # ... call Slack webhook, create ticket, etc.
fi

exit $EXIT_CODE
```

---

### `init` command

Creates a `prismaflow.config.ts` file in the current directory with all
available options documented inline.

```bash
prisma-flow init [options]
```

| Option | Description |
|:-------|:------------|
| `-f, --force` | Overwrite an existing `prismaflow.config.ts` |

**Generated file:**

```ts
import type { PrismaFlowConfig } from 'prisma-flow'

const config: PrismaFlowConfig = {
  /** Port for the local dashboard server. */
  port: 5555,

  /** Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error' */
  logLevel: 'info',

  /** Automatically open the browser when the dashboard starts. */
  openBrowser: true,

  /** Feature flags */
  features: {
    riskAnalysis:  true,
    webhookAlerts: false,
    auditLog:      false,
    ciAnnotations: false,
  },

  /** Webhook destinations for drift/failure notifications */
  webhooks: [],
}

export default config
```

---

### `doctor` command

Runs a series of environment checks and reports the result. Useful when
setting up PrismaFlow for the first time or debugging a broken environment.

```bash
prisma-flow doctor
```

No options. Always prints human-readable output.

**Checks performed:**

| Check | What it verifies |
|:------|:----------------|
| Node.js version ≥ 20 | `process.versions.node` |
| Prisma CLI available | `npx prisma --version` resolves without error |
| `prisma/schema.prisma` found | Schema file or directory exists |
| `DATABASE_URL` is set | Present in `.env`, `prisma/.env`, or process environment |
| `prisma/migrations/` directory exists | Migrations folder is present |
| Database reachable | `prisma migrate status` exits without a P1001/connection error |

**Sample output:**

```
PrismaFlow • Doctor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Runtime]
  • Node.js version ≥ 20 ... OK (22.4.0)

[Prisma CLI]
  • prisma available (npx prisma --version) ... OK (5.22.0)

[Project]
  • prisma/schema.prisma found ... OK
  • DATABASE_URL is set ... OK
  • prisma/migrations/ directory exists ... OK

[Database]
  • Database reachable ... OK

✓ All checks passed
```

---

## Web Dashboard Guide

### Accessing the Dashboard

1. Run `prisma-flow` from your project root
2. Your browser opens automatically at `http://localhost:5555?token=<token>`
3. If the browser does not open (e.g. headless server), copy the URL from
   the terminal output and open it manually

> The `?token=` query parameter is required. Without it, all API requests will
> return `401 Unauthorized` and the dashboard will show a connection error.
> This is intentional — it prevents other local processes from reading your
> migration data.

**Remote / SSH access:**

If you are running PrismaFlow on a remote server, use SSH port forwarding:

```bash
ssh -L 5555:localhost:5555 user@your-server
```

Then open `http://localhost:5555?token=<token>` in your local browser.
The token is printed in the remote terminal session.

---

### Status Cards

The four cards at the top of the dashboard update every **5 seconds**.

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Database Status │  │ Pending Migr.   │  │ Failed Migr.    │  │ Risk Level      │
│                 │  │                 │  │                 │  │                 │
│   Connected     │  │       2         │  │       0         │  │    medium       │
│ Synced 12:00:05 │  │ 10 applied total│  │ Action req if>0 │  │Based on drift & │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

| Card | Green means | Yellow/Red means |
|:-----|:------------|:-----------------|
| Database Status | Connection active | Cannot reach the database |
| Pending Migrations | 0 pending | Unapplied migrations exist (run `prisma migrate deploy`) |
| Failed Migrations | 0 failed | A migration entered a failed state — needs manual recovery |
| Risk Level | `low` | `medium` = drift present; `high` = failed migration exists |

---

### Migration Timeline

A horizontal visual timeline showing the chronological history of all
migrations. Updates every **10 seconds**.

```
●───●───●───●───●───●───●───●───●  ○───○───
                            applied  pending
```

- **Filled dot (●)** — migration has been applied to the database
- **Empty dot (○)** — migration is pending (not yet applied)
- **Red dot** — migration is in a failed state

Hover over a dot to see the migration name and timestamp.

---

### Migration List

A scrollable table of all migrations, newest first, with their status badges.
Updates every **10 seconds**.

| Column | Description |
|:-------|:------------|
| Name | `YYYYMMDDHHMMSS_descriptive_name` |
| Status | `applied` / `pending` / `failed` badge |
| Applied At | Timestamp extracted from the migration folder name |
| Risks | Badges for destructive operations detected in the SQL |

**Risk badges** appear when the migration SQL contains:

| Badge | SQL pattern |
|:------|:------------|
| Drops table | `DROP TABLE` |
| Drops column | `DROP COLUMN` |
| Bulk deletion | `DELETE FROM` |
| Truncates table | `TRUNCATE` |
| Alters structure | `ALTER TABLE` |
| Removes index | `DROP INDEX` |
| Removes constraint | `DROP CONSTRAINT` |

---

### Drift Alert

An amber banner that appears **only** when schema drift is confirmed. It is
hidden during loading and when there is no drift — it never shows prematurely.

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Schema Drift Detected (2 differences)      [Re-check]   │
│                                                             │
│  The database schema is out of sync with your              │
│  Prisma schema.                                             │
│                                                             │
│  • ALTER TABLE "User" ADD COLUMN "legacy" TEXT             │
│  • CREATE INDEX "idx_stale" ON "sessions"("token")         │
└─────────────────────────────────────────────────────────────┘
```

**What is drift?**

Drift means someone (or a process) made a direct change to the database that
bypasses Prisma's migration history. Common causes:

- A DBA ran `ALTER TABLE` directly in production
- A seed script created a table that Prisma doesn't know about
- An old migration was edited after it was applied

**What to do when drift is detected:**

1. Click **Re-check** to confirm the drift is still present (not a stale cache)
2. Review the listed SQL differences
3. Options:
   - Create a new migration that makes the schema match: `prisma migrate dev --name fix_drift`
   - Revert the manual DB change and re-apply via migration
   - If the change is intentional, update `prisma/schema.prisma` to reflect it, then run `prisma migrate dev`

---

### Health Check Panel

Shows the same information as `prisma-flow status` but in a live-updating
panel within the dashboard. Displays:

- Connection status
- Applied / Pending / Failed counts
- Drift count

---

## Configuration

Run `prisma-flow init` to create a `prismaflow.config.ts` at your project root.

The config file is optional — PrismaFlow works without it using defaults and
environment variables.

**Full configuration reference:**

```ts
import type { PrismaFlowConfig } from 'prisma-flow'

const config: PrismaFlowConfig = {
  // ── Server ────────────────────────────────────────────────────────────────

  /** Port for the dashboard server. Default: 5555 */
  port: 5555,

  // ── Logging ───────────────────────────────────────────────────────────────

  /**
   * Minimum log level.
   * 'trace' | 'debug' | 'info' | 'warn' | 'error'
   * Default: 'info'
   */
  logLevel: 'info',

  // ── Browser ───────────────────────────────────────────────────────────────

  /**
   * Open the browser automatically when the dashboard starts.
   * Set to false for headless / server environments.
   * Default: true
   */
  openBrowser: true,

  // ── Features ──────────────────────────────────────────────────────────────

  features: {
    /** Analyse migration SQL for destructive patterns. Default: true */
    riskAnalysis: true,

    /** Send webhook notifications on drift/failure. Default: false (Pro) */
    webhookAlerts: false,

    /** Write JSONL audit entries to .prismaflow/audit.jsonl. Default: false (Pro) */
    auditLog: false,

    /** Annotate CI output with structured error info. Default: false (Pro) */
    ciAnnotations: false,
  },

  // ── Webhooks ──────────────────────────────────────────────────────────────

  /**
   * List of webhook destinations.
   * Triggered when drift is detected or a migration fails.
   *
   * type: 'slack' | 'discord' | 'http'
   * events: 'drift' | 'failure' | 'all'
   */
  webhooks: [
    // { type: 'slack',   url: process.env.SLACK_WEBHOOK_URL!,   events: 'all' },
    // { type: 'discord', url: process.env.DISCORD_WEBHOOK_URL!, events: 'drift' },
    // { type: 'http',    url: 'https://example.com/webhook',    events: 'failure' },
  ],
}

export default config
```

---

## Environment Variables

All environment variables override the corresponding config file values.

| Variable | Default | Description |
|:---------|:--------|:------------|
| `DATABASE_URL` | — | **Required.** Prisma datasource connection string |
| `PRISMAFLOW_PORT` | `5555` | Port for the dashboard HTTP server |
| `PRISMAFLOW_LOG_LEVEL` | `info` | `trace` / `debug` / `info` / `warn` / `error` |
| `PRISMAFLOW_OPEN_BROWSER` | `true` | Set to `false` to suppress auto-open |
| `PRISMAFLOW_TELEMETRY` | `on` | Set to `off` to opt out of anonymous usage stats |
| `PRISMAFLOW_LICENCE_KEY` | — | Unlocks Pro and Enterprise features |
| `PRISMAFLOW_WEBHOOK_SLACK_URL` | — | Slack incoming-webhook URL |
| `PRISMAFLOW_WEBHOOK_DISCORD_URL` | — | Discord webhook URL |

Copy `.env.example` from the repository root for a commented template:

```bash
cp node_modules/prisma-flow/.env.example .env.prismaflow
```

---

## API Reference

The Hono server exposes a REST API on `http://localhost:<port>/api/*`.

### Authentication

Every `/api/*` request requires a valid session token. The token is:

- Generated fresh **each time** `prisma-flow` starts (48 hex chars)
- Printed to the terminal with the dashboard URL
- Embedded in the browser URL as `?token=<token>` when the browser opens
- Expected as either:
  - `Authorization: Bearer <token>` header
  - `?token=<token>` query parameter

Requests without a valid token receive `401 Unauthorized`.

---

### `GET /api/status`

Returns the overall project and database health.

**Response:**

```json
{
  "success": true,
  "data": {
    "connected":         true,
    "migrationsApplied": 10,
    "migrationsPending": 2,
    "migrationsFailed":  0,
    "driftDetected":     false,
    "driftCount":        0,
    "riskLevel":         "low",
    "lastSync":          "2026-02-28T12:00:00.000Z"
  }
}
```

---

### `GET /api/migrations`

Returns a paginated list of migrations with their status and risk analysis.

**Query parameters:**

| Param | Type | Default | Max | Description |
|:------|:-----|:--------|:----|:------------|
| `page` | integer | `1` | — | Page number (1-based) |
| `limit` | integer | `20` | `100` | Items per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name":      "20240101120000_init",
      "status":    "applied",
      "appliedAt": "2024-01-01T12:00:00.000Z",
      "sqlPath":   "/project/prisma/migrations/20240101120000_init/migration.sql",
      "risks":     []
    },
    {
      "name":      "20240215083000_add_users",
      "status":    "pending",
      "appliedAt": null,
      "sqlPath":   "/project/prisma/migrations/20240215083000_add_users/migration.sql",
      "risks":     ["Alters table structure"]
    }
  ],
  "pagination": {
    "page":  1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

### `GET /api/migrations/:name`

Returns the full SQL content and risk analysis for a single migration.

**Response:**

```json
{
  "success": true,
  "data": {
    "name":      "20240215083000_add_users",
    "status":    "pending",
    "appliedAt": null,
    "sql":       "-- CreateTable\nCREATE TABLE \"User\" (\n  ...\n);\n",
    "risks":     ["Alters table structure"]
  }
}
```

---

### `GET /api/drift`

Returns the current drift state. Response is **cached for 10 seconds** to
avoid hammering the database on repeated polls.

**Response:**

```json
{
  "success": true,
  "data": {
    "hasDrift":    true,
    "driftCount":  2,
    "differences": [
      {
        "sql":         "ALTER TABLE \"User\" ADD COLUMN \"legacy\" TEXT",
        "type":        "column-mismatch",
        "description": "Column or table structure mismatch"
      },
      {
        "sql":         "DROP INDEX \"idx_old\"",
        "type":        "index-change",
        "description": "Index difference detected"
      }
    ],
    "cachedAt": "2026-02-28T12:00:00.000Z"
  }
}
```

**Drift item types:**

| Type | Triggered by |
|:-----|:-------------|
| `table-missing` | `CREATE TABLE` in diff |
| `table-extra` | `DROP TABLE` in diff |
| `column-mismatch` | `ALTER TABLE` (without CONSTRAINT) |
| `index-change` | `CREATE INDEX` / `DROP INDEX` / `ALTER INDEX` |
| `constraint-change` | Any statement containing `CONSTRAINT` |
| `unknown` | Anything else |

---

### `POST /api/drift/check`

Forces an immediate drift check, bypassing the 10-second cache.

**Request:** No body required.

**Response:** Same shape as `GET /api/drift`.

---

### `GET /api/schema`

Returns the parsed Prisma schema as structured data (models and enums).

**Response:**

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name":   "User",
        "fields": [
          { "name": "id",    "type": "Int",    "isRequired": true },
          { "name": "email", "type": "String", "isRequired": true }
        ]
      }
    ],
    "enums": []
  }
}
```

---

### Error responses

All endpoints return the same error shape on failure:

```json
{
  "success": false,
  "error":   "Human-readable error message"
}
```

| Status code | When |
|:------------|:-----|
| `401` | Missing or invalid auth token |
| `404` | Migration name not found |
| `500` | Unexpected server error (schema unreadable, Prisma CLI failure, etc.) |

---

## CI/CD Integration

### GitHub Actions

Add a migration check job before any deployment step:

```yaml
name: Deploy

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
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migration-check
    # ... rest of your deployment job
```

### Exit code strategy in pipelines

```yaml
# Fail fast on any issue
- run: npx prisma-flow check --ci

# Fail only on critical issues (failed migrations + drift), allow pending
- run: |
    npx prisma-flow check --ci --json > result.json
    EXIT=$?
    if [ $EXIT -eq 3 ] || [ $EXIT -eq 2 ]; then
      echo "Critical migration issue — blocking deploy"
      exit 1
    fi
    echo "Pending migrations present but non-blocking"
    exit 0
```

### GitLab CI

```yaml
migration-check:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npx prisma-flow check --ci --json | tee migration-check.json
  artifacts:
    paths:
      - migration-check.json
    when: always
  variables:
    DATABASE_URL: $DATABASE_URL
```

### Jenkins declarative pipeline

```groovy
stage('Migration Check') {
  steps {
    sh 'npx prisma-flow check --ci'
  }
  post {
    failure {
      script {
        def result = readJSON file: 'migration-check.json'
        if (result.driftDetected) {
          slackSend message: "⚠️ Schema drift detected in ${env.BRANCH_NAME}"
        }
      }
    }
  }
}
```

---

## Docker

### Run with Docker (quick start)

```bash
# Build the image
docker build -t prisma-flow:local .

# Run against the current project (mounts it read-only)
docker run --rm \
  -p 5555:5555 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -v "$(pwd):/project:ro" \
  prisma-flow:local
```

Open the URL printed in the terminal (includes the session token).

### Docker Compose (with Postgres)

The included `docker-compose.yml` starts PrismaFlow plus a local Postgres
instance for end-to-end local development:

```bash
# Start both services
docker compose up -d

# View PrismaFlow logs (to get the token)
docker compose logs -f prisma-flow

# Stop
docker compose down
```

Default ports:

| Service | Port |
|:--------|:-----|
| PrismaFlow dashboard | `5555` |
| Postgres | `5433` (mapped from container port 5432, to avoid conflicts with a local pg) |

Override ports via environment variables:

```bash
PRISMAFLOW_PORT=6000 POSTGRES_PORT=5434 docker compose up -d
```

### Environment variables for Docker

```bash
# Required
DATABASE_URL=postgresql://prismaflow:prismaflow@postgres:5432/prismaflow_dev

# Optional
PRISMAFLOW_PORT=5555
PRISMAFLOW_LOG_LEVEL=info
PRISMAFLOW_OPEN_BROWSER=false   # always false inside Docker
```

---

## Webhooks & Notifications

PrismaFlow can send a notification payload to Slack, Discord, or any HTTP
endpoint when drift is detected or a migration fails.

### Configure via environment variables

```bash
# Slack
PRISMAFLOW_WEBHOOK_SLACK_URL=https://hooks.slack.com/services/T.../B.../xxx

# Discord
PRISMAFLOW_WEBHOOK_DISCORD_URL=https://discord.com/api/webhooks/...

# Generic HTTP (POST with JSON body)
PRISMAFLOW_WEBHOOK_HTTP_URL=https://your-api.example.com/hooks/migrations
```

### Configure via `prismaflow.config.ts`

```ts
webhooks: [
  {
    type:   'slack',
    url:    process.env.SLACK_WEBHOOK_URL!,
    events: 'all',       // 'drift' | 'failure' | 'all'
  },
  {
    type:   'discord',
    url:    process.env.DISCORD_WEBHOOK_URL!,
    events: 'drift',
  },
  {
    type:   'http',
    url:    'https://example.com/webhook',
    events: 'failure',
  },
]
```

### Payload shape (HTTP webhooks)

```json
{
  "event":     "drift",
  "project":   "your-project",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "data": {
    "driftCount":  2,
    "differences": [ "..." ]
  }
}
```

> Webhooks are a **Pro** feature. Set `PRISMAFLOW_LICENCE_KEY` to enable.

---

## Feature Tiers

| Feature | Free | Pro | Enterprise |
|:--------|:----:|:---:|:----------:|
| Visual migration timeline | ✓ | ✓ | ✓ |
| Drift detection | ✓ | ✓ | ✓ |
| Risk analysis | ✓ | ✓ | ✓ |
| CI/CD check command | ✓ | ✓ | ✓ |
| `doctor` and `init` commands | ✓ | ✓ | ✓ |
| Webhook notifications | — | ✓ | ✓ |
| Audit log (JSONL) | — | ✓ | ✓ |
| CI annotations | — | ✓ | ✓ |
| Advanced analytics | — | — | ✓ |
| Team collaboration | — | — | ✓ |

Set `PRISMAFLOW_LICENCE_KEY=<your-key>` to unlock Pro or Enterprise features.

---

## Troubleshooting

### "No Prisma project found"

PrismaFlow looks for `prisma/schema.prisma` (or `prisma/schema/` for multi-file
schemas) **in the current working directory**.

```bash
# Make sure you are in the right directory
ls prisma/schema.prisma   # should exist

# If you are in a monorepo, cd into the package that owns the schema
cd packages/my-app
npx prisma-flow
```

### "Database connection failed" / dashboard shows disconnected

```bash
# Test the connection independently
npx prisma migrate status

# Check DATABASE_URL is set
echo $DATABASE_URL

# Check it is in .env
cat .env | grep DATABASE_URL

# Run doctor for a full diagnostic
npx prisma-flow doctor
```

### "Could not validate token" / 401 errors in browser

The session token in the URL must exactly match the one printed in the terminal.
Common causes:

- You copied the URL without the `?token=` query parameter
- The server was restarted (each start generates a **new** token)
- A proxy or browser extension stripped the query string

**Fix:** Copy the full URL from the terminal (including `?token=...`) and paste
it into the browser address bar.

### Port already in use

```bash
# Kill whatever is on port 5555
lsof -i :5555
kill -9 <PID>

# Or use a different port
prisma-flow --port 7777
```

### Dashboard shows "Loading..." indefinitely

This means the browser opened before the server finished starting, or the token
is missing. Refresh the page using the URL from the terminal.

### `prisma migrate diff` returns unexpected output / drift false positives

PrismaFlow uses `prisma migrate diff --from-schema-datamodel --to-schema-datasource`
internally. If your schema uses features that generate verbose diff output (e.g.
extensions, row-level security), you may see more drift items than expected.

Run the command manually to inspect the raw output:

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource  prisma/schema.prisma \
  --script
```

### High memory or slow response

- PrismaFlow spawns `npx prisma` as child processes (not in-process). Each API
  call that requires Prisma (status, drift, schema) starts a short-lived
  subprocess.
- The drift endpoint caches results for **10 seconds**. If your database is
  slow to respond, increase the dashboard poll interval by modifying the SWR
  `refreshInterval` in `packages/dashboard/app/page.tsx`.

### Pino logging is missing / not coloured

PrismaFlow uses `pino` with `pino-pretty` in development. If you see raw JSON
in the terminal, `pino-pretty` may not be installed.

```bash
# In the PrismaFlow package directory (only relevant for contributors)
npm install pino-pretty

# Or suppress structured logs entirely
PRISMAFLOW_LOG_LEVEL=warn npx prisma-flow
```

---

## Security Notes

- The session token is generated with `crypto.randomBytes(24)` — 192 bits of
  entropy. It is printed once to the terminal and embedded in the browser URL.
- CORS is restricted to `localhost` and `127.0.0.1` origins only.
- The server does not persist the token — it is ephemeral per process lifetime.
- All child processes use `execFile()` with explicit argument arrays, not
  `exec()` with shell interpolation, preventing command injection via
  user-controlled paths.
- The dashboard is served from the local filesystem; there are no external
  network requests from the server itself (telemetry is opt-in and fire-and-forget).

---

*PrismaFlow v0.1.0 — February 2026*
