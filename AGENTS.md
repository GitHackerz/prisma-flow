# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo. Core packages live in `packages/`:

- `packages/cli`: the `prisma-flow` CLI, Hono API server, commands, and migration logic.
- `packages/dashboard`: Next.js dashboard UI; React components live under `app/components`.
- `packages/shared`: Zod schemas, types, and errors exported as `@prisma-flow/shared`.
- `packages/website`: public Next.js documentation/marketing site.

Docs are in `docs/`, CI lives in `.github/workflows/`, and `test-project/` contains a sample Prisma SQLite app.

## Build, Test, and Development Commands

Use Node 20 from `.nvmrc` and install dependencies with `npm install`.

- `npm run dev`: starts all workspace dev tasks through Turborepo.
- `npm run build`: builds all packages.
- `npm run build:cli`: builds the CLI package and copies dashboard assets.
- `npm run typecheck`: runs TypeScript checks across workspaces.
- `npm run lint`: runs Biome checks where configured.
- `npm test`: runs all workspace tests.
- `npm run format` / `npm run format:check`: write or verify Prettier formatting.

For focused runs, use commands such as `npm test --workspace=packages/cli`.

## Coding Style & Naming Conventions

Write TypeScript as ES modules. Biome enforces 2-space indentation, LF endings, single quotes, trailing commas, no semicolons, organized imports, no unused imports, no explicit `any`, and `useImportType`. Follow existing file patterns: CLI commands use `packages/cli/src/commands/<name>.ts`, routes use `packages/cli/src/server/routes/<name>.ts`, and React components use PascalCase `.tsx` files.

## Testing Guidelines

Vitest is the test runner. CLI tests live in `packages/cli/src/tests/*.test.ts`; dashboard component tests use `*.test.tsx` near the component, with Testing Library and jsdom. Add or update tests for behavior changes, especially core migration logic, API routes, and UI state. Run `npm test` and `npm run typecheck` before opening a PR.

## Commit & Pull Request Guidelines

Commit history and `CONTRIBUTING.md` use Conventional Commits, for example `feat: initialize prisma-flow test project with SQLite setup`. Use `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, or `perf`.

PRs should target the integration branch described in `CONTRIBUTING.md`, stay focused on one concern, explain motivation and changes, link issues when applicable, include screenshots for UI changes, and confirm tests, typecheck, and formatting checks.

## Security & Configuration Tips

Do not commit secrets. Copy `.env.example` to `.env` for local settings, and keep database URLs or tokens local. Generated outputs such as `dist/`, `.next/`, `coverage/`, and `node_modules/` are ignored and should not be reviewed as source.
