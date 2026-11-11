"""Controlled IoT security demo module for HFME.

This module implements:
- Frontend: Next.js and React-based monitoring dashboard
- Backend: Python and FastAPI for API and event processing
- Database: SQLite for prototype event storage
- IoT Devices: Campus Camera, Temperature Sensor, and Smart Door Lock
- Event Generation: Synthetic Low, Medium, and High threat scenarios
- Threat Detection: Rule-based technical threat scoring
- Behaviour Analysis: HFME indicators and Human Friction Score (HFS)
- Risk Correlation: Fixed 70:30 technical/HFS weighting
  Formula: Combined Risk = 0.70 * Technical Threat Score + 0.30 * HFS
"""
from datetime import datetime, timezone
import json
from pathlib import Path
import random
import sqlite3
from typing import Any
from uuid import uuid4

# IoT Devices
DEVICES = [
    {"device_id": "iot-cam-01", "name": "Campus Camera", "device_type": "IP Camera", "location": "Lab A"},
    {"device_id": "iot-sensor-02", "name": "Temperature Sensor", "device_type": "Environmental Sensor", "location": "Lab A"},
    {"device_id": "iot-lock-03", "name": "Smart Door Lock", "device_type": "Access Control", "location": "Main Entrance"},
]

# Database: SQLite storage in prisma/dev.db (or data/iot_events.db)
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "prisma" / "dev.db"
if not DB_PATH.parent.exists():
    DB_PATH = BASE_DIR / "data" / "iot_events.db"
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def _init_sqlite():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS iot_events (
                    event_id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    device_id TEXT,
                    event_type TEXT,
                    auth_failures INTEGER,
                    packets_per_minute INTEGER,
                    firmware_changed INTEGER,
                    unknown_destination INTEGER,
                    human_friction_score REAL,
                    technical_threat_score REAL,
                    combined_risk_score REAL,
                    severity TEXT,
                    reasons TEXT,
                    source TEXT,
                    risk_note TEXT
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"[IoT SQLite] Note: {e}")

_init_sqlite()

# In-memory buffer fallback
EVENTS: list[dict[str, Any]] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def score_event(event: dict[str, Any]) -> dict[str, Any]:
    """Rule-based technical threat scoring (0-100)."""
    score = 0
    reasons = []
    if event.get("auth_failures", 0) >= 5:
        score += 40
        reasons.append("Repeated authentication failures (>=5)")
    if event.get("packets_per_minute", 0) >= 1000:
        score += 35
        reasons.append("Unusually high packet rate (>=1000 ppm)")
    if event.get("firmware_changed") is True:
        score += 35
        reasons.append("Firmware change reported")
    if event.get("unknown_destination") is True:
        score += 25
        reasons.append("Unknown network destination")
    score = min(score, 100)
    level = "high" if score >= 60 else "medium" if score >= 30 else "low"
    return {
        "technical_threat_score": score,
        "severity": level,
        "reasons": reasons or ["No configured suspicious indicators triggered"],
    }


def add_event(payload: dict[str, Any]) -> dict[str, Any]:
    device_id = payload.get("device_id", DEVICES[0]["device_id"])
    if device_id not in {d["device_id"] for d in DEVICES}:
        raise ValueError("Unknown device_id. Use one of the registered demo devices.")
    raw_event_type = payload.get("event_type", "security_telemetry")

    event = {
        "event_id": str(uuid4())[:8],
        "timestamp": _now(),
        "device_id": device_id,
        "event_type": raw_event_type,
        "auth_failures": max(0, int(payload.get("auth_failures", 0))),
        "packets_per_minute": max(0, int(payload.get("packets_per_minute", 0))),
        "firmware_changed": bool(payload.get("firmware_changed", False)),
        "unknown_destination": bool(payload.get("unknown_destination", False)),
        "human_friction_score": max(0, min(100, float(payload.get("human_friction_score", 0)))),
        "source": payload.get("source", "simulated"),
    }

    # Threat Detection: Rule-based technical threat scoring
    event.update(score_event(event))

    # Name format: "simulated {severity} activity" or "normal telemetry"
    if raw_event_type in ("normal_telemetry", "normal telemetry"):
        event["event_type"] = "normal telemetry"
    else:
        event["event_type"] = f"simulated {event['severity']} activity"

    # Risk Correlation: Fixed 70:30 technical/HFS weighting
    # Formula: Combined Risk = 0.70 * Technical Threat Score + 0.30 * Human Friction Score (HFS)
    event["combined_risk_score"] = round(
        0.70 * event["technical_threat_score"] + 0.30 * event["human_friction_score"], 2
    )
    event["risk_note"] = "Fixed 70:30 correlation: 70% technical threat score + 30% Human Friction Score (HFS)."

    # Persist to SQLite
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO iot_events
                (event_id, timestamp, device_id, event_type, auth_failures, packets_per_minute,
                 firmware_changed, unknown_destination, human_friction_score, technical_threat_score,
                 combined_risk_score, severity, reasons, source, risk_note)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event["event_id"], event["timestamp"], event["device_id"], event["event_type"],
                event["auth_failures"], event["packets_per_minute"], int(event["firmware_changed"]),
                int(event["unknown_destination"]), event["human_friction_score"], event["technical_threat_score"],
                event["combined_risk_score"], event["severity"], json.dumps(event["reasons"]),
                event["source"], event["risk_note"]
            ))
            conn.commit()
    except Exception as err:
        print(f"[IoT DB] Write error: {err}")

    # Maintain in-memory list for instant reactivity
    EVENTS.insert(0, event)
    del EVENTS[100:]
    return event


