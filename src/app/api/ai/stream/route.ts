import { NextResponse } from 'next/server';

import { aiClient } from '@/lib/ai-client';
import { requireSession } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth.response) {
    return auth.response;
  }

  try {
    const response = await fetch(aiClient.getStreamUrl(), {
      headers: {
        'X-HFME-AI-Key': process.env.AI_INTERNAL_API_KEY || 'hfme-internal-key',
      },
      cache: 'no-store',
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      return NextResponse.json({ error: 'Unable to connect to the live AI stream.' }, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to connect to the live AI stream:', error);
    return NextResponse.json({ error: 'Unable to connect to the live AI stream.' }, { status: 502 });
  }
}
