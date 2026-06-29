# PrismaFlow Product Strategy

> V1 refocus note: this document captures long-term strategic thinking, but the active product direction is now the focused open-source V1 in [ROADMAP.md](./ROADMAP.md). Cloud, AI, billing, collaboration, and enterprise features are future concerns and should not be implemented during V1.

## Executive Summary

PrismaFlow should be positioned as the operating system for Prisma database operations, not only as a migration dashboard. The strongest wedge is local-first safety for Prisma migrations: detection, visibility, risk scoring, simulation, and CI gates. The long-term business can expand from that wedge into cloud workspaces, team approvals, observability, governance, and enterprise controls.

The current repository already has a credible technical foundation: a CLI package, local Hono API server, Next.js dashboard, website, docs, drift/risk/rollback/repair modules, Docker support, and tests. The main launch risk is product coherence. Some advanced local commands exist but are under-documented, the dashboard/sidebar surface is broader than implemented routes, and the repository structure has not yet separated reusable engines from the CLI package. Before public launch, PrismaFlow needs sharper open-core boundaries, more complete docs, a clearer command taxonomy, and a launch-ready website.

## Current State Review

Current strengths:

- Local-first CLI and dashboard are the right initial distribution model.
- `packages/cli/src/core` already contains engines for detection, drift, diff, simulation, rollback, repair, audit, telemetry, and notifications.
- The website and docs exist, which reduces launch prep cost.
- Docker, CI, typecheck, lint, and Vitest are already wired.
- The project narrative already emphasizes safety, observability, and production readiness.

Current gaps:

