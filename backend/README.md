# PedalOverPetrol — Backend

FastAPI backend for the courier management system.

## Quick Start (Docker)

```bash
cp .env.example .env
make docker-up
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Postgres: `localhost:5432` (user: `courier`, db: `courier`)

## Quick Start (Local)

```bash
python3 -m venv .venv && source .venv/bin/activate
make install
# Start Postgres locally, then update DATABASE_URL in .env
make migrate
make dev
```

## Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start dev server (uvicorn --reload) |
| `make test` | Run test suite (66 tests, in-memory SQLite) |
| `make migrate` | Run Alembic migrations to latest |
| `make docker-up` | Start backend + Postgres via Docker Compose |
| `make docker-down` | Stop Docker Compose services |
| `make install` | Install Python dependencies |
| `make help` | Show all commands |

## Project Structure

```
backend/
├── main.py                 # FastAPI app + global error handlers
├── Makefile                # Dev shortcuts
├── src/
│   ├── core/               # Settings, logging, JWT + bcrypt security
│   ├── db/                 # SQLAlchemy base, async engine, session
│   ├── auth/               # User model, login/register, JWT dependencies
│   ├── jobs/               # Job model, state machine, CRUD routes
│   ├── drivers/            # Driver model, CRUD, location
│   ├── customers/          # Customer model (with portal user link)
│   ├── customer_portal/    # Customer self-service: auth, jobs, POD, invoice
│   ├── pod/                # Proof of Delivery model + route
│   ├── pricing/            # PricingRule model, pricing engine, CRUD + quote
│   ├── payments/           # Stripe integration (stub + live modes)
│   ├── routing/            # Route optimization (nearest-neighbor engine)
│   ├── tracking/           # Public tracking endpoint
│   └── analytics/          # Summary, by-day, by-driver analytics
├── alembic/                # Database migrations (001–004)
├── tests/                  # 66 tests across 7 test files
├── Dockerfile
└── docker-compose.yml
```

## Error Response Format

All errors return a standardized JSON envelope:

```json
{
  "error": {
    "code": "not_found",
    "message": "Job not found"
  }
}
```

## Tests

Tests use an in-memory SQLite database — no external services required.

```bash
make test
```

Coverage: auth (7), jobs (9), tracking (5), routing (13), analytics (7), customer portal (10), pricing + payments (15).
