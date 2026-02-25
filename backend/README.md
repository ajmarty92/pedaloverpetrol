# Pedal Over Petrol — Backend

FastAPI backend for the courier management system.

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with your secrets

docker compose up --build
```

This starts PostgreSQL and the backend with auto-reload. The API is available at `http://localhost:8000`.

Swagger UI: `http://localhost:8000/docs`

## Quick Start (Local)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start Postgres locally, then:
export DATABASE_URL=postgresql+asyncpg://courier:courier@localhost:5432/courier

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

## Running Tests

Tests use an in-memory SQLite database — no external services required.

```bash
pip install -r requirements.txt
python3 -m pytest tests/ -v
```

## Project Structure

```
backend/
├── main.py                 # FastAPI app + router mounting
├── src/
│   ├── core/               # Settings, logging, JWT/password security
│   ├── db/                 # SQLAlchemy base, engine, session
│   ├── auth/               # User model, login/register, JWT dependencies
│   ├── jobs/               # Job model, state machine, CRUD
│   ├── drivers/            # Driver model, CRUD
│   ├── customers/          # Customer model (routes TBD)
│   ├── pod/                # Proof of Delivery model + stub route
│   └── pricing/            # PricingRule model (routes TBD)
├── alembic/                # Database migrations
├── tests/
├── Dockerfile
└── docker-compose.yml
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Admin | Create a new user |
| POST | /api/auth/login | Public | Login, returns access + refresh tokens |
| GET | /api/jobs | Auth | List jobs (filter by status, date) |
| POST | /api/jobs | Auth | Create a job |
| GET | /api/jobs/{id} | Auth | Get job details |
| PATCH | /api/jobs/{id} | Auth | Update job (status transitions enforced) |
| POST | /api/jobs/{id}/assign | Auth | Assign driver to job |
| POST | /api/jobs/{id}/pod | Auth | Submit proof of delivery |
| GET | /api/drivers | Auth | List drivers |
| POST | /api/drivers | Auth | Create driver profile |
| GET | /api/drivers/{id} | Auth | Get driver details |
| PATCH | /api/drivers/{id} | Auth | Update driver (status, info) |

## Job State Machine

```
pending → assigned → picked_up → in_transit → delivered
                                              → failed
```

Invalid transitions return `409 Conflict`.

## Bootstrapping the First Admin

Seed the first admin user via a migration data step or directly in the database, then use the login endpoint to obtain tokens.
