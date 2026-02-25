import uuid

import pytest
from httpx import AsyncClient

from src.customers.models import Customer
from src.drivers.models import Driver

pytestmark = pytest.mark.asyncio


async def _create_job(client: AsyncClient, headers: dict, customer_id: uuid.UUID) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "100 Pickup St",
            "dropoff_address": "200 Dropoff Ave",
            "notes": "Handle with care",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestJobCRUD:
    async def test_create_job(self, client: AsyncClient, admin_headers: dict, customer: Customer):
        data = await _create_job(client, admin_headers, customer.id)
        assert data["status"] == "pending"
        assert data["tracking_id"]
        assert data["customer_id"] == str(customer.id)
        assert data["driver_id"] is None

    async def test_get_job(self, client: AsyncClient, admin_headers: dict, customer: Customer):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/jobs/{job['id']}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == job["id"]

    async def test_list_jobs(self, client: AsyncClient, admin_headers: dict, customer: Customer):
        await _create_job(client, admin_headers, customer.id)
        await _create_job(client, admin_headers, customer.id)
        resp = await client.get("/api/jobs", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_list_jobs_filter_by_status(self, client: AsyncClient, admin_headers: dict, customer: Customer):
        await _create_job(client, admin_headers, customer.id)
        resp = await client.get("/api/jobs?status=pending", headers=admin_headers)
        assert len(resp.json()) == 1
        resp = await client.get("/api/jobs?status=assigned", headers=admin_headers)
        assert len(resp.json()) == 0

    async def test_unauthenticated_blocked(self, client: AsyncClient, customer: Customer):
        resp = await client.post(
            "/api/jobs",
            json={
                "customer_id": str(customer.id),
                "pickup_address": "A",
                "dropoff_address": "B",
            },
        )
        assert resp.status_code == 403


class TestJobStateMachine:
    async def test_full_lifecycle_delivered(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        jid = job["id"]

        resp = await client.post(
            f"/api/jobs/{jid}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "assigned"

        for next_status in ("picked_up", "in_transit", "delivered"):
            resp = await client.patch(
                f"/api/jobs/{jid}", json={"status": next_status}, headers=admin_headers,
            )
            assert resp.status_code == 200
            assert resp.json()["status"] == next_status

    async def test_full_lifecycle_failed(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        jid = job["id"]

        await client.post(f"/api/jobs/{jid}/assign", json={"driver_id": str(driver.id)}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "picked_up"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "in_transit"}, headers=admin_headers)

        resp = await client.patch(f"/api/jobs/{jid}", json={"status": "failed"}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "failed"

    async def test_invalid_transition_rejected(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.patch(
            f"/api/jobs/{job['id']}", json={"status": "delivered"}, headers=admin_headers,
        )
        assert resp.status_code == 409

    async def test_terminal_state_no_further_transitions(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        jid = job["id"]

        await client.post(f"/api/jobs/{jid}/assign", json={"driver_id": str(driver.id)}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "picked_up"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "in_transit"}, headers=admin_headers)
        await client.patch(f"/api/jobs/{jid}", json={"status": "delivered"}, headers=admin_headers)

        resp = await client.patch(f"/api/jobs/{jid}", json={"status": "pending"}, headers=admin_headers)
        assert resp.status_code == 409
