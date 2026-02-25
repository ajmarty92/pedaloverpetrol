"""Tests for the job lifecycle state machine and CRUD endpoints."""

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient

from src.models.customer import Customer
from src.models.driver import Driver
from src.models.user import User


pytestmark = pytest.mark.asyncio


async def _create_job(client: AsyncClient, headers: dict, customer_id: uuid.UUID) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "123 Pickup St",
            "dropoff_address": "456 Dropoff Ave",
            "description": "Test parcel",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── Creation ──────────────────────────────────────────────────────────────


class TestJobCreation:
    async def test_create_job_returns_pending(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        data = await _create_job(client, admin_headers, customer.id)
        assert data["status"] == "pending"
        assert data["tracking_id"]
        assert data["customer_id"] == str(customer.id)
        assert data["driver_id"] is None

    async def test_create_job_unknown_customer(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(uuid.uuid4()),
                "pickup_address": "A",
                "dropoff_address": "B",
            },
            headers=headers if (headers := admin_headers) else {},
        )
        assert resp.status_code == 404

    async def test_unauthenticated_cannot_create(
        self, client: AsyncClient, customer: Customer,
    ):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(customer.id),
                "pickup_address": "A",
                "dropoff_address": "B",
            },
        )
        assert resp.status_code == 403


# ── Happy-path state machine walk ────────────────────────────────────────


class TestJobStateMachine:
    async def test_full_lifecycle_to_delivered(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        job_id = job["id"]
        assert job["status"] == "pending"

        # pending → assigned (via /assign)
        resp = await client.post(
            f"/api/jobs/{job_id}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "assigned"
        assert resp.json()["driver_id"] == str(driver.id)

        # assigned → picked_up
        resp = await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "picked_up"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "picked_up"

        # picked_up → in_transit
        resp = await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "in_transit"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_transit"

        # in_transit → delivered
        resp = await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "delivered"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "delivered"

    async def test_full_lifecycle_to_failed(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        job_id = job["id"]

        await client.post(
            f"/api/jobs/{job_id}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "picked_up"},
            headers=admin_headers,
        )
        await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "in_transit"},
            headers=admin_headers,
        )

        resp = await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "failed"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "failed"


# ── Invalid transitions ──────────────────────────────────────────────────


class TestInvalidTransitions:
    @pytest.mark.parametrize(
        "bad_status",
        ["picked_up", "in_transit", "delivered", "failed"],
    )
    async def test_pending_cannot_jump(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        bad_status: str,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.patch(
            f"/api/jobs/{job['id']}",
            json={"status": bad_status},
            headers=admin_headers,
        )
        assert resp.status_code == 409

    async def test_assigned_cannot_go_to_in_transit(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        await client.post(
            f"/api/jobs/{job['id']}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        resp = await client.patch(
            f"/api/jobs/{job['id']}",
            json={"status": "in_transit"},
            headers=admin_headers,
        )
        assert resp.status_code == 409

    async def test_delivered_is_terminal(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        job_id = job["id"]

        await client.post(
            f"/api/jobs/{job_id}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        await client.patch(f"/api/jobs/{job_id}", json={"status": "picked_up"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{job_id}", json={"status": "in_transit"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{job_id}", json={"status": "delivered"}, headers=admin_headers)

        resp = await client.patch(
            f"/api/jobs/{job_id}",
            json={"status": "pending"},
            headers=admin_headers,
        )
        assert resp.status_code == 409

    async def test_assign_already_assigned_job_rejected(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        await client.post(
            f"/api/jobs/{job['id']}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        resp = await client.post(
            f"/api/jobs/{job['id']}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        assert resp.status_code == 409


# ── List / Get ────────────────────────────────────────────────────────────


class TestJobQueries:
    async def test_list_jobs_empty(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.get("/api/jobs", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_jobs_filter_by_status(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
    ):
        await _create_job(client, admin_headers, customer.id)
        resp = await client.get("/api/jobs?status=pending", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

        resp = await client.get("/api/jobs?status=assigned", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    async def test_get_job_by_id(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/jobs/{job['id']}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == job["id"]

    async def test_get_job_not_found(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.get(f"/api/jobs/{uuid.uuid4()}", headers=admin_headers)
        assert resp.status_code == 404