- `Readme.md` advertises fewer commands than the CLI exposes.
- The requested `pf` shorthand does not exist; the package exposes only `prisma-flow`.
- The dashboard sidebar links to routes that are absent or partial, such as `/migrations`, `/drift`, and `/settings`.
- Website pages are mostly sections on home plus `/docs`, not full pages for pricing, roadmap, changelog, enterprise, open source, blog, legal, or contact.
- Reusable engines are still inside `packages/cli`, which will slow future cloud, CI, and hosted product work.
- Required docs such as `SECURITY.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `MONETIZATION.md`, and `CODE_OF_CONDUCT.md` are missing.

## Strategic Positioning

PrismaFlow should own this category statement:

> PrismaFlow is the local-first control plane for Prisma database change safety.

Recommended tagline:

> Visual Prisma Operations

Why: it is broader than migrations, clear enough for developers, and leaves room for schema intelligence, governance, and cloud workflows.

## Priority and Complexity Scale

- Priority: `P0` launch blocker, `P1` near-term launch requirement, `P2` growth lever, `P3` longer-term bet.
- Complexity: `S` small, `M` medium, `L` large, `XL` multi-quarter or platform-level.
- Category: `MVP`, `Growth`, `Pro`, `Enterprise`, or `Future`.

## Product Recommendations

| Area                           | Recommendation                                                                                                                                                 | Why it matters                                                                                                                           | Priority | Complexity | Category   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ---------- |
| Missing features               | Add first-class `pf` binary alias alongside `prisma-flow`.                                                                                                     | The vision uses `pf`; a short command improves daily developer ergonomics and memorability.                                              | P1       | S          | MVP        |
| Missing features               | Align command set with the product vision: `drift`, `validate`, `risk`, `health`, `report`, `timeline`.                                                        | Current commands are powerful but inconsistent with the desired mental model. A stable command taxonomy improves docs, CI, and adoption. | P0       | M          | MVP        |
| Missing features               | Promote existing `inspect`, `diff`, `simulate`, `rollback`, `repair`, `compare`, and `history` commands in README and website docs.                            | Hidden capability creates perceived product immaturity and wastes implemented value.                                                     | P0       | S          | MVP        |
| Missing features               | Add schema explorer with models, fields, enums, relations, indexes, and constraints.                                                                           | Schema intelligence is the second major pillar after migration safety and makes the dashboard visually valuable.                         | P1       | L          | MVP        |
| Missing features               | Add ERD visualization using parsed Prisma schema data.                                                                                                         | ERDs create immediate visual differentiation and are shareable in docs, PRs, and reports.                                                | P1       | L          | MVP        |
| Missing features               | Add report generation for JSON, HTML, CSV, and later PDF.                                                                                                      | Reports turn local analysis into artifacts for CI, compliance, and team review.                                                          | P1       | M          | MVP        |
| Missing features               | Add provider-specific risk rules for PostgreSQL, MySQL, SQLite, SQL Server, and MongoDB where applicable.                                                      | Risk semantics differ by database provider; generic SQL pattern matching is not enough for production safety.                            | P1       | L          | MVP        |
| Missing features               | Add CI annotations for GitHub Actions and GitLab.                                                                                                              | Developers should see failed migration risks in the workflow UI, not only logs.                                                          | P2       | M          | Growth     |
| Missing pages                  | Create dedicated pages for Features, Pricing, Roadmap, Changelog, Open Source, Enterprise, Sponsors, Contact, Privacy, and Terms.                              | The website currently has strong sections but not enough conversion and trust pages for public launch.                                   | P1       | M          | Growth     |
| Missing pages                  | Create feature deep dives for Drift Detection, Risk Analysis, Schema Explorer, Simulation, Reports, and CI/CD.                                                 | Search and sharing work better when each core capability has a canonical page.                                                           | P2       | M          | Growth     |
| Missing architecture decisions | Extract reusable engines from `packages/cli/src/core` into packages such as `core`, `parser`, `drift-engine`, `risk-engine`, `schema-engine`, and `reporting`. | Cloud, CLI, CI, and future integrations need shared domain logic without depending on the CLI package.                                   | P1       | L          | MVP        |
| Missing architecture decisions | Define a stable domain event model: project detected, migration scanned, drift found, risk scored, report generated, gate failed.                              | Events become the foundation for audit logs, cloud sync, analytics, notifications, and compliance.                                       | P1       | M          | MVP        |
| Missing architecture decisions | Introduce a provider adapter interface for database-specific inspection and risk rules.                                                                        | Prisma supports multiple providers; adapter boundaries prevent provider logic from becoming scattered.                                   | P1       | L          | MVP        |
| Missing architecture decisions | Create explicit privacy boundaries for local mode, telemetry, cloud sync, and AI features.                                                                     | Trust is a core product requirement for database tooling. Users must know what leaves their machine.                                     | P0       | M          | MVP        |
| Missing architecture decisions | Add async job orchestration for long-running drift, simulation, and report tasks.                                                                              | Production databases and large schemas can be slow; the UI needs progress, cancellation, and cached results.                             | P2       | L          | Growth     |
| Missing repository structure   | Move user-facing apps toward `apps/dashboard`, `apps/website`, and later `apps/cloud`; keep packages for reusable libraries.                                   | This matches the long-term architecture and separates app surfaces from reusable product engines.                                        | P2       | M          | Growth     |
| Missing repository structure   | Add `examples/` with minimal SQLite, PostgreSQL, monorepo, and CI examples.                                                                                    | Examples reduce onboarding friction and produce test fixtures for real workflows.                                                        | P1       | M          | MVP        |
| Missing repository structure   | Add package ownership boundaries and CODEOWNERS before external contributions grow.                                                                            | Clear ownership speeds review and protects critical engines.                                                                             | P2       | S          | Growth     |
| Missing documentation          | Add `SECURITY.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `MONETIZATION.md`, and `CODE_OF_CONDUCT.md`.                                                               | These are baseline trust documents for an open-source DevTools launch.                                                                   | P0       | S          | MVP        |
| Missing documentation          | Rename or duplicate `Readme.md` as `README.md`.                                                                                                                | GitHub conventions expect `README.md`; inconsistent casing can hurt visibility and tooling.                                              | P0       | S          | MVP        |
| Missing documentation          | Create a command reference generated or checked from CLI definitions.                                                                                          | Prevents docs from drifting as commands evolve.                                                                                          | P1       | M          | MVP        |
| Missing documentation          | Add security model docs for local server auth, child process execution, secret handling, and telemetry.                                                        | Database tooling must prove that it treats credentials and local access carefully.                                                       | P0       | M          | MVP        |
| Missing business opportunities | Offer a hosted migration safety dashboard for teams with multiple Prisma projects.                                                                             | Multi-project visibility is a high-value team pain and a natural Pro wedge.                                                              | P2       | XL         | Pro        |
| Missing business opportunities | Build a CI/CD migration gate product with retained history and policy configuration.                                                                           | Teams pay for production confidence, auditability, and fewer deployment incidents.                                                       | P2       | L          | Pro        |
| Missing business opportunities | Package PrismaFlow for agencies managing client databases.                                                                                                     | Agencies need repeatable checks across many projects and can become strong distribution partners.                                        | P3       | M          | Growth     |
| Missing monetization           | Keep local CLI, dashboard, drift, risk, schema explorer, reports, and basic CI free.                                                                           | The open-source product must stay useful forever to build trust and distribution.                                                        | P0       | M          | MVP        |
| Missing monetization           | Charge for cloud workspaces, approvals, notifications, retention, team analytics, and policy gates.                                                            | These are team-level coordination problems, not individual developer basics.                                                             | P1       | L          | Pro        |
| Missing monetization           | Add enterprise packaging for SSO, RBAC, audit exports, self-hosting, private support, and custom retention.                                                    | Enterprise buyers pay for control, compliance, procurement, and risk reduction.                                                          | P2       | XL         | Enterprise |
| Missing monetization           | Avoid monetizing basic webhooks too aggressively at launch; consider free local generic webhook and paid managed notification routing.                         | Early users may view basic notifications as safety infrastructure. Hosted routing and team integrations are easier to justify as paid.   | P2       | S          | Growth     |
| Missing growth strategies      | Build a product-led growth loop around `npx prisma-flow check --ci` and generated reports.                                                                     | CI failures and reports naturally expose PrismaFlow to teams beyond the first installer.                                                 | P1       | M          | Growth     |
| Missing growth strategies      | Add shareable public examples and screenshots for drift, risk, ERD, and simulation workflows.                                                                  | Visual DevTools need proof. Screenshots convert faster than abstract copy.                                                               | P1       | M          | Growth     |
| Missing growth strategies      | Create comparison pages for manual Prisma workflows, Prisma Studio, and generic database migration tools.                                                      | Users need to understand why PrismaFlow exists next to tools they already know.                                                          | P2       | M          | Growth     |
| Missing open-source strategies | Define an open-core charter that explicitly promises core safety features remain free.                                                                         | Open-core products fail when users fear lock-in. The charter reduces adoption resistance.                                                | P0       | S          | MVP        |
| Missing open-source strategies | Add contributor issue labels: `good first issue`, `help wanted`, `core-engine`, `dashboard`, `docs`, `provider-postgres`, `provider-mysql`.                    | Labels create an on-ramp for contributors and let maintainers steer effort.                                                              | P1       | S          | Growth     |
| Missing open-source strategies | Publish an RFC process for major command, engine, and cloud decisions.                                                                                         | A public architecture process builds trust and avoids fragmented feature requests.                                                       | P2       | M          | Growth     |
| Missing enterprise features    | Design RBAC around actions: view project, read schema, run checks, approve migration, manage policy, export audit.                                             | Enterprise permissions need to map to real operational duties.                                                                           | P2       | L          | Enterprise |
| Missing enterprise features    | Add immutable audit log exports with retention policies.                                                                                                       | Compliance teams need evidence that migration decisions and approvals are traceable.                                                     | P2       | L          | Enterprise |
| Missing enterprise features    | Plan self-hosted deployment with Docker Compose first, then Kubernetes and air-gapped mode.                                                                    | Large customers often cannot send schema metadata to a SaaS by default.                                                                  | P3       | XL         | Enterprise |
| Missing enterprise features    | Add SSO via OIDC first, then SAML for enterprise procurement.                                                                                                  | OIDC is faster to implement; SAML becomes necessary for larger organizations.                                                            | P3       | L          | Enterprise |
| Missing developer experience   | Add `prisma-flow doctor --json` and actionable remediation hints.                                                                                              | Diagnostics should be scriptable and should tell users exactly what to fix.                                                              | P1       | M          | MVP        |
| Missing developer experience   | Add first-run onboarding in the dashboard with detected project, datasource provider, migrations, and next action.                                             | Developers need confidence that the tool found the right project and database.                                                           | P1       | M          | MVP        |
| Missing developer experience   | Add deterministic fixture projects for each supported provider.                                                                                                | Engines need reliable regression tests across database behaviors.                                                                        | P1       | L          | MVP        |
| Missing developer experience   | Add a VS Code task or extension concept later, but do not make it a launch dependency.                                                                         | The CLI/browser loop is enough for launch; editor integrations are a later adoption surface.                                             | P3       | L          | Future     |
| Missing UX                     | Resolve broken or missing dashboard routes linked by the sidebar.                                                                                              | Dead navigation damages trust quickly in a safety product.                                                                               | P0       | M          | MVP        |
| Missing UX                     | Add a migration detail drawer with SQL, risk explanation, affected objects, and suggested next action.                                                         | Users should not leave the dashboard to understand a risky migration.                                                                    | P1       | M          | MVP        |
| Missing UX                     | Add severity language that explains impact, not only labels.                                                                                                   | "Critical" must map to specific data-loss or downtime risk for users to trust it.                                                        | P1       | M          | MVP        |
| Missing UX                     | Add empty, loading, error, and disconnected states for every dashboard route.                                                                                  | Local tools often fail because of environment issues; UX must guide recovery.                                                            | P1       | M          | MVP        |
| Missing launch strategy        | Launch only after README, docs, website, CLI help, and dashboard all tell the same product story.                                                              | Inconsistent launch surfaces reduce credibility and confuse early adopters.                                                              | P0       | M          | MVP        |
| Missing launch strategy        | Prepare launch assets: screenshots, GIFs, demo repo, 90-second video, Product Hunt copy, Hacker News post, and GitHub release notes.                           | DevTools adoption is visual and trust-driven; assets make the value concrete.                                                            | P1       | M          | Growth     |
| Missing launch strategy        | Launch to Prisma-heavy communities before broad Product Hunt.                                                                                                  | Focused users provide better feedback than broad traffic.                                                                                | P1       | S          | Growth     |
| Missing marketing              | Own educational content: "Prisma drift", "Prisma migration rollback", "Prisma deploy checklist", and "safe schema changes".                                    | Search demand should map to concrete problems PrismaFlow solves.                                                                         | P2       | M          | Growth     |
| Missing marketing              | Build a public incident-prevention narrative, not a generic dashboard narrative.                                                                               | The emotional buyer need is avoiding database incidents.                                                                                 | P1       | S          | Growth     |
| Missing community              | Create GitHub Discussions for Q&A, Show and Tell, RFCs, and provider support.                                                                                  | Early community needs structured places to ask questions and propose changes.                                                            | P1       | S          | Growth     |
| Missing community              | Add public roadmap voting for integrations and provider-specific risk rules.                                                                                   | Community feedback should guide where limited engineering time goes.                                                                     | P2       | M          | Growth     |
| Missing GitHub strategy        | Add issue templates for bug, feature, provider support, security concern, and docs gap.                                                                        | Structured issues reduce triage time and improve contributor quality.                                                                    | P1       | S          | MVP        |
| Missing GitHub strategy        | Add release automation that publishes changelog, npm package, Docker image, and GitHub release together.                                                       | Launch credibility depends on predictable releases and install paths.                                                                    | P1       | L          | MVP        |
| Missing roadmap                | Split roadmap into Launch, OSS Maturity, Cloud Beta, Team Workflows, Enterprise Readiness.                                                                     | The current phase model is directionally right but too broad for execution tracking.                                                     | P0       | S          | MVP        |
| Missing roadmap                | Add measurable exit criteria per phase.                                                                                                                        | Phases should end when user-visible outcomes are true, not when code exists.                                                             | P0       | S          | MVP        |
| Missing security               | Add threat model covering local dashboard auth, token leakage, CORS, path traversal, child process execution, logs, and secret redaction.                      | PrismaFlow handles project files and database URLs; threat modeling is mandatory before launch.                                          | P0       | M          | MVP        |
| Missing security               | Add dependency scanning, secret scanning, SBOM, provenance, and signed releases.                                                                               | Supply-chain trust is part of DevTools adoption.                                                                                         | P1       | M          | MVP        |
| Missing security               | Add security disclosure policy and private reporting channel.                                                                                                  | Users need a safe path to report vulnerabilities.                                                                                        | P0       | S          | MVP        |
| Missing compliance             | Design cloud audit, retention, deletion, and tenant isolation from the start.                                                                                  | Compliance cannot be bolted on cheaply after cloud data models mature.                                                                   | P2       | L          | Pro        |
| Missing compliance             | Prepare SOC 2 control mapping before enterprise sales, but do not pursue certification before usage proves demand.                                             | Certification is expensive; control design should start early, certification can wait.                                                   | P3       | L          | Enterprise |
| Missing compliance             | Add GDPR data inventory and data processing documentation for telemetry/cloud.                                                                                 | Schema metadata can be sensitive. Users need clarity on what is collected and retained.                                                  | P2       | M          | Pro        |
| Missing technical requirements | Add contract tests for API responses and CLI JSON output.                                                                                                      | CI, cloud, and docs will depend on stable machine-readable interfaces.                                                                   | P1       | M          | MVP        |
| Missing technical requirements | Add large-schema and large-migration performance benchmarks.                                                                                                   | Production customers will have hundreds of models and migrations.                                                                        | P2       | M          | Growth     |
| Missing technical requirements | Add cross-platform shell and filesystem tests for Windows, macOS, and Linux.                                                                                   | PrismaFlow is a local CLI; path and process behavior must be reliable everywhere.                                                        | P1       | M          | MVP        |
| Missing technical requirements | Add database-backed integration tests using Testcontainers or Docker Compose.                                                                                  | Drift and migration behavior cannot be fully trusted with unit tests alone.                                                              | P1       | L          | MVP        |

