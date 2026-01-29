# =====================================
# QuickPrint Async Worker - Dockerfile
# =====================================
# Multi-stage build for optimized production image

# ----- Stage 1: Dependencies -----
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies required for native modules and Prisma
RUN apk add --no-cache python3 make g++ libc6-compat openssl openssl-dev

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ----- Stage 2: Builder -----
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ----- Stage 3: Production -----
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules

# Set ownership
RUN chown -R worker:nodejs /app

# Switch to non-root user
USER worker

# Start command
CMD ["node", "dist/worker.js"]

