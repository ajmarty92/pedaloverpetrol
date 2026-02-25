import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.pricing.engine import PriceBreakdown, compute_price
from src.pricing.models import PricingRule
from src.pricing.schemas import PriceQuoteRequest, PriceQuoteResponse


async def create_rule(db: AsyncSession, **kwargs) -> PricingRule:
    rule = PricingRule(**kwargs)
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


async def get_rule(db: AsyncSession, rule_id: uuid.UUID) -> PricingRule:
    result = await db.execute(select(PricingRule).where(PricingRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")
    return rule


async def list_rules(db: AsyncSession) -> list[PricingRule]:
    result = await db.execute(select(PricingRule).order_by(PricingRule.created_at.desc()))
    return list(result.scalars().all())


async def update_rule(db: AsyncSession, rule_id: uuid.UUID, **kwargs) -> PricingRule:
    rule = await get_rule(db, rule_id)
    for k, v in kwargs.items():
        if v is not None:
            setattr(rule, k, v)
    await db.flush()
    await db.refresh(rule)
    return rule


async def get_active_rule(db: AsyncSession) -> PricingRule:
    result = await db.execute(
        select(PricingRule).where(PricingRule.active == True).limit(1)  # noqa: E712
    )
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active pricing rule configured",
        )
    return rule


async def quote_price(
    db: AsyncSession, req: PriceQuoteRequest, rule_id: uuid.UUID | None = None,
) -> PriceQuoteResponse:
    rule = await get_rule(db, rule_id) if rule_id else await get_active_rule(db)

    breakdown = compute_price(
        rule_name=rule.rule_name,
        base_rate=float(rule.base_rate),
        per_mile_rate=float(rule.per_mile_rate),
        rush_surcharge_rate=float(rule.rush_surcharge),
        heavy_surcharge_rate=float(rule.heavy_surcharge),
        zone_config=rule.zone_config,
        distance_miles=req.distance_miles,
        is_rush=req.is_rush,
        is_heavy=req.is_heavy,
        zone=req.zone,
    )

    return PriceQuoteResponse(
        rule_name=breakdown.rule_name,
        base_rate=breakdown.base_rate,
        distance_charge=breakdown.distance_charge,
        rush_surcharge=breakdown.rush_surcharge,
        heavy_surcharge=breakdown.heavy_surcharge,
        zone_multiplier=breakdown.zone_multiplier,
        total=breakdown.total,
        breakdown=breakdown.breakdown_text,
    )
