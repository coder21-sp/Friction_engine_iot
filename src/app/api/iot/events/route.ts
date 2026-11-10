import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const base = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const payload = await request.json();
    const response = await fetch(`${base}/iot/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key' }, body: JSON.stringify(payload), cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: 'IoT service unavailable or invalid request.' }, { status: 502 });
  }
}
