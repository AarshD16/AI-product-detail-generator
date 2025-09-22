# --------------------------------------------------
# Base image
# --------------------------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10 concurrently

# Copy workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install all dependencies in workspace
RUN pnpm install

# --------------------------------------------------
# Build stage
# --------------------------------------------------
FROM base AS build

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# --------------------------------------------------
# Production stage
# --------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm and concurrently in runner
RUN npm install -g pnpm@10 concurrently

# Copy node_modules from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy built frontend and backend
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Copy all packages and source files (needed for runtime)
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps

# Expose ports
EXPOSE 3000
EXPOSE 4000

# Start both frontend and backend concurrently
CMD concurrently \
  "pnpm --filter ./apps/backend... start" \
  "pnpm --filter ./apps/frontend... start"
