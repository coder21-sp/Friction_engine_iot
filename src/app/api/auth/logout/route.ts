import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { resetIoTEvents } from '@/lib/iot-engine';

export async function POST() {
  // Always reset IoT security events to start fresh from baseline
  resetIoTEvents();

  const rawBase = process.env.AI_SERVICE_URL;
  if (rawBase) {
    const base = rawBase.replace(/\/+$/, '');
    try {
      await fetch(`${base}/iot/reset`, {
        method: 'POST',
        headers: {
          'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Best-effort cleanup on logout
    }
  }

  const response = NextResponse.json({ ok: true, reset: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
