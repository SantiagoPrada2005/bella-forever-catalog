import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { toggleProductStock } from '../../../../lib/services';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = await request.json();
    const db = getDb();
    await toggleProductStock(db, id, body.inStock);
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
