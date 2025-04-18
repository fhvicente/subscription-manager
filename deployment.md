# Deployment Configuration for Gestor Simples de Assinaturas

This document outlines the deployment configuration for the Gestor Simples de Assinaturas application.

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestor_assinaturas

# Server
PORT=3001
NODE_ENV=production
API_URL=https://api.gestor-assinaturas.com

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=notifications@gestor-assinaturas.com

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_monthly_id
STRIPE_YEARLY_PRICE_ID=price_yearly_id

# Cron Jobs
CRON_API_KEY=your_secure_cron_api_key

# CORS
FRONTEND_URL=https://gestor-assinaturas.com
```

### Frontend (.env.production)
```
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# API
NEXT_PUBLIC_API_URL=https://api.gestor-assinaturas.com

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=gestor-assinaturas.com
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

## Docker Configuration

### Backend Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/index.js"]
```

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: gestor_assinaturas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gestor_assinaturas
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    restart: always

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
    restart: always

volumes:
  postgres_data:
```

## Deployment Instructions

1. Set up environment variables in production environment
2. Build Docker images for backend and frontend
3. Run database migrations with `npx prisma migrate deploy`
4. Start the application with Docker Compose
5. Configure Nginx or other reverse proxy for SSL termination
6. Set up monitoring and logging

## CI/CD Pipeline Configuration (GitHub Actions)

```yaml
name: Deploy Gestor Simples de Assinaturas

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install backend dependencies
        run: cd backend && npm ci
      - name: Run backend tests
        run: cd backend && npm test
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      - name: Run frontend tests
        run: cd frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: yourusername/gestor-assinaturas-backend:latest
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: yourusername/gestor-assinaturas-frontend:latest
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/gestor-assinaturas
            docker-compose pull
            docker-compose up -d
```

## Scaling Considerations

- Use a managed PostgreSQL service for production (e.g., AWS RDS, DigitalOcean Managed Databases)
- Implement Redis for caching and session management
- Set up load balancing for horizontal scaling
- Configure auto-scaling based on traffic patterns
- Implement database read replicas for high-traffic scenarios
