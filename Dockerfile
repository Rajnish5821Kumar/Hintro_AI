# ─────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for Meeting Intelligence Service
# ─────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy prisma schema and generated client
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled JS
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start with dumb-init for proper PID 1 signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
