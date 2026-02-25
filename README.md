# PedalOverPetrol

Courier management system for bicycle/cargo-bike delivery services.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Alembic, JWT |
| **Admin Web** | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Recharts |
| **Customer Portal** | Same Next.js app, separate route group (`/customer/*`) |
| **Driver Mobile** | Expo 52 (React Native), TypeScript, React Navigation 7, TanStack Query |
| **Infra** | Docker Compose (Postgres + backend), Stripe (optional) |

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      FastAPI Backend                             │
│  /api/auth    /api/jobs    /api/drivers    /api/tracking         │
│  /api/analytics    /api/pricing    /api/customer    /api/webhooks│
└──┬──────────────────┬──────────────────────┬─────────────────────┘
   │                  │                      │
   ▼                  ▼                      ▼
┌────────┐    ┌──────────────┐    ┌──────────────────┐
│ Admin  │    │   Customer   │    │  Driver Mobile   │
│  Web   │    │   Portal     │    │  (Expo/RN)       │
│ (Next) │    │   (Next)     │    │                  │
└────────┘    └──────────────┘    └──────────────────┘
```

## Repository Layout

```
pedaloverpetrol/
├── backend/              # FastAPI backend
│   ├── main.py           # App entrypoint
│   ├── src/              # Modules: auth, jobs, drivers, customers, pod,
│   │                     #   pricing, payments, routing, tracking, analytics
│   ├── alembic/          # Database migrations
│   ├── tests/            # pytest test suite (66 tests)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── Makefile          # Dev shortcuts
│   └── requirements.txt
├── web/                  # Next.js admin + customer portal
│   ├── src/app/          # Pages: login, admin/*, customer/*, tracking/*
│   ├── src/components/   # UI primitives + layout components
│   ├── src/lib/          # API clients, auth helpers, utils
│   └── src/types/        # Shared TypeScript interfaces
├── mobile/               # Expo driver app
│   ├── App.tsx           # Root component
│   ├── src/screens/      # Login, JobsList, JobDetail, PODCapture
│   ├── src/api/          # API client + query hooks
│   ├── src/store/        # Auth context, offline queue
│   └── src/services/     # Background location
└── README.md             # ← You are here
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- Docker and Docker Compose (for Postgres)
- Expo CLI (`npx expo`) for mobile development

### 1. Start the Backend

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env — the defaults work for Docker Compose

# Option A: Docker (recommended)
make docker-up
# Backend: http://localhost:8000
# Swagger: http://localhost:8000/docs

# Option B: Local
python3 -m venv .venv && source .venv/bin/activate
make install
# Start Postgres separately, then:
make migrate
make dev
```

### 2. Start the Web App

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
# http://localhost:3000
```

### 3. Start the Driver Mobile App

```bash
cd mobile
cp .env.example .env
npm install
npm start
# Press 'i' for iOS Simulator or 'a' for Android Emulator
```

## Backend Commands (Makefile)

Run from `backend/`:

| Command | Description |
|---------|-------------|
| `make dev` | Start dev server with auto-reload |
| `make test` | Run full test suite (66 tests) |
| `make migrate` | Run Alembic migrations |
| `make docker-up` | Start backend + Postgres via Docker Compose |
| `make docker-down` | Stop Docker Compose services |
| `make install` | Install Python dependencies |
| `make help` | Show all available commands |

## Web Commands

Run from `web/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Mobile Commands

Run from `mobile/`:

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start on iOS Simulator |
| `npm run android` | Start on Android Emulator |
| `npm run typecheck` | Run TypeScript type checker |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET_KEY` | Yes | Secret for refresh tokens |
| `FIRST_ADMIN_EMAIL` | No | Bootstrap admin email |
| `FIRST_ADMIN_PASSWORD` | No | Bootstrap admin password |
| `STRIPE_SECRET_KEY` | No | Stripe API key (blank = stub mode) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `LOG_LEVEL` | No | Logging level (default: INFO) |

### Web (`web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (default: http://localhost:8000) |

### Mobile (`mobile/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend URL (see `.env.example` for device-specific values) |

## API Overview

All errors return a standardized envelope: `{"error": {"code": "not_found", "message": "Job not found"}}`

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Admin | Create user |
| POST | `/api/auth/login` | Public | Login → access + refresh tokens |

### Jobs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/jobs` | Auth | List jobs (filter by status, date) |
| POST | `/api/jobs` | Auth | Create job |
| GET | `/api/jobs/{id}` | Auth | Get job |
| PATCH | `/api/jobs/{id}` | Auth | Update job (state machine enforced) |
| POST | `/api/jobs/{id}/assign` | Auth | Assign driver |
| POST | `/api/jobs/{id}/pod` | Auth | Submit proof of delivery |

### Customer Portal
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/customer/auth/login` | Public | Customer login |
| GET | `/api/customer/jobs` | Customer | List own jobs |
| GET | `/api/customer/jobs/{id}/pod` | Customer | Get POD |
| GET | `/api/customer/jobs/{id}/invoice` | Customer | Get invoice |
| POST | `/api/customer/jobs/{id}/create-payment-intent` | Customer | Start payment |

### Other
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tracking/{tracking_id}` | Public | Track job status |
| GET | `/api/analytics/summary` | Auth | Dashboard metrics |
| GET | `/api/analytics/by-day` | Auth | Daily job counts |
| GET | `/api/analytics/by-driver` | Auth | Driver performance |
| GET/POST/PATCH | `/api/pricing/rules` | Auth | Pricing CRUD |
| POST | `/api/pricing/quote` | Auth | Price calculator |
| POST | `/api/drivers/{id}/optimize-route` | Auth | Route optimization |
| POST | `/api/drivers/{id}/apply-route` | Auth | Apply optimized sequence |
| POST | `/api/webhooks/stripe` | Stripe | Payment webhook |

## Job State Machine

```
pending → assigned → picked_up → in_transit → delivered
                                              → failed
```

## Onboarding Checklist

New developer? Follow these steps to get everything running in ~30 minutes:

1. **Clone the repo**
   ```bash
   git clone https://github.com/ajmarty92/pedaloverpetrol.git
   cd pedaloverpetrol
   ```

2. **Start the backend** (requires Docker)
   ```bash
   cd backend
   cp .env.example .env
   make docker-up
   ```
   Verify: open http://localhost:8000/docs — you should see the Swagger UI.

3. **Run backend tests**
   ```bash
   make install   # one-time, for test deps
   make test      # should see "66 passed"
   ```

4. **Start the web app**
   ```bash
   cd ../web
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```
   Verify: open http://localhost:3000/login — you should see the admin login page.

5. **Start the mobile app** (requires Expo Go on your phone, or a simulator)
   ```bash
   cd ../mobile
   cp .env.example .env
   npm install
   npm start
   ```
   Scan the QR code with Expo Go, or press `i`/`a` for simulator.

6. **Explore the codebase**
   - Backend modules: `backend/src/` — each domain has `models.py`, `schemas.py`, `service.py`, `routes.py`
   - Web pages: `web/src/app/` — Next.js App Router with route groups `(admin)`, `(customer)`, `(auth)`
   - Mobile screens: `mobile/src/screens/` — Login, JobsList, JobDetail, PODCapture
   - Types are consistent across all three codebases

7. **Create a test user** (if not using Docker seed)
   ```bash
   # The backend Swagger UI at /docs has a "Try it out" button.
   # POST /api/auth/register with an admin token to create users.
   ```
