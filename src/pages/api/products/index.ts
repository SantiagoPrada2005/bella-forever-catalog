import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getProducts, createProduct } from '../../../lib/services';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDb((locals as any).runtime?.env);
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { data, tones, images } = body;
    const db = getDb((locals as any).runtime?.env);
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
