# Multi-stage build. Native canvas/gifencoder (optional, used only by the V2
# !trigger fun command with a graceful fallback) are skipped entirely so the
# image never needs a native toolchain.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# --omit=optional skips canvas/gifencoder (optionalDependencies) - Trigger.ts
# already degrades to "not available in this environment" without them.
RUN npm install --legacy-peer-deps --include=dev --omit=optional

COPY . .
RUN npm run build

# Dashboard build (vite, no native deps)
FROM node:20-alpine AS dashboard-builder
WORKDIR /dashboard
COPY dashboard-v3/package*.json ./
RUN npm install --no-audit --no-fund
COPY dashboard-v3/ ./
RUN npm run build

FROM node:20-alpine

ARG NODE_ENV=production
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev --omit=optional

# Non-root runtime user
RUN addgroup -S kaoi && adduser -S kaoi -G kaoi

COPY --from=builder /app/dist ./dist
# data/ is runtime state (dockerignored, never in the build context): create it
RUN mkdir -p ./data
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/local_modules ./local_modules
# Operations UI, served by the V3 API server when NODE_ENV runs the v3 entry
COPY --from=dashboard-builder /dashboard/dist ./dashboard-v3/dist

RUN chown -R kaoi:kaoi /app
USER kaoi

EXPOSE 4040

# 30s max graceful shutdown handled by the app; tini-style reaping not needed
# as node handles SIGTERM directly.
CMD ["node", "dist/kaoi.js"]
