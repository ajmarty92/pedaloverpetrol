"""Pricing engine: computes delivery cost from a PricingRule + job parameters.

Formula:
    subtotal = base_rate + (distance_miles * per_mile_rate)
    if is_rush:  subtotal += rush_surcharge
    if is_heavy: subtotal += heavy_surcharge
    zone_multiplier = zone_config.get(zone, 1.0) if zone and zone_config else 1.0
    total = round(subtotal * zone_multiplier, 2)

Zone config format (stored as JSON on the rule):
    {
        "zones": {
            "zone_a": 1.0,
            "zone_b": 1.2,
            "zone_c": 1.5
        }
    }

Limitations:
    - Distance must be provided by the caller (no geocoding built in).
    - Zone matching is exact string match on zone name.
    - All monetary values are in the same currency (determined by business config).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PriceBreakdown:
    rule_name: str
    base_rate: float
    distance_charge: float
    rush_surcharge: float
    heavy_surcharge: float
    zone_multiplier: float
    total: float

    @property
    def breakdown_text(self) -> str:
        parts = [f"Base: ${self.base_rate:.2f}"]
        if self.distance_charge > 0:
            parts.append(f"Distance: ${self.distance_charge:.2f}")
        if self.rush_surcharge > 0:
            parts.append(f"Rush: +${self.rush_surcharge:.2f}")
        if self.heavy_surcharge > 0:
            parts.append(f"Heavy: +${self.heavy_surcharge:.2f}")
        if self.zone_multiplier != 1.0:
            parts.append(f"Zone: ×{self.zone_multiplier}")
        parts.append(f"Total: ${self.total:.2f}")
        return " | ".join(parts)


def compute_price(
    *,
    rule_name: str,
    base_rate: float,
    per_mile_rate: float,
    rush_surcharge_rate: float,
    heavy_surcharge_rate: float,
    zone_config: dict | None,
    distance_miles: float,
    is_rush: bool = False,
    is_heavy: bool = False,
    zone: str | None = None,
) -> PriceBreakdown:
    distance_charge = round(distance_miles * per_mile_rate, 2)

    rush = rush_surcharge_rate if is_rush else 0.0
    heavy = heavy_surcharge_rate if is_heavy else 0.0

    zone_multiplier = 1.0
    if zone and zone_config:
        zones = zone_config.get("zones", {})
        zone_multiplier = float(zones.get(zone, 1.0))

    subtotal = base_rate + distance_charge + rush + heavy
    total = round(subtotal * zone_multiplier, 2)

    return PriceBreakdown(
        rule_name=rule_name,
        base_rate=base_rate,
        distance_charge=distance_charge,
        rush_surcharge=rush,
        heavy_surcharge=heavy,
        zone_multiplier=zone_multiplier,
        total=total,
    )
