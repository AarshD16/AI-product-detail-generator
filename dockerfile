# -------------------------
# Base builder
# -------------------------
FROM node:20-slim AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# -------------------------
# Build
# -------------------------
FROM deps AS build
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm install --frozen-lockfile
RUN pnpm build

# -------------------------
# Runtime
# -------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm concurrently

# Copy everything
COPY --from=build /app .

# Expose both ports
EXPOSE 3000
EXPOSE 4000

# Start backend on 4000 and frontend on 3000
CMD ["concurrently", \
  "pnpm --prefix apps/backend start", \
  "pnpm --prefix apps/frontend start"]
