# apps/web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY apps/web/ ./apps/web/
ENV NEXT_PUBLIC_API_URL="http://localhost:5000"
RUN npm run build --workspace=@pulse/web

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci --omit=dev
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/app ./apps/web/app
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
USER node
CMD ["npm", "start", "--workspace=@pulse/web"]
