import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { updateCategory, deleteCategory } from '../../../lib/services';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
    const body = await request.json();
    const db = getDb((locals as any).runtime?.env);
    const result = await updateCategory(db, id, body.name);
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
    await deleteCategory(db, id);
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
