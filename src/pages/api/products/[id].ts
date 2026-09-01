import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  type ProductInput,
  type ToneInput,
  type ProductImageInput,
} from '../../../lib/services';
import { getErrorMessage } from '../../../lib/errors';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const db = getDb();
    const prod = await getProductById(db, id);
    if (!prod) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
    return new Response(JSON.stringify(prod), {
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = (await request.json()) as {
      data?: ProductInput;
      tones?: ToneInput[];
      images?: ProductImageInput[];
    };

    if (!body || !body.data || !body.data.name || body.data.price === undefined) {
      return new Response(JSON.stringify({ error: 'Datos de producto inválidos (nombre y precio requeridos)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, tones = [], images = [] } = body;
    const db = getDb();
    const result = await updateProduct(db, id, data, tones, images);
    return new Response(JSON.stringify(result), {
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

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const db = getDb();
    await deleteProduct(db, id);
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


