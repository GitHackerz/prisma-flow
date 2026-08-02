# PrismaFlow CLI

PrismaFlow is a local-first Prisma migration safety tool. It analyzes migration
risk, checks schema drift, generates reports, and serves a bundled dashboard
from the user's machine.

## Install

Run without installing:

```bash
npx prisma-flow@latest
```

Install in a Prisma project:

```bash
npm install -D prisma-flow
npx prisma-flow init
npx prisma-flow doctor
npx prisma-flow dashboard
```

Global install is also supported:

```bash
npm install -g prisma-flow
prisma-flow status
pf dashboard
```

## Requirements

- Node.js 20 or newer.
- A Prisma project with `schema.prisma` and migrations.
- `DATABASE_URL` available through `.env` or the shell when commands need a
  database connection.

## Common Commands

- `prisma-flow dashboard`: start the local API and bundled dashboard.
- `prisma-flow status`: summarize migrations, drift, and risk.
- `prisma-flow check`: run CI-friendly migration safety checks.
- `prisma-flow plan`: produce a deploy decision with blockers and next commands.
- `prisma-flow report`: generate Markdown or JSON reports.
- `prisma-flow doctor`: validate local PrismaFlow setup.

## Security

The dashboard API binds locally and requires a per-session token. PrismaFlow does
not require a hosted service for local usage.

Full documentation, contribution guidelines, and security policy are available
in the main repository: https://github.com/prisma-flow/prisma-flow
