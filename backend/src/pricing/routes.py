import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import require_roles
from src.auth.models import User, UserRole
from src.db.session import get_db
from src.pricing import service
from src.pricing.schemas import (
    PriceQuoteRequest,
    PriceQuoteResponse,
    PricingRuleCreate,
    PricingRuleRead,
    PricingRuleUpdate,
)

router = APIRouter(prefix="/api/pricing", tags=["pricing"])

AuthUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.DISPATCHER))]


@router.get("/rules", response_model=list[PricingRuleRead])
async def list_rules(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.list_rules(db)


@router.post("/rules", response_model=PricingRuleRead, status_code=201)
async def create_rule(
    body: PricingRuleCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.create_rule(db, **body.model_dump())


@router.get("/rules/{rule_id}", response_model=PricingRuleRead)
async def get_rule(
    rule_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.get_rule(db, rule_id)


@router.patch("/rules/{rule_id}", response_model=PricingRuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    body: PricingRuleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    return await service.update_rule(db, rule_id, **updates)


@router.post("/quote", response_model=PriceQuoteResponse)
async def quote(
    body: PriceQuoteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.quote_price(db, body)