## MVP Launch Definition

Launch should not mean "all product vision implemented." It should mean the open-source local product is trustworthy, coherent, and useful without a paid account.

MVP launch scope:

- `npx prisma-flow` opens a working local dashboard.
- CLI command taxonomy is stable and documented.
- Project detection, migration timeline, drift detection, risk analysis, simulation, schema explorer, and reports are usable locally.
- CI gates work with documented exit codes and JSON output.
- Dashboard routes are complete or removed from navigation.
- README, docs, website, and CLI help agree.
- Security model and disclosure policy are published.
- Core features remain free and the open-core line is explicit.

Do not make cloud collaboration, AI, SSO, or enterprise self-hosting part of the public-launch blocker list.

## Architecture Direction

Recommended target structure:

```text
prisma-flow/
  apps/
    dashboard/
    website/
    cloud/
  packages/
    cli/
    core/
    parser/
    drift-engine/
    risk-engine/
    schema-engine/
    reporting/
    integrations/
    ai/
    shared/
    ui/
  docs/
  examples/
  .github/
```

Migration plan:

1. Keep current layout until the launch story is coherent.
2. Extract `packages/cli/src/core` into reusable packages when API contracts are clearer.
3. Move `dashboard` and `website` under `apps/` before cloud work begins.
4. Add `packages/ui` only when components are shared between website, dashboard, and cloud.
5. Add `packages/ai` only after privacy boundaries and paid credit accounting are designed.

