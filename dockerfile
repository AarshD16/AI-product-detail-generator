# -----------------------------
# Base image for building
# -----------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm and concurrently globally
RUN npm install -g pnpm@10 concurrently

# Copy workspace files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install

# -----------------------------
# Build stage
# -----------------------------
FROM base AS build
WORKDIR /app

# Build frontend and backend
RUN pnpm --filter ./apps/frontend... build
RUN pnpm --filter ./apps/backend... build

# -----------------------------
# Production stage
# -----------------------------
FROM node:20-slim AS runner
WORKDIR /app

RUN npm install -g pnpm@10 concurrently

# Copy built artifacts
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps

# Expose only $PORT (frontend)
EXPOSE 3000

# Render sets $PORT automatically
ENV BACKEND_PORT=4000

# Run both apps:
# - frontend binds $PORT (Render requirement)
# - backend binds 4000 (internal only)
CMD sh -c "\
  pnpm --filter ./apps/backend... start & \
  pnpm --filter ./apps/frontend... start -- --port $PORT \
"
