# syntax=docker/dockerfile:1.7
# Multi-stage build for the Quality Buddy webapp.
# Stage 1: install all deps and build the React frontend.
# Stage 2: minimal runtime image with only the backend + built assets.

# ---------- Stage 1: build ----------
FROM node:26.5.0-alpine3.24 AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

# Install full deps (including devDependencies for the frontend build)
RUN npm ci --no-audit --no-fund

# Copy source
COPY backend/ backend/
COPY frontend/ frontend/

# Build the React app
RUN npm run build

# Prune devDependencies so we copy a clean node_modules to the runtime image
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:26.5.0-alpine3.24 AS runtime

# better-sqlite3 needs a working C toolchain at install time, plus these at
# runtime. The prebuilt binaries in the builder stage already work without
# a compiler, but we keep build-essential here only as a safety net.
# Actually we just copy the prebuilt binaries from the builder, so no
# compiler is needed in this stage.

WORKDIR /app

# Run as a non-root user
RUN addgroup -S app && adduser -S -G app -h /app -s /sbin/nologin -D app \
    && mkdir -p /app/data \
    && chown -R app:app /app

ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    QB_DB_PATH=/app/data/quality-buddy.db

# Copy only what the runtime needs
COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json* ./
COPY --from=builder --chown=app:app /app/node_modules node_modules/
COPY --from=builder --chown=app:app /app/backend backend/
COPY --from=builder --chown=app:app /app/frontend/dist frontend/dist/

USER app

EXPOSE 3001

# Sensible health check: hit /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
