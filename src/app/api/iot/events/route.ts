import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session-guards';
import { recordIoTEvent } from '@/lib/iot-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const payload = await request.json();

  const rawBase = process.env.AI_SERVICE_URL;
  if (rawBase) {
    const base = rawBase.replace(/\/+$/, '');
    try {
      const response = await fetch(`${base}/iot/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch (e) {
      console.warn('[IoT Events] FastAPI unreachable, using embedded IoT engine:', e);
    }
  }

  return NextResponse.json(recordIoTEvent(payload));
}
