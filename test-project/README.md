# prisma-flow test project

Minimal Prisma + SQLite sandbox for testing `prisma-flow` commands locally.

## Structure

```
test-project/
├── .env                        # DATABASE_URL=file:./dev.db
├── seed.ts                     # optional seed data
├── prisma/
│   ├── schema.prisma           # User, Post models
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20240101000000_initial_schema/   ← applied
│       └── 20240301000000_add_tags_and_profile/ ← pending
```

## Setup

```bash
cd test-project
npm install          # installs prisma + @prisma/client
npx prisma migrate dev --name initial   # apply migrations + create dev.db
```

## Test prisma-flow commands

```bash
prisma-flow status   # migration + drift summary
prisma-flow check    # audit
prisma-flow doctor   # health check
prisma-flow          # launches the dashboard at http://localhost:5555
```
