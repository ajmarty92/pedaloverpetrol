"""Tests for the customer self-service portal endpoints."""

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.core.security import create_access_token, hash_password
from src.customers.models import Customer
from src.drivers.models import Driver
from src.pod.models import ProofOfDelivery

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture()
async def customer_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="customer@testcorp.com",
        password_hash=hash_password("custpass123"),
        role=UserRole.CUSTOMER,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture()
async def linked_customer(db_session: AsyncSession, customer_user: User) -> Customer:
    cust = Customer(
        id=uuid.uuid4(),
        user_id=customer_user.id,
        name="Test Corp",
        phone="555-0100",
        email="customer@testcorp.com",
    )
    db_session.add(cust)
    await db_session.commit()
    return cust


@pytest_asyncio.fixture()
def customer_token(customer_user: User) -> str:
    return create_access_token(str(customer_user.id), customer_user.role.value)


@pytest_asyncio.fixture()
def customer_headers(customer_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {customer_token}"}


async def _create_job_for_customer(
    client: AsyncClient,
    admin_headers: dict,
    customer_id: uuid.UUID,
) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "10 Pickup Rd",
            "dropoff_address": "20 Dropoff Ln",
            "price": 25.50,
        },
        headers=admin_headers,
    )
    assert resp.status_code == 201
    return resp.json()


class TestCustomerLogin:
    async def test_login_success(
        self, client: AsyncClient, customer_user: User, linked_customer: Customer,
    ):
        resp = await client.post(
            "/api/customer/auth/login",
            json={"email": "customer@testcorp.com", "password": "custpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["customer_name"] == "Test Corp"

    async def test_login_wrong_password(
        self, client: AsyncClient, customer_user: User, linked_customer: Customer,
    ):
        resp = await client.post(
            "/api/customer/auth/login",
            json={"email": "customer@testcorp.com", "password": "wrong"},
        )
        assert resp.status_code == 401

    async def test_admin_cannot_use_customer_login(
        self, client: AsyncClient, admin_user: User,
    ):
        resp = await client.post(
            "/api/customer/auth/login",
            json={"email": "admin@test.com", "password": "adminpass123"},
        )
        assert resp.status_code == 403


class TestCustomerJobs:
    async def test_list_own_jobs(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer_headers: dict,
        linked_customer: Customer,
    ):
        await _create_job_for_customer(client, admin_headers, linked_customer.id)
        await _create_job_for_customer(client, admin_headers, linked_customer.id)

        resp = await client.get("/api/customer/jobs", headers=customer_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_cannot_see_other_customers_jobs(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer_headers: dict,
        linked_customer: Customer,
        customer: Customer,
    ):
        await _create_job_for_customer(client, admin_headers, customer.id)

        resp = await client.get("/api/customer/jobs", headers=customer_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    async def test_admin_token_rejected(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.get("/api/customer/jobs", headers=admin_headers)
        assert resp.status_code == 403

    async def test_unauthenticated_rejected(self, client: AsyncClient):
        resp = await client.get("/api/customer/jobs")
        assert resp.status_code == 403


class TestCustomerPOD:
    async def test_get_pod(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer_headers: dict,
        linked_customer: Customer,
        driver: Driver,
        db_session: AsyncSession,
    ):
        job = await _create_job_for_customer(client, admin_headers, linked_customer.id)
        jid = job["id"]

        await client.post(f"/api/jobs/{jid}/assign", json={"driver_id": str(driver.id)}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "picked_up"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "in_transit"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "delivered"}, headers=admin_headers)

        await client.post(
            f"/api/jobs/{jid}/pod",
            json={"recipient_name": "John Doe", "signature_url": "https://example.com/sig.png"},
            headers=admin_headers,
        )

        resp = await client.get(f"/api/customer/jobs/{jid}/pod", headers=customer_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["recipient_name"] == "John Doe"
        assert data["signature_url"] == "https://example.com/sig.png"

    async def test_pod_not_found(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer_headers: dict,
        linked_customer: Customer,
    ):
        job = await _create_job_for_customer(client, admin_headers, linked_customer.id)
        resp = await client.get(f"/api/customer/jobs/{job['id']}/pod", headers=customer_headers)
        assert resp.status_code == 404


class TestCustomerInvoice:
    async def test_get_invoice(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer_headers: dict,
        linked_customer: Customer,
    ):
        job = await _create_job_for_customer(client, admin_headers, linked_customer.id)

        resp = await client.get(
            f"/api/customer/jobs/{job['id']}/invoice", headers=customer_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tracking_id"] == job["tracking_id"]
        assert data["customer_name"] == "Test Corp"
        assert data["price"] == 25.5
