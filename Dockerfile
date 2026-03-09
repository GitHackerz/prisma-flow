# ─── Stage 1 — Build shared package ─────────────────────────────────────────
FROM node:20-alpine AS shared-builder

WORKDIR /build

# Install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY turbo.json ./

RUN npm ci --workspace=packages/shared

# Build shared
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./
RUN npm run build --workspace=packages/shared


# ─── Stage 2 — Build Next.js dashboard ───────────────────────────────────────
FROM node:20-alpine AS dashboard-builder

WORKDIR /build

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/dashboard/package*.json ./packages/dashboard/
COPY turbo.json ./

RUN npm ci --workspace=packages/dashboard

# Copy shared dist from stage 1
COPY --from=shared-builder /build/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /build/packages/shared/package.json ./packages/shared/

# Copy and build dashboard
COPY packages/dashboard ./packages/dashboard
COPY tsconfig.base.json ./
RUN npm run build --workspace=packages/dashboard


# ─── Stage 3 — Build CLI ─────────────────────────────────────────────────────
FROM node:20-alpine AS cli-builder

WORKDIR /build

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/cli/package*.json ./packages/cli/
COPY turbo.json ./

RUN npm ci --workspace=packages/cli

# Copy shared dist
COPY --from=shared-builder /build/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /build/packages/shared/package.json ./packages/shared/

# Copy dashboard out/ so the copy-dashboard script has it
COPY --from=dashboard-builder /build/packages/dashboard/out ./packages/dashboard/out

# Copy CLI source and build
COPY packages/cli ./packages/cli
COPY tsconfig.base.json ./
# Run the full build (copy-dashboard.mjs → tsup)
RUN npm run build --workspace=packages/cli


# ─── Stage 4 — Minimal production runtime ────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="prisma-flow" \
      org.opencontainers.image.description="Visual Prisma migration management" \
      org.opencontainers.image.source="https://github.com/your-org/prisma-flow"

# Non-root user for security
RUN addgroup -S prismaflow && adduser -S prismaflow -G prismaflow

WORKDIR /app

ENV NODE_ENV=production \
    PRISMAFLOW_PORT=5555 \
    PRISMAFLOW_OPEN_BROWSER=false

# Only copy the production artifacts — no source, no devDeps
COPY --from=cli-builder /build/packages/cli/dist     ./dist
COPY --from=cli-builder /build/packages/cli/public   ./public
COPY --from=cli-builder /build/packages/cli/package.json ./

# Install only production dependencies (no devDeps, no scripts)
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

USER prismaflow

EXPOSE ${PRISMAFLOW_PORT}

# The CLI needs the project mounted at /project
VOLUME ["/project"]

ENTRYPOINT ["node", "dist/index.js"]
CMD ["--project-path", "/project"]
