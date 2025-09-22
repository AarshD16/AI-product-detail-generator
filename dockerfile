# --------------------------------------------------
# Base image
# --------------------------------------------------
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm and concurrently globally
RUN npm install -g pnpm@10 concurrently

# Copy workspace metadata first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all apps and packages
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install

# --------------------------------------------------
# Build stage
# --------------------------------------------------
FROM base AS build

WORKDIR /app

# Build frontend
RUN pnpm --filter ./apps/frontend... build

# Build backend
RUN pnpm --filter ./apps/backend... build

# --------------------------------------------------
# Production / Runner stage
# --------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm and concurrently globally
RUN npm install -g pnpm@10 concurrently

# Copy built frontend and backend, plus node_modules
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Expose frontend and backend ports
EXPOSE 3000
EXPOSE 4000

# Start both frontend and backend concurrently
CMD concurrently \
  "pnpm --filter ./apps/backend... start" \
  "pnpm --filter ./apps/frontend... start"
