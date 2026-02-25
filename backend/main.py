from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.analytics.routes import router as analytics_router
from src.auth.routes import router as auth_router
from src.core.logging import setup_logging
from src.customer_portal.routes import router as customer_portal_router
from src.drivers.routes import router as drivers_router
from src.jobs.routes import router as jobs_router
from src.payments.routes import router as payments_router
from src.pod.routes import router as pod_router
from src.pricing.routes import router as pricing_router
from src.routing.routes import router as routing_router
from src.tracking.routes import router as tracking_router

setup_logging()

app = FastAPI(
    title="Pedal Over Petrol — Courier API",
    version="0.1.0",
    description="Courier management system backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(customer_portal_router)
app.include_router(jobs_router)
app.include_router(drivers_router)
app.include_router(payments_router)
app.include_router(pod_router)
app.include_router(pricing_router)
app.include_router(routing_router)
app.include_router(tracking_router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    code = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
    }.get(exc.status_code, "error")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": detail}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    messages = "; ".join(
        f"{'.'.join(str(l) for l in e['loc'][1:])}: {e['msg']}" for e in exc.errors()
    )
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": messages}},
    )


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}
