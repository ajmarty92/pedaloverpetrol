from fastapi import FastAPI

from src.auth.routes import router as auth_router
from src.core.logging import setup_logging
from src.drivers.routes import router as drivers_router
from src.jobs.routes import router as jobs_router
from src.pod.routes import router as pod_router

setup_logging()

app = FastAPI(
    title="Pedal Over Petrol — Courier API",
    version="0.1.0",
    description="Courier management system backend.",
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(drivers_router)
app.include_router(pod_router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}