def snapshot() -> dict[str, Any]:
    """Retrieve event snapshot backed by SQLite database."""
    events_from_db: list[dict[str, Any]] = []
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM iot_events ORDER BY timestamp DESC LIMIT 30")
            for row in cursor.fetchall():
                item = dict(row)
                item["firmware_changed"] = bool(item["firmware_changed"])
                item["unknown_destination"] = bool(item["unknown_destination"])
                try:
                    item["reasons"] = json.loads(item["reasons"])
                except Exception:
                    item["reasons"] = [item["reasons"]] if item["reasons"] else []
                events_from_db.append(item)
    except Exception as err:
        print(f"[IoT DB] Read error: {err}")

    active_events = events_from_db if events_from_db else EVENTS

    if not active_events:
        initial = add_event({"device_id": "iot-sensor-02", "event_type": "normal telemetry", "source": "simulated"})
        active_events = [initial]

    return {
        "prototype_mode": "sqlite_backed_events",
        "correlation_weighting": "70:30 technical/HFS",
        "disclaimer": "Synthetic demo events and transparent rule-based scoring with 70:30 technical/HFS correlation.",
        "devices": DEVICES,
        "events": active_events[:30],
        "summary": {
            "device_count": len(DEVICES),
            "event_count": len(active_events),
            "high_severity_count": sum(1 for e in active_events if e["severity"] == "high"),
            "medium_severity_count": sum(1 for e in active_events if e["severity"] == "medium"),
        },
    }


def reset_events() -> dict[str, Any]:
    """Clear all events and restore baseline normal telemetry upon dashboard signout."""
    global EVENTS
    EVENTS.clear()
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM iot_events")
            conn.commit()
    except Exception as err:
        print(f"[IoT DB] Reset error: {err}")

    # Restore clean baseline telemetry
    add_event({
        "device_id": "iot-sensor-02",
        "event_type": "normal telemetry",
        "source": "simulated",
        "auth_failures": 0,
        "packets_per_minute": 60,
        "firmware_changed": False,
        "unknown_destination": False,
        "human_friction_score": 0.0,
    })
    return snapshot()


def simulate_suspicious() -> dict[str, Any]:
    """Generate synthetic Low, Medium, and High threat scenarios with random distribution and fixed 70:30 correlation."""
    # Random selection among Low, Medium, High threat scenarios
    target_severity = random.choice(["low", "medium", "high"])
    device = random.choice(DEVICES)

    if target_severity == "low":
        # Technical Threat Score: 0
        # HFS: 10.0 (or 2-15)
        # Combined Risk: 0.70 * 0 + 0.30 * 10 = 3.0
        event_data = {
            "auth_failures": random.randint(0, 1),
            "packets_per_minute": random.randint(40, 200),
            "firmware_changed": False,
            "unknown_destination": False,
            "human_friction_score": round(random.uniform(5.0, 15.0), 1),
        }
    elif target_severity == "medium":
        # Technical Threat Score: 35-40 (medium)
        # HFS: 30-45
        # Combined Risk: 0.70 * 40 + 0.30 * 35 = 38.5
        variant = random.choice(["auth", "traffic"])
        if variant == "auth":
            auth_val = random.randint(5, 6)  # triggers +40
            ppm = random.randint(200, 500)
        else:
            auth_val = random.randint(1, 3)
            ppm = random.randint(1020, 1300)  # triggers +35

        event_data = {
            "auth_failures": auth_val,
            "packets_per_minute": ppm,
            "firmware_changed": False,
            "unknown_destination": False,
            "human_friction_score": round(random.uniform(30.0, 45.0), 1),
        }
    else:  # high
        # Technical Threat Score: 75-100 (high)
        # HFS: 60-80
        # Combined Risk: 0.70 * 100 + 0.30 * 68 = 90.4
        event_data = {
            "auth_failures": random.randint(6, 10),      # +40
            "packets_per_minute": random.randint(1100, 2000),  # +35
            "firmware_changed": True,                    # +35 (capped at 100)
            "unknown_destination": True,                 # +25
            "human_friction_score": round(random.uniform(62.0, 78.0), 1),
        }

    return add_event({
        "device_id": device["device_id"],
        "event_type": f"simulated_{target_severity}_activity",
        "source": "simulated",
        **event_data,
    })