Key architecture decisions to write down:

- Local-first mode never requires login.
- Cloud sync is opt-in and explains exactly what metadata leaves the machine.
- Engine packages expose pure functions or explicit adapters where possible.
- Long-running work runs as jobs with IDs, progress, logs, cancellation, and cached artifacts.
- Reports and CI outputs use versioned schemas.

## Open-Core Strategy

Free and open source forever:

- CLI and local dashboard.
- Project detection.
- Migration timeline.
- Schema explorer and ERD.
- Drift detection.
- Risk analysis.
- Local simulation.
- Local reports.
- CI checks and JSON output.
- Basic local audit artifacts.

Paid Pro:

- Cloud dashboard.
- Team workspaces.
- Multi-project and multi-environment history.
- Approval workflows.
- Managed notifications.
- Git provider integration.
- Team analytics.
- Extended retention.
- AI assistant credits.

Enterprise:

- SSO and RBAC.
- Self-hosted and air-gapped deployments.
- Advanced audit exports.
- Custom retention and data residency.
- SLA and dedicated support.
- Custom integrations.

The open-source version must remain valuable enough that individual developers recommend it even when they never pay.

## Roadmap

### Phase 1: Launch-Ready OSS

Exit criteria:

- Complete CLI command reference and `pf` alias.
- Dashboard navigation has no dead links.
- Schema explorer and report generation are available.
- README, website docs, and CLI help are consistent.
- Security docs and roadmap are published.
- GitHub templates and contribution workflow are ready.

