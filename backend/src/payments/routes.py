import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.customer_portal.dependencies import get_current_customer
from src.customers.models import Customer
from src.db.session import get_db
from src.payments import service
from src.payments.schemas import CreatePaymentIntentResponse

router = APIRouter(tags=["payments"])

CustUser = Annotated[Customer, Depends(get_current_customer)]


@router.post(
    "/api/customer/jobs/{job_id}/create-payment-intent",
    response_model=CreatePaymentIntentResponse,
)
async def create_payment_intent(
    job_id: uuid.UUID,
    customer: CustUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_payment_intent(db, customer.id, job_id)


@router.post("/api/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    stripe_signature: str = Header(default=""),
):
    payload = await request.body()
    return await service.handle_stripe_webhook(db, payload, stripe_signature)
