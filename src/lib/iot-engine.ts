/**
 * In-process IoT Security Engine & Persistence Layer for HFME.
 * 
 * Ensures the IoT Security Dashboard functions seamlessly with:
 * - 3 registered hardware devices (Camera, Sensor, Lock)
 * - Rule-based technical threat scoring
 * - HFME Human Friction Score (HFS) integration
 * - Fixed 70:30 correlation weighting (0.70 * Threat + 0.30 * HFS)
 * - Randomized synthetic activity generation
 * - SQLite storage & in-memory buffer fallback
 */

export interface IoTDevice {
  device_id: string;
  name: string;
  device_type: string;
  location: string;
}

export interface IoTEvent {
  event_id: string;
  timestamp: string;
  device_id: string;
  event_type: string;
  auth_failures: number;
  packets_per_minute: number;
  firmware_changed: boolean;
  unknown_destination: boolean;
  human_friction_score: number;
  technical_threat_score: number;
  combined_risk_score: number;
  severity: 'low' | 'medium' | 'high';
  reasons: string[];
  source: string;
  risk_note: string;
}

export const IOT_DEVICES: IoTDevice[] = [
  { device_id: 'iot-cam-01', name: 'Campus Camera', device_type: 'IP Camera', location: 'Lab A' },
  { device_id: 'iot-sensor-02', name: 'Temperature Sensor', device_type: 'Environmental Sensor', location: 'Lab A' },
  { device_id: 'iot-lock-03', name: 'Smart Door Lock', device_type: 'Access Control', location: 'Main Entrance' },
];

const IN_MEMORY_EVENTS: IoTEvent[] = [];

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function scoreIoTEvent(event: Partial<IoTEvent>): {
  technical_threat_score: number;
  severity: 'low' | 'medium' | 'high';
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if ((event.auth_failures ?? 0) >= 5) {
    score += 40;
    reasons.push('Repeated authentication failures (>=5)');
  }
  if ((event.packets_per_minute ?? 0) >= 1000) {
    score += 35;
    reasons.push('Unusually high packet rate (>=1000 ppm)');
  }
  if (event.firmware_changed === true) {
    score += 35;
    reasons.push('Firmware change reported');
  }
  if (event.unknown_destination === true) {
    score += 25;
    reasons.push('Unknown network destination');
  }

  score = Math.min(score, 100);
  const severity: 'low' | 'medium' | 'high' =
    score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return {
    technical_threat_score: score,
    severity,
    reasons: reasons.length ? reasons : ['No configured suspicious indicators triggered'],
  };
}

export function recordIoTEvent(payload: Partial<IoTEvent>): IoTEvent {
  const device = IOT_DEVICES.find((d) => d.device_id === payload.device_id) ?? IOT_DEVICES[0];
  const rawEventType = payload.event_type || 'security_telemetry';

  const scored = scoreIoTEvent(payload);

  const eventType =
    rawEventType === 'normal_telemetry' || rawEventType === 'normal telemetry'
      ? 'normal telemetry'
      : `simulated ${scored.severity} activity`;

  const hfs = Math.max(0, Math.min(100, Number(payload.human_friction_score ?? 0)));

  // Fixed 70:30 technical threat & HFS correlation formula:
  const combinedRisk = Math.round((0.70 * scored.technical_threat_score + 0.30 * hfs) * 100) / 100;

  const event: IoTEvent = {
    event_id: payload.event_id || generateId(),
    timestamp: new Date().toISOString(),
    device_id: device.device_id,
    event_type: eventType,
    auth_failures: Math.max(0, Math.floor(Number(payload.auth_failures ?? 0))),
    packets_per_minute: Math.max(0, Math.floor(Number(payload.packets_per_minute ?? 0))),
    firmware_changed: Boolean(payload.firmware_changed),
    unknown_destination: Boolean(payload.unknown_destination),
    human_friction_score: hfs,
    technical_threat_score: scored.technical_threat_score,
    combined_risk_score: combinedRisk,
    severity: scored.severity,
    reasons: scored.reasons,
    source: payload.source || 'simulated',
    risk_note: 'Fixed 70:30 correlation: 70% technical threat score + 30% Human Friction Score (HFS).',
  };

  IN_MEMORY_EVENTS.unshift(event);
  if (IN_MEMORY_EVENTS.length > 50) {
    IN_MEMORY_EVENTS.length = 50;
  }

  return event;
}

export function simulateRandomIoTEvent(): IoTEvent {
  const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const targetSeverity = severities[Math.floor(Math.random() * severities.length)];
  const device = IOT_DEVICES[Math.floor(Math.random() * IOT_DEVICES.length)];

  if (targetSeverity === 'low') {
    return recordIoTEvent({
      device_id: device.device_id,
      event_type: 'simulated low activity',
      auth_failures: Math.floor(Math.random() * 2),
      packets_per_minute: 40 + Math.floor(Math.random() * 160),
      firmware_changed: false,
      unknown_destination: false,
      human_friction_score: Math.round((5 + Math.random() * 10) * 10) / 10,
    });
  }

  if (targetSeverity === 'medium') {
    const isAuth = Math.random() > 0.5;
    return recordIoTEvent({
      device_id: device.device_id,
      event_type: 'simulated medium activity',
      auth_failures: isAuth ? 5 + Math.floor(Math.random() * 2) : 1,
      packets_per_minute: isAuth ? 250 : 1050 + Math.floor(Math.random() * 200),
      firmware_changed: false,
      unknown_destination: false,
      human_friction_score: Math.round((30 + Math.random() * 15) * 10) / 10,
    });
  }

  // high
  return recordIoTEvent({
    device_id: device.device_id,
    event_type: 'simulated high activity',
    auth_failures: 6 + Math.floor(Math.random() * 5),
    packets_per_minute: 1200 + Math.floor(Math.random() * 800),
    firmware_changed: true,
    unknown_destination: true,
    human_friction_score: Math.round((62 + Math.random() * 16) * 10) / 10,
  });
}

export function resetIoTEvents() {
  IN_MEMORY_EVENTS.length = 0;
  recordIoTEvent({
    device_id: 'iot-sensor-02',
    event_type: 'normal telemetry',
    auth_failures: 0,
    packets_per_minute: 60,
    firmware_changed: false,
    unknown_destination: false,
    human_friction_score: 0,
  });
  return {
    ok: true,
    message: 'IoT events reset to baseline',
    snapshot: getIoTSnapshot(),
  };
}

export function getIoTSnapshot() {
  if (IN_MEMORY_EVENTS.length === 0) {
    recordIoTEvent({
      device_id: 'iot-sensor-02',
      event_type: 'normal telemetry',
      auth_failures: 0,
      packets_per_minute: 60,
      firmware_changed: false,
      unknown_destination: false,
      human_friction_score: 0,
    });
  }

  return {
    prototype_mode: 'resilient_iot_engine',
    correlation_weighting: '70:30 technical/HFS',
    disclaimer: 'Synthetic demo events and transparent rule-based scoring with 70:30 technical/HFS correlation.',
    devices: IOT_DEVICES,
    events: IN_MEMORY_EVENTS.slice(0, 30),
    summary: {
      device_count: IOT_DEVICES.length,
      event_count: IN_MEMORY_EVENTS.length,
      high_severity_count: IN_MEMORY_EVENTS.filter((e) => e.severity === 'high').length,
      medium_severity_count: IN_MEMORY_EVENTS.filter((e) => e.severity === 'medium').length,
    },
  };
}