### Phase 2: OSS Maturity and Growth

Exit criteria:

- Examples cover SQLite, PostgreSQL, MySQL, and monorepo projects.
- Provider-specific risk engine has baseline coverage.
- CI annotations and shareable reports are available.
- Benchmarks and integration tests run in CI.
- Content and launch assets are live.

### Phase 3: Cloud Beta

Exit criteria:

- Opt-in project sync.
- Cloud workspaces with projects and environments.
- Managed notifications.
- Retained migration/risk history.
- Basic team roles.
- Clear privacy and data retention controls.

### Phase 4: Team Workflows

Exit criteria:

- Migration approval workflow.
- Branch and environment comparison.
- GitHub/GitLab integration.
- Comments and change requests.
- Team analytics.
- Policy gates.

### Phase 5: Enterprise Readiness

Exit criteria:

- OIDC and SAML SSO.
- Custom RBAC.
- Immutable audit logs.
- Self-hosted deployment.
- Data export and deletion workflows.
- Compliance control mapping.

## Go-To-Market Strategy

Target beachhead:

Prisma users who deploy production apps and have felt uncertainty around migration safety. This includes solo SaaS builders, small teams, and agencies. Enterprise should influence architecture but should not define the first launch.

Launch sequence:

1. Private alpha with 10 to 20 Prisma-heavy developers.
2. Public GitHub launch with polished README, screenshots, demo GIF, docs, and example projects.
3. Prisma community outreach, Discord/Reddit posts, and focused technical articles.
4. Product Hunt only after activation and onboarding are proven.
5. Cloud waitlist driven by local product usage.

