# Contributing to PrismaFlow

Thank you for considering contributing! This document covers how to get set up,
what to work on, and how to submit changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)

## Code of Conduct

Be respectful and constructive. We follow the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- A local Postgres instance, SQLite fixture, or Docker for integration testing

### Setup

```bash
git clone https://github.com/prisma-flow/prisma-flow.git
cd prisma-flow
npm install           # installs all workspace packages + sets up Husky hooks
```

Copy the example env file and fill in a test `DATABASE_URL`:

```bash
cp .env.example .env
```

### Verify everything works

```bash
npm run typecheck     # zero TypeScript errors expected
npm test              # all tests should pass
npm run lint          # Biome lint and formatting checks
npm run security:audit # high-severity production dependency audit
npm run build         # full build should succeed
```

## Development Workflow

```
main          ← production releases only (tags trigger the release workflow)
develop       ← integration branch; all PRs target here
feature/xxx   ← your working branch
fix/xxx       ← bug fix branches
```

1. Fork the repository and create your branch from `develop`.
2. Make your changes — keep PRs focused on a single concern.
3. Add or update tests to cover your change.
4. Run `npm run typecheck`, `npm run lint`, and `npm test` — all must pass locally.
5. Open a Pull Request targeting `develop`.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Body (optional) — explain *why*, not just *what*.

Closes #42
```

| Type       | When to use                                             |
| :--------- | :------------------------------------------------------ |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `chore`    | Tooling, dependencies, CI                               |
| `perf`     | Performance improvement                                 |

Use this convention for commits and pull request titles.

## Pull Request Process

1. **Title** — write a clear, conventional commit-style title.
2. **Description** — include context, motivation, and a summary of changes.
3. **Screenshots** — include before/after screenshots for UI changes.
4. **Checklist** before requesting review:
   - [ ] `npm run typecheck` passes
   - [ ] `npm run lint` passes
   - [ ] `npm test` passes
   - [ ] `npm run format:check` passes (run `npm run format` to auto-fix)
   - [ ] `npm run security:audit` passes or any advisory is explained
   - [ ] New/changed behaviour is documented
   - [ ] No unrelated files changed

PRs are merged by squash-and-merge to keep a clean history on `develop`.

## Project Structure

```
prisma-flow/
├── packages/
│   ├── shared/        # @prisma-flow/shared — Zod schemas, types, errors
│   ├── cli/           # prisma-flow npm package
│   │   └── src/
│   │       ├── commands/  # CLI sub-commands
│   │       ├── core/      # Business logic (drift, migrations, schema)
│   │       └── server/    # Hono REST API + routes
│   └── dashboard/     # Next.js 16 static UI
├── .github/workflows/ # CI and release pipelines
├── Dockerfile
├── docker-compose.yml
├── turbo.json
└── tsconfig.base.json
```

## Testing

| Package              | Command                                   | What it runs                    |
| :------------------- | :---------------------------------------- | :------------------------------ |
| `packages/cli`       | `npm test --workspace=packages/cli`       | Vitest unit + integration tests |
| `packages/dashboard` | `npm test --workspace=packages/dashboard` | Vitest + React Testing Library  |
| All                  | `npm test`                                | All workspaces via Turborepo    |

Tests live alongside source in `src/tests/` (CLI) and `app/components/*.test.tsx`
(dashboard).

When adding a new core module, add a corresponding `*.test.ts` file.
When adding a new API route, add integration coverage in `server.test.ts`.

## Releasing

Releases are handled by the CI workflow — only maintainers merge to `main` and
push the version tag. If you need guidance on versioning, open an issue.

## Questions?

Open a [GitHub Discussion](https://github.com/prisma-flow/prisma-flow/discussions)
— we're happy to help.
