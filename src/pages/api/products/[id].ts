import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getProductById, updateProduct, deleteProduct } from '../../../lib/services';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const db = getDb((locals as any).runtime?.env);
    const prod = await getProductById(db, id);
    if (!prod) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
    return new Response(JSON.stringify(prod), {
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

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = await request.json();
    const { data, tones, images } = body;
    const db = getDb((locals as any).runtime?.env);
    const result = await updateProduct(db, id, data, tones, images);
    return new Response(JSON.stringify(result), {
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const db = getDb((locals as any).runtime?.env);
    await deleteProduct(db, id);
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
