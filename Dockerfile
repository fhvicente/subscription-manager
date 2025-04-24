FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY backend/ ./
# Create an empty .env file if it doesn't exist
RUN touch .env
RUN npx prisma generate || true
RUN npm run build

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./

# Build frontend with production env
RUN cp .env.production .env.local || true
RUN npm run build

# Final image
FROM nginx:alpine

# Install Node.js
RUN apk add --update nodejs npm

WORKDIR /app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Copy backend
COPY --from=backend-builder /app/backend/dist /app/backend/
# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/backend/data
RUN chown -R 1000:1000 /app/backend/data
RUN chmod -R 777 /app/backend/data

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
# Copy env file
COPY --from=frontend-builder /app/frontend/.env.production /app/frontend/.env.local

# Verify the file exists and is executable
RUN ls -la /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]