import { NextResponse } from 'next/server';

const CACHE_LONG = 'public, max-age=31536000, immutable';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function getR2Bucket() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')];
  if (!ctx?.env?.BELLA_IMAGES) {
    throw new Error('R2 binding BELLA_IMAGES not found in Cloudflare env');
  }
  return ctx.env.BELLA_IMAGES;
}

export async function GET(request, { params }) {
  try {
    const path = params.path.join('/');
    const bucket = getR2Bucket();
    const object = await bucket.get(path);

    if (!object) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_LONG,
        'CDN-Cache-Control': CACHE_LONG,
      },
    });
  } catch (error) {
    console.error('Error al servir imagen:', error);
    return NextResponse.json({ error: 'Error al servir imagen' }, { status: 500 });
  }
}
