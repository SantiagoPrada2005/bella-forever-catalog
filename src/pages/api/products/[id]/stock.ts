import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { toggleProductStock, updateProductStock } from '../../../../lib/services';
import { getErrorMessage } from '../../../../lib/errors';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = (await request.json()) as { inStock?: boolean; stock?: number };
    
    if (body.stock === undefined && typeof body.inStock !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Campo inStock (boolean) o stock (number) requerido' }), { status: 400 });
    }

    const db = getDb();
    if (typeof body.stock === 'number') {
      await updateProductStock(db, id, body.stock, body.inStock);
    } else if (typeof body.inStock === 'boolean') {
      await toggleProductStock(db, id, body.inStock);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


