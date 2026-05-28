# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/
RUN npm ci
COPY packages/database/ ./packages/database/
COPY apps/api/ ./apps/api/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=@pulse/database
RUN npm run build --workspace=@pulse/api

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

# Create persistent storage folder and fix permission
RUN mkdir -p /app/data && chown -R node:node /app/data
ENV DATABASE_URL="file:/app/data/pulse.db"
ENV PORT=5000
EXPOSE 5000

USER node

# Run migration and start backend
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma && node apps/api/dist/src/main.js"]
