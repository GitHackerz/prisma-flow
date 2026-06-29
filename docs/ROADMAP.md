# PrismaFlow Roadmap

This roadmap keeps V1 focused on one job: help developers understand Prisma database state and deployment safety within 30 seconds of running `npx prisma-flow`.

## V1: Local-First Open Source

Status: in progress.

V1 includes only features that improve migration visibility, schema understanding, database safety, or deployment confidence.

- Project detection: schema path, migration folder, database provider, Prisma version, and environment state.
- Migration timeline: applied, pending, failed, creation date, applied date, duration when available, and visual status indicators.
- Drift detection: what changed, where, why it matters, and suggested action.
- Risk analysis: low, medium, high, and critical risk levels with explanations and recommendations.
- Migration simulation: generated SQL, affected statements, destructive warnings, and dry-run result.
- Schema explorer: models, fields, relations, enums, indexes, constraints, and ERD-style overview.
- Health score: 0-100 project health score from drift, failures, pending migrations, risk, and schema consistency.
- Deployment readiness: clear production readiness checks for local and CI use.
- Reports and CI integration: machine-readable outputs and deploy gates.
- Documentation and website updates for the V1 product story.

## Deferred Until After V1

These are intentionally not part of the V1 implementation:

- AI assistant
- Team workspaces
- Cloud sync
- Enterprise features
- SSO and RBAC
- Billing
- Audit logs
- Compliance workflows
- Slack or notification integrations
- Multi-tenant architecture
- Approval workflows
- Analytics

## V1 Exit Criteria

- `npx prisma-flow` opens a production-ready dashboard with no dead navigation.
- A developer can see database state, migration history, drift, risk, schema structure, health score, and deployment readiness without running Prisma CLI commands manually.
- README, architecture, security, contributor docs, and website copy describe the same focused V1 product.
- No screen presents mock or placeholder functionality as complete.
- The open-source product has no artificial usage limits.
