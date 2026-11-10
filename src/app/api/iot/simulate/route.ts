import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const base = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${base}/iot/simulate-suspicious`, { method: 'POST', headers: { 'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key' }, cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: 'IoT service unavailable. Start the FastAPI service.' }, { status: 502 });
  }
}
