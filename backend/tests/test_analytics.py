"""Tests for the analytics endpoints."""

import uuid

import pytest
from httpx import AsyncClient

from src.customers.models import Customer
from src.drivers.models import Driver

pytestmark = pytest.mark.asyncio


async def _create_delivered_job(
    client: AsyncClient,
    headers: dict,
    customer_id: uuid.UUID,
    driver_id: uuid.UUID,
) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "A",
            "dropoff_address": "B",
        },
        headers=headers,
    )
    job = resp.json()
    jid = job["id"]
    await client.post(f"/api/jobs/{jid}/assign", json={"driver_id": str(driver_id)}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "picked_up"}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "in_transit"}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "delivered"}, headers=headers)
    return job


async def _create_failed_job(
    client: AsyncClient,
    headers: dict,
    customer_id: uuid.UUID,
    driver_id: uuid.UUID,
) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "C",
            "dropoff_address": "D",
        },
        headers=headers,
    )
    job = resp.json()
    jid = job["id"]
    await client.post(f"/api/jobs/{jid}/assign", json={"driver_id": str(driver_id)}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "picked_up"}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "in_transit"}, headers=headers)
    await client.patch(f"/api/jobs/{jid}", json={"status": "failed"}, headers=headers)
    return job


class TestSummary:
    async def test_summary_with_data(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        await _create_delivered_job(client, admin_headers, customer.id, driver.id)
        await _create_delivered_job(client, admin_headers, customer.id, driver.id)
        await _create_failed_job(client, admin_headers, customer.id, driver.id)

        resp = await client.get("/api/analytics/summary?range=30d", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["jobs_total"] == 3
        assert data["jobs_delivered"] == 2
        assert data["jobs_failed"] == 1
        assert 60 < data["on_time_rate"] < 70

    async def test_summary_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/analytics/summary")
        assert resp.status_code == 403

    async def test_summary_empty(self, client: AsyncClient, admin_headers: dict, customer: Customer):
        resp = await client.get("/api/analytics/summary?range=7d", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["jobs_total"] == 0
        assert data["jobs_delivered"] == 0
        assert data["jobs_failed"] == 0
        assert data["on_time_rate"] == 100.0


class TestByDay:
    async def test_by_day_returns_buckets(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        await _create_delivered_job(client, admin_headers, customer.id, driver.id)

        resp = await client.get("/api/analytics/by-day?range=7d", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["range_days"] == 7
        assert len(data["buckets"]) == 7

        today_bucket = data["buckets"][-1]
        assert today_bucket["jobs_total"] >= 1
        assert today_bucket["jobs_delivered"] >= 1

    async def test_by_day_empty_days_are_zero(self, client: AsyncClient, admin_headers: dict):
        resp = await client.get("/api/analytics/by-day?range=7d", headers=admin_headers)
        data = resp.json()
        for bucket in data["buckets"]:
            assert bucket["jobs_total"] == 0


class TestByDriver:
    async def test_by_driver_with_data(
        self, client: AsyncClient, admin_headers: dict, customer: Customer, driver: Driver,
    ):
        await _create_delivered_job(client, admin_headers, customer.id, driver.id)
        await _create_failed_job(client, admin_headers, customer.id, driver.id)

        resp = await client.get("/api/analytics/by-driver?range=30d", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["range_days"] == 30
        assert len(data["drivers"]) == 1
        d = data["drivers"][0]
        assert d["driver_name"] == "Test Driver"
        assert d["jobs_completed"] == 1
        assert d["jobs_failed"] == 1
        assert d["on_time_rate"] == 50.0

    async def test_by_driver_empty(self, client: AsyncClient, admin_headers: dict):
        resp = await client.get("/api/analytics/by-driver?range=30d", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["drivers"] == []
