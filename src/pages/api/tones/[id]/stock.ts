import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { toggleToneStock } from '../../../../lib/services';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = (await request.json()) as { inStock?: boolean };
    if (!body || typeof body.inStock !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Campo inStock (boolean) requerido' }), { status: 400 });
    }
    const db = getDb();
    await toggleToneStock(db, id, body.inStock);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