Activation metric:

User runs `npx prisma-flow`, sees detected project state, and gets at least one useful insight within two minutes.

Retention metric:

User adds `prisma-flow check --ci` or a package script to a real project.

North-star metric:

Weekly active projects with successful local or CI migration safety checks.

## Pricing Recommendation

Suggested public pricing:

- Free: local-first OSS, unlimited local projects, local reports, CI checks.
- Pro: $19 per developer per month for cloud workspaces, managed notifications, approval workflows, git integrations, and AI credits.
- Team: $99 per month for up to 10 users, team analytics, retained history, and advanced policy gates.
- Enterprise: custom pricing for SSO, RBAC, self-hosting, data controls, SLA, and dedicated support.

Pricing warning:

Do not charge for the features that prove the product works locally. Charge when the product coordinates multiple people, projects, environments, or compliance obligations.

## Security and Compliance Requirements

MVP security requirements:

- Local server binds to localhost by default.
- Auth token is high entropy, ephemeral, and never logged beyond the startup URL.
- API validates paths to prevent reading outside the project root.
- Child processes use explicit argument arrays.
- Logs redact `DATABASE_URL`, credentials, tokens, and connection strings.
- Telemetry is opt-in or clearly documented with an easy opt-out.
- Security disclosure policy exists before public launch.

Cloud security requirements:

- Tenant isolation at the data model and authorization layers.
- Secret storage with managed encryption.
- Least-privilege service credentials.
- Audit events for all user and system actions.
- Data retention and deletion policy.
- Rate limiting and abuse protections.
- Backups and restore testing.

Enterprise compliance requirements:

- SOC 2 control mapping.
- GDPR data inventory and DPA readiness.
- SSO, RBAC, audit export, and retention configuration.
- Self-hosted deployment path for regulated customers.
- Clear statement on whether schema metadata, SQL, or database samples are processed.

## Key Assumptions to Challenge

- "AI assistant" should not lead the roadmap. The core trust layer must work first.
- "Cloud dashboard" should not be required for the product to be useful. Local-first is the adoption wedge.
- "Enterprise" should influence data model and security choices now, but not consume early execution time.
- "More pages" is not the same as better positioning. Website pages must map to conversion, trust, and search intent.
- "Open core" only works if the free tier is excellent and the paid tier solves collaboration, retention, and governance.

## Immediate Next Actions

1. Create missing launch docs: `README.md`, `SECURITY.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `MONETIZATION.md`, and `CODE_OF_CONDUCT.md`.
2. Reconcile CLI docs with implemented commands and add the `pf` alias.
3. Fix dashboard navigation by implementing or removing missing routes.
4. Define versioned JSON schemas for CLI output and reports.
5. Extract a first architecture decision record for local-first privacy boundaries.
6. Build the schema explorer and report generator as the next two MVP product features.
7. Prepare examples and screenshots for public launch.
