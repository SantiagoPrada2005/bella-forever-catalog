import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const CACHE_LONG = 'public, max-age=31536000, immutable';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const path = params.path;
    if (!path) {
      return new Response(JSON.stringify({ error: 'Ruta no proporcionada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = env?.BELLA_IMAGES;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 binding BELLA_IMAGES not found in Cloudflare env' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const object = await bucket.get(path);
    if (!object) {
      return new Response(JSON.stringify({ error: 'Imagen no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_LONG,
        'CDN-Cache-Control': CACHE_LONG,
      },
    });
  } catch (error: unknown) {
    console.error('Error al servir imagen:', error);
    return new Response(JSON.stringify({ error: 'Error al servir imagen' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

