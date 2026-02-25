import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.db.session import get_db
from src.jobs.models import Job
from src.pod.models import ProofOfDelivery
from src.pod.schemas import PODCreate, PODRead

router = APIRouter(prefix="/api/jobs", tags=["pod"])

AuthUser = Annotated[User, Depends(get_current_user)]


@router.post("/{job_id}/pod", response_model=PODRead, status_code=201)
async def create_pod(
    job_id: uuid.UUID,
    body: PODCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    result = await db.execute(select(ProofOfDelivery).where(ProofOfDelivery.job_id == job_id))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="POD already exists for this job")

    pod = ProofOfDelivery(
        job_id=job_id,
        recipient_name=body.recipient_name,
        signature_url=body.signature_url,
        photo_urls=body.photo_urls,
        gps_lat=body.gps_lat,
        gps_lng=body.gps_lng,
    )
    db.add(pod)
    await db.flush()
    await db.refresh(pod)
    return pod
