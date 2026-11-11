import { NextResponse } from 'next/server';
import { resetIoTEvents } from '@/lib/iot-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const rawBase = process.env.AI_SERVICE_URL;
  if (rawBase) {
    const base = rawBase.replace(/\/+$/, '');
    try {
      const response = await fetch(`${base}/iot/reset`, {
        method: 'POST',
        headers: {
          'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        resetIoTEvents();
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      console.warn('[IoT Reset API] FastAPI unreachable, resetting embedded IoT engine:', e);
    }
  }

  return NextResponse.json(resetIoTEvents());
}
