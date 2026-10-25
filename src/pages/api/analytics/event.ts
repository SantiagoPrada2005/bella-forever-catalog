import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { recordAnalyticsEvent } from '../../../lib/services';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let payload: Record<string, unknown> | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    } else {
      // navigator.sendBeacon a menudo envía con text/plain
      const text = await request.text().catch(() => '');
      if (text) {
        payload = JSON.parse(text) as Record<string, unknown>;
      }
    }

    if (!payload || !payload.eventName || typeof payload.eventName !== 'string') {
      return new Response(JSON.stringify({ error: 'eventName requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No registrar eventos procedentes de /admin
    const path = typeof payload.path === 'string' ? payload.path : '';
    if (path.startsWith('/admin')) {
      return new Response(null, { status: 204 });
    }

    const db = getDb();
    await recordAnalyticsEvent(db, {
      eventName: payload.eventName,
      path: path || null,
      productId: typeof payload.productId === 'string' ? payload.productId : null,
      productName: typeof payload.productName === 'string' ? payload.productName : null,
      category: typeof payload.category === 'string' ? payload.category : null,
      value: typeof payload.value === 'number' ? payload.value : null,
      source: typeof payload.source === 'string' ? payload.source : null,
      sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : null,
    });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    console.error('Error registrando evento de analítica:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
