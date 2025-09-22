# --------------------------------------------------
# Base image
# --------------------------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10 concurrently

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all apps/packages
COPY apps ./apps
COPY packages ./packages

# Install all dependencies in workspace
RUN pnpm install --frozen-lockfile

# --------------------------------------------------
# Build stage
# --------------------------------------------------
FROM base AS build

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build || echo "No backend build needed"

# --------------------------------------------------
# Production stage
# --------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm + concurrently
RUN npm install -g pnpm@10 concurrently

# Copy built artifacts + node_modules
COPY --from=build /app ./

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Start frontend and backend concurrently
CMD concurrently \
  "pnpm --filter ./apps/backend... start" \
  "pnpm --filter ./apps/frontend... start"
