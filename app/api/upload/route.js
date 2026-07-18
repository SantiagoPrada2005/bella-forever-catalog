import { NextResponse } from 'next/server';

function getR2Bucket() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')];
  if (!ctx?.env?.BELLA_IMAGES) {
    throw new Error('R2 binding BELLA_IMAGES not found in Cloudflare env');
  }
  return ctx.env.BELLA_IMAGES;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${cleanFileName}`;

    const bucket = getR2Bucket();
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });

    const fileUrl = `/api/images/${key}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la carga.' }, { status: 500 });
  }
}
