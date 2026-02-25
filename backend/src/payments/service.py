"""Payment service — Stripe integration with stub fallback.

When STRIPE_SECRET_KEY is configured, creates real Stripe PaymentIntents.
When empty (dev/test), operates in stub mode: immediately marks jobs as paid
and returns a mock client_secret so the frontend flow still works end-to-end.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.settings import settings
from src.jobs.models import Job, PaymentStatus
from src.payments.schemas import CreatePaymentIntentResponse


def _stripe_configured() -> bool:
    return bool(settings.stripe_secret_key)


async def create_payment_intent(
    db: AsyncSession, customer_id: uuid.UUID, job_id: uuid.UUID,
) -> CreatePaymentIntentResponse:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.customer_id == customer_id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.price is None or job.price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Job has no price set",
        )

    if job.payment_status == PaymentStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is already paid",
        )

    amount_cents = int(round(float(job.price) * 100))

    if _stripe_configured():
        import stripe
        stripe.api_key = settings.stripe_secret_key

        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={"job_id": str(job_id)},
        )
        job.stripe_payment_intent_id = intent.id
        job.payment_status = PaymentStatus.PENDING
        await db.flush()

        return CreatePaymentIntentResponse(
            client_secret=intent.client_secret,
            amount=amount_cents,
            currency="usd",
            mode="live",
        )

    job.payment_status = PaymentStatus.PAID
    job.stripe_payment_intent_id = f"stub_pi_{uuid.uuid4().hex[:16]}"
    await db.flush()

    return CreatePaymentIntentResponse(
        client_secret=f"stub_secret_{job.stripe_payment_intent_id}",
        amount=amount_cents,
        currency="usd",
        mode="stub",
    )


async def handle_stripe_webhook(db: AsyncSession, payload: bytes, sig_header: str) -> dict:
    """Process a Stripe webhook event. Returns a status dict."""
    if not _stripe_configured():
        return {"status": "ignored", "reason": "stripe not configured"}

    import stripe
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        job_id = pi.get("metadata", {}).get("job_id")
        if job_id:
            result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
            job = result.scalar_one_or_none()
            if job:
                job.payment_status = PaymentStatus.PAID
                await db.flush()

    elif event["type"] == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        job_id = pi.get("metadata", {}).get("job_id")
        if job_id:
            result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
            job = result.scalar_one_or_none()
            if job:
                job.payment_status = PaymentStatus.FAILED
                await db.flush()

    return {"status": "processed", "type": event["type"]}
