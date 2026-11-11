import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session-guards';
import { simulateRandomIoTEvent } from '@/lib/iot-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const rawBase = process.env.AI_SERVICE_URL;
  if (rawBase) {
    const base = rawBase.replace(/\/+$/, '');
    try {
      const response = await fetch(`${base}/iot/simulate-suspicious`, {
        method: 'POST',
        headers: { 'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key' },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      console.warn('[IoT Simulate] FastAPI unreachable, using embedded IoT engine:', e);
    }
  }

  // Resilient fallback: generates randomized simulated event
  return NextResponse.json(simulateRandomIoTEvent());
}
