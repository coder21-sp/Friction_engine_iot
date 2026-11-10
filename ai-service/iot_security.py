"""Controlled IoT security demo module for HFME.

This module uses synthetic events and transparent rule-based indicators. It is a
research prototype, not a production intrusion-detection system.
"""
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

DEVICES = [
    {"device_id": "iot-cam-01", "name": "Campus Camera", "device_type": "IP Camera", "location": "Lab A"},
    {"device_id": "iot-sensor-02", "name": "Temperature Sensor", "device_type": "Environmental Sensor", "location": "Lab A"},
    {"device_id": "iot-lock-03", "name": "Smart Door Lock", "device_type": "Access Control", "location": "Main Entrance"},
]
EVENTS: list[dict[str, Any]] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def score_event(event: dict[str, Any]) -> dict[str, Any]:
    """Score a synthetic/test event with explicit rules (0-100)."""
    score = 0
    reasons = []
    if event.get("auth_failures", 0) >= 5:
        score += 40
        reasons.append("Repeated authentication failures")
    if event.get("packets_per_minute", 0) >= 1000:
        score += 35
        reasons.append("Unusually high packet rate")
    if event.get("firmware_changed") is True:
        score += 35
        reasons.append("Firmware change reported")
    if event.get("unknown_destination") is True:
        score += 25
        reasons.append("Unknown network destination")
    score = min(score, 100)
    level = "high" if score >= 60 else "medium" if score >= 30 else "low"
    return {"technical_threat_score": score, "severity": level, "reasons": reasons or ["No configured suspicious indicators triggered"]}


def add_event(payload: dict[str, Any]) -> dict[str, Any]:
    device_id = payload.get("device_id", DEVICES[0]["device_id"])
    if device_id not in {d["device_id"] for d in DEVICES}:
        raise ValueError("Unknown device_id. Use one of the registered demo devices.")
    event = {
        "event_id": str(uuid4())[:8], "timestamp": _now(), "device_id": device_id,
        "event_type": payload.get("event_type", "security_telemetry"),
        "auth_failures": max(0, int(payload.get("auth_failures", 0))),
        "packets_per_minute": max(0, int(payload.get("packets_per_minute", 0))),
        "firmware_changed": bool(payload.get("firmware_changed", False)),
        "unknown_destination": bool(payload.get("unknown_destination", False)),
        "human_friction_score": max(0, min(100, float(payload.get("human_friction_score", 0)))),
        "source": payload.get("source", "simulated"),
    }
    event.update(score_event(event))
    # Prototype correlation: weighted combination of normalized technical and HFS scores.
    event["combined_risk_score"] = round(0.7 * event["technical_threat_score"] + 0.3 * event["human_friction_score"], 2)
    event["risk_note"] = "Prototype correlation score; not a validated probability of attack."
    EVENTS.insert(0, event)
    del EVENTS[100:]
    return event


def snapshot() -> dict[str, Any]:
    if not EVENTS:
        add_event({"device_id": "iot-sensor-02", "event_type": "normal_telemetry", "source": "simulated"})
    return {"prototype_mode": "simulated_events", "disclaimer": "Synthetic demo events and transparent rule-based scoring; not validated on live IoT traffic.", "devices": DEVICES, "events": EVENTS[:30], "summary": {"device_count": len(DEVICES), "event_count": len(EVENTS), "high_severity_count": sum(1 for e in EVENTS if e["severity"] == "high"), "medium_severity_count": sum(1 for e in EVENTS if e["severity"] == "medium")}}




import random


# Cycles through Low -> Medium -> High for repeatable demo testing.
_simulation_index = 0

def simulate_suspicious() -> dict[str, Any]:
    global _simulation_index

    scenarios = [
        (
            "low",
            {
                "auth_failures": 1,
                "packets_per_minute": 100,
                "firmware_changed": False,
                "unknown_destination": False,
                "human_friction_score": 10,
            },
        ),
        (
            "medium",
            {
                "auth_failures": 5,
                "packets_per_minute": 650,
                "firmware_changed": False,
                "unknown_destination": False,
                "human_friction_score": 35,
            },
        ),
        (
            "high",
            {
                "auth_failures": 7,
                "packets_per_minute": 1250,
                "firmware_changed": True,
                "unknown_destination": True,
                "human_friction_score": 68,
            },
        ),
    ]

    scenario, event_data = scenarios[
        _simulation_index % len(scenarios)
    ]
    _simulation_index += 1

    device = random.choice(DEVICES)

    return add_event({
        "device_id": device["device_id"],
        "event_type": f"simulated_{scenario}_activity",
        "source": "simulated",
        **event_data,
    })
