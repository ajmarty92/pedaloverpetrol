# Pedal Over Petrol — Courier API

Phase 1: Job lifecycle management for the courier system.

## Stack

- **FastAPI** — async web framework
- **PostgreSQL** + **SQLAlchemy 2.0** (async) — database
- **Alembic** — migrations
- **Pydantic v2** — request/response validation
- **python-jose** — JWT authentication

## Quick Start

```bash
pip install -r requirements.txt

# Set environment variables (or create .env)
export COURIER_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/courier
export COURIER_JWT_SECRET_KEY=your-secret-key

# Run migrations
alembic upgrade head

# Start the server
uvicorn src.main:app --reload
```

## Project Structure

```
src/
├── main.py                 # FastAPI app entry point
├── config.py               # Settings via pydantic-settings
├── database.py             # Async engine & session
├── models/                 # SQLAlchemy ORM models
│   ├── user.py             # User (with roles: admin, dispatcher, driver, customer)
│   ├── driver.py           # Driver → FK to User
│   ├── customer.py         # Customer
│   ├── job.py              # Job (with status enum & state machine)
│   ├── pod.py              # Proof of Delivery
│   └── pricing_rule.py     # Pricing rules
├── schemas/                # Pydantic v2 schemas
├── auth/                   # JWT auth + role-based dependencies
├── jobs/                   # Job lifecycle service + routes
│   ├── service.py          # State machine + CRUD logic
│   └── routes.py           # API endpoints
└── tracking/               # Public tracking endpoint
    └── routes.py
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/jobs` | Admin/Dispatcher | Create a new job (status=pending) |
| `GET` | `/api/jobs` | Admin/Dispatcher | List jobs (filter by status, date) |
| `GET` | `/api/jobs/{job_id}` | Admin/Dispatcher | Get job details |
| `PATCH` | `/api/jobs/{job_id}` | Admin/Dispatcher | Update job details + status |
| `POST` | `/api/jobs/{job_id}/assign` | Admin/Dispatcher | Assign driver, set status=assigned |
| `GET` | `/api/tracking/{tracking_id}` | Public | Track job by tracking ID |
| `GET` | `/health` | Public | Health check |

## Job State Machine

```
pending → assigned → picked_up → in_transit → delivered
                                             → failed
```

Invalid transitions return `409 Conflict` with a descriptive error message.

## Running Tests

```bash
python3 -m pytest tests/ -v
```

Tests use an in-memory SQLite database and cover:
- Job creation and CRUD
- Full lifecycle walk-through (delivered and failed paths)
- Invalid state transitions (all rejected with 409)
- Public tracking endpoint
- Auth/role enforcement
