# Security Policy

PrismaFlow is a local-first tool that inspects Prisma schema and migration state. Treat database URLs, migration SQL, and schema metadata as sensitive.

## Supported Versions

Security fixes target the latest released version and the current `main` branch.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities. Use GitHub private vulnerability reporting:

https://github.com/prisma-flow/prisma-flow/security/advisories/new

If private vulnerability reporting is not enabled yet, contact a maintainer privately and share only redacted details until a private channel is available.

Include:

- Affected version or commit
- Reproduction steps
- Impact summary
- Relevant logs with secrets redacted

## V1 Security Requirements

- The dashboard API binds to localhost by default.
- Every `/api/*` request requires the generated session token.
- The token is ephemeral and changes on each server start.
- Child processes must use `execFile` or equivalent argument arrays, not shell interpolation.
- Logs must redact database URLs, tokens, passwords, and connection strings.
- Path handling must not allow reading outside the target Prisma project.
- Telemetry, if present, must not include project paths, schema content, SQL, database URLs, or user data.

## User Responsibilities

- Do not commit `.env` files or database credentials.
- Use least-privilege database credentials for CI checks where possible.
- Review drift and risk reports before deploying migrations to production.
