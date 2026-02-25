"""Tests for pricing engine, pricing CRUD, and payment flow."""

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.core.security import create_access_token, hash_password
from src.customers.models import Customer
from src.pricing.engine import compute_price

pytestmark = pytest.mark.asyncio


# ── Pricing engine unit tests ────────────────────────────────────────────


class TestPricingEngine:
    def test_base_rate_only(self):
        r = compute_price(
            rule_name="basic", base_rate=5.0, per_mile_rate=0, rush_surcharge_rate=0,
            heavy_surcharge_rate=0, zone_config=None, distance_miles=0,
        )
        assert r.total == 5.0

    def test_distance_charge(self):
        r = compute_price(
            rule_name="std", base_rate=5.0, per_mile_rate=2.0, rush_surcharge_rate=0,
            heavy_surcharge_rate=0, zone_config=None, distance_miles=10,
        )
        assert r.total == 25.0
        assert r.distance_charge == 20.0

    def test_rush_surcharge(self):
        r = compute_price(
            rule_name="std", base_rate=5.0, per_mile_rate=1.0, rush_surcharge_rate=3.0,
            heavy_surcharge_rate=0, zone_config=None, distance_miles=5, is_rush=True,
        )
        assert r.rush_surcharge == 3.0
        assert r.total == 13.0

    def test_heavy_surcharge(self):
        r = compute_price(
            rule_name="std", base_rate=5.0, per_mile_rate=0, rush_surcharge_rate=0,
            heavy_surcharge_rate=7.50, zone_config=None, distance_miles=0, is_heavy=True,
        )
        assert r.total == 12.50

    def test_zone_multiplier(self):
        config = {"zones": {"zone_a": 1.0, "zone_b": 1.5}}
        r = compute_price(
            rule_name="zoned", base_rate=10.0, per_mile_rate=0, rush_surcharge_rate=0,
            heavy_surcharge_rate=0, zone_config=config, distance_miles=0, zone="zone_b",
        )
        assert r.zone_multiplier == 1.5
        assert r.total == 15.0

    def test_unknown_zone_defaults_to_1(self):
        config = {"zones": {"zone_a": 1.2}}
        r = compute_price(
            rule_name="zoned", base_rate=10.0, per_mile_rate=0, rush_surcharge_rate=0,
            heavy_surcharge_rate=0, zone_config=config, distance_miles=0, zone="zone_x",
        )
        assert r.zone_multiplier == 1.0
        assert r.total == 10.0

    def test_full_calculation(self):
        config = {"zones": {"downtown": 1.2}}
        r = compute_price(
            rule_name="full", base_rate=5.0, per_mile_rate=2.0, rush_surcharge_rate=3.0,
            heavy_surcharge_rate=4.0, zone_config=config, distance_miles=10,
            is_rush=True, is_heavy=True, zone="downtown",
        )
        assert r.total == round((5 + 20 + 3 + 4) * 1.2, 2)

    def test_breakdown_text(self):
        r = compute_price(
            rule_name="test", base_rate=5.0, per_mile_rate=1.0, rush_surcharge_rate=2.0,
            heavy_surcharge_rate=0, zone_config=None, distance_miles=3, is_rush=True,
        )
        assert "Base: $5.00" in r.breakdown_text
        assert "Rush: +$2.00" in r.breakdown_text
        assert "Total:" in r.breakdown_text


# ── Pricing CRUD endpoint tests ──────────────────────────────────────────


