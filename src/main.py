from fastapi import FastAPI

from src.jobs.routes import router as jobs_router
from src.tracking.routes import router as tracking_router

app = FastAPI(
    title="Pedal Over Petrol — Courier API",
    version="0.1.0",
    description="Phase 1: Job lifecycle management for the courier system.",
)

app.include_router(jobs_router)
app.include_router(tracking_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
