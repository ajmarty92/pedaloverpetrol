import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.customers.models import Customer
from src.customer_portal import service
from src.customer_portal.dependencies import get_current_customer
from src.customer_portal.schemas import (
    CustomerJobRead,
    CustomerLoginRequest,
    CustomerTokenResponse,
    InvoiceRead,
    PODRead,
)
from src.db.session import get_db

router = APIRouter(prefix="/api/customer", tags=["customer-portal"])

CustUser = Annotated[Customer, Depends(get_current_customer)]


@router.post("/auth/login", response_model=CustomerTokenResponse)
async def customer_login(
    body: CustomerLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.authenticate_customer(db, email=body.email, password=body.password)


@router.get("/jobs", response_model=list[CustomerJobRead])
async def list_my_jobs(
    customer: CustUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    return await service.list_customer_jobs(db, customer.id, skip=skip, limit=limit)


@router.get("/jobs/{job_id}/pod", response_model=PODRead)
async def get_job_pod(
    job_id: uuid.UUID,
    customer: CustUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_pod_for_customer_job(db, customer.id, job_id)


@router.get("/jobs/{job_id}/invoice", response_model=InvoiceRead)
async def get_job_invoice(
    job_id: uuid.UUID,
    customer: CustUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_invoice_for_customer_job(db, customer.id, job_id)
