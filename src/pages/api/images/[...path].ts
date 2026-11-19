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

function resolveMimeType(path: string, fallback?: string | null): string {
  if (fallback) return fallback;
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function buildImageHeaders(
  path: string,
  meta: { contentType?: string | null; size?: number | null; httpEtag?: string | null },
  isFallback = false
): Headers {
  const headers = new Headers();
  headers.set('Content-Type', resolveMimeType(path, meta.contentType));
  headers.set('Access-Control-Allow-Origin', '*');

  if (isFallback) {
    headers.set('Cache-Control', 'no-cache');
  } else {
    headers.set('Cache-Control', CACHE_LONG);
    headers.set('CDN-Cache-Control', CACHE_LONG);
  }

  if (typeof meta.size === 'number') {
    headers.set('Content-Length', String(meta.size));
  }
  if (meta.httpEtag) {
    headers.set('ETag', meta.httpEtag);
  }

  return headers;
}

async function handleImageRequest(path: string | undefined, method: 'GET' | 'HEAD'): Promise<Response> {
  try {
    if (!path) {
      return new Response(method === 'HEAD' ? null : JSON.stringify({ error: 'Ruta no proporcionada' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = env?.BELLA_IMAGES;
    if (!bucket) {
      return new Response(
        method === 'HEAD' ? null : JSON.stringify({ error: 'R2 binding BELLA_IMAGES not found in Cloudflare env' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const r2Object = method === 'HEAD' ? await bucket.head(path) : await bucket.get(path);
    if (!r2Object) {
      if (import.meta.env.DEV) {
        try {
          const remoteUrl = `https://bella-forever.com/api/images/${path}`;
          const remoteRes = await fetch(remoteUrl, { method });
          if (remoteRes.ok) {
            const lengthHeader = remoteRes.headers.get('content-length');
            const parsedLength = lengthHeader ? Number(lengthHeader) : null;
            const headers = buildImageHeaders(
              path,
              {
                contentType: remoteRes.headers.get('content-type'),
                size: parsedLength !== null && !Number.isNaN(parsedLength) ? parsedLength : null,
                httpEtag: remoteRes.headers.get('etag'),
              },
              true
            );
            return new Response(method === 'HEAD' ? null : remoteRes.body, { headers });
          }
        } catch (e) {
          console.warn('Fallback a producción falló para:', path, e);
        }
      }

      return new Response(method === 'HEAD' ? null : JSON.stringify({ error: 'Imagen no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = buildImageHeaders(path, {
      contentType: r2Object.httpMetadata?.contentType,
      size: typeof r2Object.size === 'number' ? r2Object.size : null,
      httpEtag: r2Object.httpEtag,
    });

    const body = method === 'HEAD' ? null : (r2Object as R2ObjectBody).body;
    return new Response(body, { headers });
  } catch (error: unknown) {
    console.error('Error al servir imagen:', error);
    return new Response(method === 'HEAD' ? null : JSON.stringify({ error: 'Error al servir imagen' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET: APIRoute = async ({ params }) => handleImageRequest(params.path, 'GET');

export const HEAD: APIRoute = async ({ params }) => handleImageRequest(params.path, 'HEAD');
