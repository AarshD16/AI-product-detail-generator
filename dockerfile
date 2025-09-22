# --------------------------------------------------
# Base image
# --------------------------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10

# Copy workspace metadata
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# --------------------------------------------------
# Install dependencies
# --------------------------------------------------
COPY apps ./apps
RUN pnpm install --frozen-lockfile

# --------------------------------------------------
# Build stage
# --------------------------------------------------
FROM base AS build

# Build frontend
RUN pnpm --filter ./apps/frontend... build

# Build backend
RUN pnpm --filter ./apps/backend... build || echo "No backend build needed"

# --------------------------------------------------
# Production stage
# --------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10 concurrently

# Copy built artifacts and node_modules
COPY --from=build /app ./

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Start both frontend and backend concurrently
CMD concurrently \
  "pnpm --filter ./apps/backend... start" \
  "pnpm --filter ./apps/frontend... start"
