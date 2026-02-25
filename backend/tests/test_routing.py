"""Tests for the route optimization and apply endpoints."""

import uuid

import pytest
from httpx import AsyncClient

from src.customers.models import Customer
from src.drivers.models import Driver
from src.routing.engine import LatLng, Stop, address_to_synthetic_coords, solve_nearest_neighbor

pytestmark = pytest.mark.asyncio


async def _create_assigned_job(
    client: AsyncClient,
    headers: dict,
    customer_id: uuid.UUID,
    driver_id: uuid.UUID,
    pickup: str = "10 Pickup Rd",
    dropoff: str = "20 Dropoff Ln",
) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": pickup,
            "dropoff_address": dropoff,
        },
        headers=headers,
    )
    assert resp.status_code == 201
    job = resp.json()

    resp = await client.post(
        f"/api/jobs/{job['id']}/assign",
        json={"driver_id": str(driver_id)},
        headers=headers,
    )
    assert resp.status_code == 200
    return resp.json()


# ── Engine unit tests ────────────────────────────────────────────────────


class TestHaversineEngine:
    def test_empty_stops(self):
        result = solve_nearest_neighbor([])
        assert result.ordered_ids == []
        assert result.total_distance_meters == 0

    def test_single_stop(self):
        stop = Stop(id="a", pickup=LatLng(51.5, -0.1), dropoff=LatLng(51.51, -0.1))
        result = solve_nearest_neighbor([stop])
        assert result.ordered_ids == ["a"]
        assert result.total_distance_meters > 0

    def test_ordering_is_deterministic(self):
        stops = [
            Stop(id="a", pickup=LatLng(51.50, -0.10), dropoff=LatLng(51.51, -0.10)),
            Stop(id="b", pickup=LatLng(51.52, -0.10), dropoff=LatLng(51.53, -0.10)),
            Stop(id="c", pickup=LatLng(51.54, -0.10), dropoff=LatLng(51.55, -0.10)),
        ]
        r1 = solve_nearest_neighbor(stops)
        r2 = solve_nearest_neighbor(stops)
        assert r1.ordered_ids == r2.ordered_ids

    def test_nearest_neighbor_prefers_closer_stop(self):
        origin = LatLng(51.50, -0.10)
        far = Stop(id="far", pickup=LatLng(52.00, -0.10), dropoff=LatLng(52.01, -0.10))
        near = Stop(id="near", pickup=LatLng(51.51, -0.10), dropoff=LatLng(51.52, -0.10))
        result = solve_nearest_neighbor([far, near], origin=origin)
        assert result.ordered_ids[0] == "near"

    def test_synthetic_geocode_deterministic(self):
        c1 = address_to_synthetic_coords("123 Main St")
        c2 = address_to_synthetic_coords("123 Main St")
        assert c1 == c2

    def test_synthetic_geocode_differs_for_different_addresses(self):
        c1 = address_to_synthetic_coords("123 Main St")
        c2 = address_to_synthetic_coords("456 Other Ave")
        assert c1 != c2


# ── Optimize endpoint ────────────────────────────────────────────────────


class TestOptimizeRoute:
    async def test_optimize_with_explicit_job_ids(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        j1 = await _create_assigned_job(client, admin_headers, customer.id, driver.id, "A Street", "B Street")
        j2 = await _create_assigned_job(client, admin_headers, customer.id, driver.id, "C Street", "D Street")
        j3 = await _create_assigned_job(client, admin_headers, customer.id, driver.id, "E Street", "F Street")

        resp = await client.post(
            f"/api/drivers/{driver.id}/optimize-route",
            json={"job_ids": [j1["id"], j2["id"], j3["id"]]},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        data = resp.json()

        assert data["driver_id"] == str(driver.id)
        assert len(data["optimized_jobs"]) == 3
        assert data["total_distance_meters"] > 0
        assert data["total_duration_seconds"] > 0
        assert data["engine"] == "haversine_nearest_neighbor"

        sequences = [j["sequence"] for j in data["optimized_jobs"]]
        assert sequences == [1, 2, 3]

        returned_ids = {j["job_id"] for j in data["optimized_jobs"]}
        assert returned_ids == {j1["id"], j2["id"], j3["id"]}

    async def test_optimize_auto_resolves_todays_jobs(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        await _create_assigned_job(client, admin_headers, customer.id, driver.id)
        await _create_assigned_job(client, admin_headers, customer.id, driver.id, "X St", "Y St")

        resp = await client.post(
            f"/api/drivers/{driver.id}/optimize-route",
            json={},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()["optimized_jobs"]) == 2

    async def test_optimize_no_jobs_returns_422(
        self,
        client: AsyncClient,
        admin_headers: dict,
        driver: Driver,
    ):
        resp = await client.post(
            f"/api/drivers/{driver.id}/optimize-route",
            json={},
            headers=admin_headers,
        )
        assert resp.status_code == 422

    async def test_optimize_unknown_driver_returns_404(
        self, client: AsyncClient, admin_headers: dict,
    ):
        resp = await client.post(
            f"/api/drivers/{uuid.uuid4()}/optimize-route",
            json={},
            headers=admin_headers,
        )
        assert resp.status_code == 404

    async def test_optimize_unauthenticated_rejected(
        self, client: AsyncClient, driver: Driver,
    ):
        resp = await client.post(f"/api/drivers/{driver.id}/optimize-route", json={})
        assert resp.status_code == 403


# ── Apply endpoint ───────────────────────────────────────────────────────


class TestApplyRoute:
    async def test_apply_route_persists_sequence(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        j1 = await _create_assigned_job(client, admin_headers, customer.id, driver.id, "A", "B")
        j2 = await _create_assigned_job(client, admin_headers, customer.id, driver.id, "C", "D")

        resp = await client.post(
            f"/api/drivers/{driver.id}/apply-route",
            json={
                "sequence": [
                    {"job_id": j1["id"], "sequence": 2},
                    {"job_id": j2["id"], "sequence": 1},
                ],
            },
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["applied"] == 2

        r1 = await client.get(f"/api/jobs/{j1['id']}", headers=admin_headers)
        r2 = await client.get(f"/api/jobs/{j2['id']}", headers=admin_headers)
        assert r1.json()["route_sequence"] == 2
        assert r2.json()["route_sequence"] == 1

    async def test_apply_missing_job_returns_404(
        self,
        client: AsyncClient,
        admin_headers: dict,
        driver: Driver,
    ):
        resp = await client.post(
            f"/api/drivers/{driver.id}/apply-route",
            json={"sequence": [{"job_id": str(uuid.uuid4()), "sequence": 1}]},
            headers=admin_headers,
        )
        assert resp.status_code == 404
