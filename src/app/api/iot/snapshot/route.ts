import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session-guards';
import { getIoTSnapshot } from '@/lib/iot-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const rawBase = process.env.AI_SERVICE_URL;
  if (rawBase) {
    const base = rawBase.replace(/\/+$/, '');
    try {
      const response = await fetch(`${base}/iot/snapshot`, {
        headers: { 'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key' },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      console.warn('[IoT API] FastAPI unreachable, using embedded IoT engine:', e);
    }
  }

  // Resilient fallback: returns live snapshot from embedded IoT engine
  return NextResponse.json(getIoTSnapshot());
}
