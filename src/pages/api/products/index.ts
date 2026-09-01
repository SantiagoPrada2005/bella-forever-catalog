import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  getProducts,
  createProduct,
  type ProductInput,
  type ToneInput,
  type ProductImageInput,
} from '../../../lib/services';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const prods = await getProducts(db);
    return new Response(JSON.stringify(prods), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
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
    const result = await createProduct(db, data, tones, images);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