class TestPricingCRUD:
    async def test_create_and_list_rules(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.post(
            "/api/pricing/rules",
            json={"rule_name": "Standard", "base_rate": 5.0, "per_mile_rate": 1.50},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        rule = resp.json()
        assert rule["rule_name"] == "Standard"
        assert rule["base_rate"] == 5.0

        resp = await client.get("/api/pricing/rules", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_update_rule(self, client: AsyncClient, admin_headers: dict):
        resp = await client.post(
            "/api/pricing/rules",
            json={"rule_name": "Editable", "base_rate": 3.0, "per_mile_rate": 1.0},
            headers=admin_headers,
        )
        rule_id = resp.json()["id"]

        resp = await client.patch(
            f"/api/pricing/rules/{rule_id}",
            json={"base_rate": 6.0, "rush_surcharge": 2.5},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["base_rate"] == 6.0
        assert resp.json()["rush_surcharge"] == 2.5

    async def test_price_quote(self, client: AsyncClient, admin_headers: dict):
        await client.post(
            "/api/pricing/rules",
            json={"rule_name": "QuoteRule", "base_rate": 5.0, "per_mile_rate": 2.0, "active": True},
            headers=admin_headers,
        )

        resp = await client.post(
            "/api/pricing/quote",
            json={"distance_miles": 10, "is_rush": False, "is_heavy": False},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 25.0
        assert "breakdown" in data


# ── Payment flow tests (stub mode) ──────────────────────────────────────


@pytest_asyncio.fixture()
async def customer_user_for_pay(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(), email="pay@corp.com",
        password_hash=hash_password("paypass123"), role=UserRole.CUSTOMER,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture()
async def paying_customer(db_session: AsyncSession, customer_user_for_pay: User) -> Customer:
    cust = Customer(
        id=uuid.uuid4(), user_id=customer_user_for_pay.id,
        name="Paying Corp", email="pay@corp.com",
    )
    db_session.add(cust)
    await db_session.commit()
    return cust


@pytest_asyncio.fixture()
def pay_headers(customer_user_for_pay: User) -> dict[str, str]:
    token = create_access_token(str(customer_user_for_pay.id), customer_user_for_pay.role.value)
    return {"Authorization": f"Bearer {token}"}


class TestPaymentFlow:
    async def test_create_payment_intent_stub(
        self,
        client: AsyncClient,
        admin_headers: dict,
        pay_headers: dict,
        paying_customer: Customer,
    ):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(paying_customer.id),
                "pickup_address": "A", "dropoff_address": "B", "price": 25.50,
            },
            headers=admin_headers,
        )
        job = resp.json()

        resp = await client.post(
            f"/api/customer/jobs/{job['id']}/create-payment-intent",
            headers=pay_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["mode"] == "stub"
        assert data["amount"] == 2550
        assert data["currency"] == "usd"
        assert "client_secret" in data

        resp = await client.get(f"/api/jobs/{job['id']}", headers=admin_headers)
        assert resp.json()["payment_status"] == "paid"

    async def test_cannot_pay_already_paid(
        self,
        client: AsyncClient,
        admin_headers: dict,
        pay_headers: dict,
        paying_customer: Customer,
    ):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(paying_customer.id),
                "pickup_address": "A", "dropoff_address": "B", "price": 10.0,
            },
            headers=admin_headers,
        )
        job = resp.json()

        await client.post(f"/api/customer/jobs/{job['id']}/create-payment-intent", headers=pay_headers)
        resp = await client.post(f"/api/customer/jobs/{job['id']}/create-payment-intent", headers=pay_headers)
        assert resp.status_code == 409

    async def test_cannot_pay_without_price(
        self,
        client: AsyncClient,
        admin_headers: dict,
        pay_headers: dict,
        paying_customer: Customer,
    ):
        resp = await client.post(
            "/api/jobs",
            json={"customer_id": str(paying_customer.id), "pickup_address": "A", "dropoff_address": "B"},
            headers=admin_headers,
        )
        job = resp.json()

        resp = await client.post(f"/api/customer/jobs/{job['id']}/create-payment-intent", headers=pay_headers)
        assert resp.status_code == 422

    async def test_admin_sees_payment_status(
        self,
        client: AsyncClient,
        admin_headers: dict,
        pay_headers: dict,
        paying_customer: Customer,
    ):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(paying_customer.id),
                "pickup_address": "A", "dropoff_address": "B", "price": 15.0,
            },
            headers=admin_headers,
        )
        job = resp.json()
        assert job["payment_status"] == "unpaid"

        await client.post(f"/api/customer/jobs/{job['id']}/create-payment-intent", headers=pay_headers)

        resp = await client.get(f"/api/jobs/{job['id']}", headers=admin_headers)
        assert resp.json()["payment_status"] == "paid"
