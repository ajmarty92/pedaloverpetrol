# Security

Security posture and hardening notes for the PedalOverPetrol courier system.

## Authentication

| Property | Value |
|----------|-------|
| Algorithm | HS256 JWT |
| Access token TTL | 15 minutes |
| Refresh token TTL | 7 days |
| Password hashing | bcrypt via passlib |
| Token storage (web) | localStorage (separate namespaces for admin/customer) |
| Token storage (mobile) | AsyncStorage |

**Startup validation:** The backend refuses to start in production mode (`ENVIRONMENT=production`) if JWT secrets are still set to their default placeholder values.

### HTTPS

All production deployments MUST use HTTPS. The backend sets `Strict-Transport-Security` headers automatically when `ENVIRONMENT=production`. TLS termination should be handled by the reverse proxy (Fly.io, Vercel, or your load balancer).

## Authorization Model

| Endpoint Group | Allowed Roles |
|----------------|---------------|
| `/api/auth/register` | Admin only |
| `/api/auth/login` | Public (rate-limited) |
| `/api/jobs/*` | Admin, Dispatcher |
| `/api/drivers/*` | Admin, Dispatcher, Driver (own data) |
| `/api/analytics/*` | Admin, Dispatcher |
| `/api/pricing/*` | Admin, Dispatcher |
| `/api/customer/*` | Customer (scoped to own data) |
| `/api/tracking/*` | Public (rate-limited) |
| `/api/webhooks/stripe` | Stripe (signature-verified) |

Customer endpoints verify the JWT `role` claim is `"customer"` AND load the linked `Customer` record. All queries are scoped by `customer_id` — there is no way for a customer to access another customer's data.

## Rate Limiting

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `POST /api/auth/login` | 5/minute per IP | Brute-force protection |
| `POST /api/customer/auth/login` | 5/minute per IP | Brute-force protection |
| `GET /api/tracking/{id}` | 30/minute per IP | Scraping protection |

Rate-limited responses return HTTP 429 with the standard error envelope.

## CORS

CORS origins are configured via the `CORS_ORIGINS` environment variable (comma-separated). Default: `http://localhost:3000`.

In production, set this to your actual frontend domain(s):

```
CORS_ORIGINS=https://app.pedaloverpetrol.com,https://portal.pedaloverpetrol.com
```

Only `Authorization` and `Content-Type` headers are allowed. Only standard HTTP methods (GET, POST, PATCH, PUT, DELETE, OPTIONS) are permitted.

## Security Headers

All responses include:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (production only) |

## Input Validation

- All request bodies are validated by Pydantic schemas with type constraints
- Path parameters use FastAPI's `Path()` with length limits (e.g., tracking_id max 20 chars)
- Query parameters have `ge`/`le` constraints where appropriate
- Invalid inputs return 422 with field-level error messages

## Data Protection

### Passwords
Hashed with bcrypt via passlib. Raw passwords are never stored or logged.

### POD Data
Signature URLs and photo URLs stored in the database are references to external storage. In production:
- Use signed URLs with expiration (e.g., S3 presigned URLs)
- Do not serve POD files from a public bucket
- POD data is only accessible via authenticated customer portal or admin endpoints

### PII in Logs
The logging configuration (`src/core/logging.py`) outputs structured messages to stdout. Secrets are loaded from environment variables and never interpolated into log messages. Request bodies are not logged by default. Avoid adding `print(settings)` or similar debug statements.

### Data Retention
| Data Type | Retention Policy |
|-----------|-----------------|
| Job records | Indefinite (needed for invoicing and disputes) |
| POD data | Minimum 7 years (legal proof of delivery) |
| Tracking history | 90 days (can be archived after) |
| User sessions | Auto-expire via JWT TTL |
| Payment records | Indefinite (Stripe is system of record) |

These policies should be enforced via scheduled cleanup jobs in production. Currently they are documented but not automated.

## API Documentation

Swagger UI and ReDoc are available in development at `/docs` and `/redoc`. In production, set `ENABLE_DOCS=false` to disable API schema exposure.

## Reporting Vulnerabilities

Contact the engineering team directly. Do not open public GitHub issues for security vulnerabilities.
