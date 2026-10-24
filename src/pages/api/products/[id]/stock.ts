import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { toggleProductStock, updateProductStock, updateProductTonesStock } from '../../../../lib/services';
import { getErrorMessage } from '../../../../lib/errors';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = (await request.json()) as {
      inStock?: boolean;
      stock?: number;
      tones?: Array<{ id: string; stock: number; inStock?: boolean }>;
    };

    const hasTones = Array.isArray(body.tones) && body.tones.length > 0;
    const hasProductStock = typeof body.stock === 'number';
    const hasProductInStock = typeof body.inStock === 'boolean';

    if (!hasTones && !hasProductStock && !hasProductInStock) {
      return new Response(
        JSON.stringify({ error: 'Se requiere stock (number), inStock (boolean) o un arreglo tones' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDb();

    if (hasTones && body.tones) {
      const updatedProduct = await updateProductTonesStock(db, id, body.tones);
      return new Response(JSON.stringify({ success: true, product: updatedProduct }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (hasProductStock) {
      await updateProductStock(db, id, body.stock!, body.inStock);
    } else if (hasProductInStock) {
      await toggleProductStock(db, id, body.inStock!);
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


