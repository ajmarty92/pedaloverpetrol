# Deployment Guide

Production deployment steps for PedalOverPetrol.

## Architecture Overview

```
                    ┌──────────────┐
                    │   Vercel /   │
                    │  Fly.io      │   ← Next.js web app
                    │  (web)       │
                    └──────┬───────┘
                           │
┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐
│  Expo /      │    │   Fly.io     │    │  PostgreSQL   │
│  App Store   │───▶│  (backend)   │───▶│  (Fly Postgres│
│  (mobile)    │    │              │    │   or Supabase)│
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 1. Backend (Fly.io)

### Prerequisites
- [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/) installed
- Fly.io account

### Steps

```bash
cd backend

# Create the app (one-time)
fly launch --name pedaloverpetrol-api --region lhr --no-deploy

# Create Postgres (one-time)
fly postgres create --name pedaloverpetrol-db --region lhr
fly postgres attach pedaloverpetrol-db --app pedaloverpetrol-api

# Set secrets
fly secrets set \
  ENVIRONMENT=production \
  JWT_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" \
  JWT_REFRESH_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" \
  CORS_ORIGINS="https://app.pedaloverpetrol.com" \
  ENABLE_DOCS=false \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  --app pedaloverpetrol-api

# Deploy
fly deploy

# Run migrations (after first deploy)
fly ssh console --app pedaloverpetrol-api -C "alembic upgrade head"

# Seed data (optional, for staging)
fly ssh console --app pedaloverpetrol-api -C "python3 seed.py"
```

### Fly.io Config (`fly.toml`)

Create `backend/fly.toml`:

```toml
app = "pedaloverpetrol-api"
primary_region = "lhr"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[checks]
  [checks.health]
    type = "http"
    port = 8000
    path = "/health"
    interval = "30s"
    timeout = "5s"
```

### Health Check

```bash
curl https://pedaloverpetrol-api.fly.dev/health
# {"status":"ok"}
```

---

## 2. Web App (Vercel)

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli) or GitHub integration
- Vercel account

### Steps

```bash
cd web

# Link to Vercel (one-time)
vercel link

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://pedaloverpetrol-api.fly.dev

# Deploy
vercel --prod
```

### Alternative: Fly.io

```bash
cd web

# Build and deploy as Docker container
fly launch --name pedaloverpetrol-web --region lhr
fly deploy
```

Add to `web/Dockerfile` (if using Fly):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_PUBLIC_API_URL=https://pedaloverpetrol-api.fly.dev
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 3. Mobile App (Expo / EAS Build)

### Prerequisites
- [EAS CLI](https://docs.expo.dev/build/introduction/) installed
- Apple Developer account (for iOS)
- Google Play Console (for Android)

### Build for Testing

```bash
cd mobile

# Configure EAS (one-time)
eas build:configure

# Set API URL for production
# Edit app.json or use eas.json environment variables

# Build for internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### EAS Build Config (`eas.json`)

Create `mobile/eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://pedaloverpetrol-api.fly.dev"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://pedaloverpetrol-api.fly.dev"
      }
    }
  }
}
```

### TestFlight (iOS)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Google Play Internal Testing

```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## Environment Variables Reference

### Backend (production)

| Variable | Required | Example |
|----------|----------|---------|
| `ENVIRONMENT` | Yes | `production` |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://...` (auto-set by Fly Postgres) |
| `JWT_SECRET_KEY` | Yes | Random 32+ char string |
| `JWT_REFRESH_SECRET_KEY` | Yes | Random 32+ char string |
| `CORS_ORIGINS` | Yes | `https://app.pedaloverpetrol.com` |
| `ENABLE_DOCS` | Recommended | `false` |
| `STRIPE_SECRET_KEY` | Optional | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Optional | `whsec_...` |
| `LOG_LEVEL` | Optional | `WARNING` |

### Web (production)

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://pedaloverpetrol-api.fly.dev` |

### Mobile (production)

| Variable | Required | Example |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | Yes | `https://pedaloverpetrol-api.fly.dev` |

---

## Pre-deployment Checklist

- [ ] JWT secrets are unique, random, 32+ characters
- [ ] `ENVIRONMENT=production` is set
- [ ] `ENABLE_DOCS=false` is set
- [ ] `CORS_ORIGINS` lists only your actual frontend domains
- [ ] Database migrations are applied (`alembic upgrade head`)
- [ ] HTTPS is enforced (Fly.io does this by default)
- [ ] Stripe webhook endpoint is registered in Stripe Dashboard
- [ ] First admin user is created (via seed or direct SQL)
- [ ] Mobile app points to production API URL
- [ ] Web app points to production API URL

## Monitoring

- Backend health: `GET /health` returns `{"status": "ok"}`
- Fly.io logs: `fly logs --app pedaloverpetrol-api`
- Fly.io metrics: Fly.io dashboard → Monitoring tab
- Stripe events: Stripe Dashboard → Developers → Webhooks
