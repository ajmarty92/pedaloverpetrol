import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.core.security import create_access_token, create_refresh_token, verify_password
from src.customers.models import Customer
from src.jobs.models import Job
from src.pod.models import ProofOfDelivery

from src.customer_portal.schemas import (
    CustomerJobRead,
    CustomerTokenResponse,
    InvoiceRead,
    PODRead,
)


async def authenticate_customer(db: AsyncSession, *, email: str, password: str) -> CustomerTokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    if user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a customer account")

    result = await db.execute(select(Customer).where(Customer.user_id == user.id))
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No customer profile linked")

    return CustomerTokenResponse(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id)),
        customer_name=customer.name,
    )


async def list_customer_jobs(
    db: AsyncSession, customer_id: uuid.UUID, *, skip: int = 0, limit: int = 50,
) -> list[CustomerJobRead]:
    result = await db.execute(
        select(Job)
        .where(Job.customer_id == customer_id)
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    jobs = result.scalars().all()

    out: list[CustomerJobRead] = []
    for j in jobs:
        delivered_at = j.pod.delivered_at if j.pod else None
        out.append(CustomerJobRead(
            id=j.id,
            tracking_id=j.tracking_id,
            pickup_address=j.pickup_address,
            dropoff_address=j.dropoff_address,
            status=j.status,
            price=j.price,
            payment_status=j.payment_status,
            notes=j.notes,
            created_at=j.created_at,
            updated_at=j.updated_at,
            delivered_at=delivered_at,
            has_pod=j.pod is not None,
        ))
    return out


async def get_customer_job(
    db: AsyncSession, customer_id: uuid.UUID, job_id: uuid.UUID,
) -> Job:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.customer_id == customer_id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


async def get_pod_for_customer_job(
    db: AsyncSession, customer_id: uuid.UUID, job_id: uuid.UUID,
) -> PODRead:
    job = await get_customer_job(db, customer_id, job_id)

    if job.pod is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No proof of delivery for this job")

    return PODRead(
        id=job.pod.id,
        job_id=job.pod.job_id,
        recipient_name=job.pod.recipient_name,
        signature_url=job.pod.signature_url,
        photo_urls=job.pod.photo_urls,
        delivered_at=job.pod.delivered_at,
        gps_lat=job.pod.gps_lat,
        gps_lng=job.pod.gps_lng,
    )


async def get_invoice_for_customer_job(
    db: AsyncSession, customer_id: uuid.UUID, job_id: uuid.UUID,
) -> InvoiceRead:
    job = await get_customer_job(db, customer_id, job_id)

    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one()

    delivered_at = job.pod.delivered_at if job.pod else None

    return InvoiceRead(
        job_id=job.id,
        tracking_id=job.tracking_id,
        customer_name=customer.name,
        pickup_address=job.pickup_address,
        dropoff_address=job.dropoff_address,
        status=job.status.value,
        price=job.price,
        created_at=job.created_at,
        delivered_at=delivered_at,
    )
