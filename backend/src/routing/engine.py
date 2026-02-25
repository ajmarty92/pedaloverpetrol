"""Built-in nearest-neighbor route optimizer using haversine distance.

This module provides a zero-dependency solver that works offline.  The
architecture uses a simple protocol so a Google Directions or OSRM adapter
can be swapped in later without changing the service layer.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass

EARTH_RADIUS_M = 6_371_000
AVG_SPEED_MPS = 8.33  # ~30 km/h city cycling


@dataclass(frozen=True)
class LatLng:
    lat: float
    lng: float


@dataclass
class Stop:
    id: str
    pickup: LatLng
    dropoff: LatLng


@dataclass
class RouteResult:
    ordered_ids: list[str]
    total_distance_meters: float
    total_duration_seconds: float


def _haversine(a: LatLng, b: LatLng) -> float:
    """Great-circle distance in meters between two points."""
    lat1, lat2 = math.radians(a.lat), math.radians(b.lat)
    dlat = lat2 - lat1
    dlng = math.radians(b.lng - a.lng)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


def address_to_synthetic_coords(address: str) -> LatLng:
    """Deterministic hash-based geocode for addresses without a real geocoder.

    Produces coordinates in a ~10 km box around central London (51.50, -0.12)
    so that nearest-neighbor ordering is meaningful even without real geocoding.
    """
    digest = hashlib.sha256(address.encode()).hexdigest()
    lat_offset = (int(digest[:8], 16) % 10000) / 100000.0 - 0.05
    lng_offset = (int(digest[8:16], 16) % 10000) / 100000.0 - 0.05
    return LatLng(lat=51.50 + lat_offset, lng=-0.12 + lng_offset)


def solve_nearest_neighbor(
    stops: list[Stop],
    origin: LatLng | None = None,
) -> RouteResult:
    """Greedy nearest-neighbor TSP heuristic.

    Visits each stop's pickup then dropoff before moving to the next stop.
    If *origin* is given, the first leg starts from there (driver's current
    location); otherwise it starts from the first stop's pickup.
    """
    if not stops:
        return RouteResult(ordered_ids=[], total_distance_meters=0, total_duration_seconds=0)

    remaining = list(stops)
    ordered: list[Stop] = []
    current = origin or remaining[0].pickup
    total_dist = 0.0

    while remaining:
        best_idx = 0
        best_dist = _haversine(current, remaining[0].pickup)
        for i in range(1, len(remaining)):
            d = _haversine(current, remaining[i].pickup)
            if d < best_dist:
                best_dist = d
                best_idx = i

        chosen = remaining.pop(best_idx)
        ordered.append(chosen)

        total_dist += _haversine(current, chosen.pickup)
        total_dist += _haversine(chosen.pickup, chosen.dropoff)
        current = chosen.dropoff

    return RouteResult(
        ordered_ids=[s.id for s in ordered],
        total_distance_meters=round(total_dist, 1),
        total_duration_seconds=round(total_dist / AVG_SPEED_MPS, 1),
    )
