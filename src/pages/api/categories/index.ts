import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getCategories, createCategory } from '../../../lib/services';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const result = await getCategories(db);
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'El nombre es requerido' }), { status: 400 });
    }
    const db = getDb();
    const result = await createCategory(db, body.name);
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
