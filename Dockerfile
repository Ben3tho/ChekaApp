# Stage 1: Build TypeScript & Vite Client
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend & bundle Express server for production
RUN npm run build && npx esbuild server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# Stage 2: Production Slim Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend assets and bundled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/package.json ./package.json

# Expose standard Cloud Run port
EXPOSE 3000

# Start production server (serves frontend, API routes, and connects to Cloud SQL)
CMD ["node", "dist/server.js"]
