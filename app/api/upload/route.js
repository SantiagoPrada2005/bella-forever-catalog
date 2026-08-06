import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getR2Bucket() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')];
  if (!ctx?.env?.BELLA_IMAGES) {
    throw new Error('R2 binding BELLA_IMAGES not found in Cloudflare env');
  }
  return ctx.env.BELLA_IMAGES;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function validateFile(file) {
  if (!file) return { valid: false, error: 'Archivo no proporcionado' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Formato no soportado: ${file.name}. Solo se aceptan JPEG, PNG, WebP y AVIF.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo ${file.name} excede el tamaño máximo de 10 MB.` };
  }
  return { valid: true };
}

async function uploadSingleFile(file, bucket) {
  const bytes = await file.arrayBuffer();
  const timestamp = Date.now();
  const cleanFileName = sanitizeFileName(file.name);
  const key = `uploads/${timestamp}-${cleanFileName}`;

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: file.type },
  });

  return `/api/images/${key}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Backward compat: single file field
    const singleFile = formData.get('file');
    const allFiles = formData.getAll('files');

    // Collect files to process
    const filesToProcess = allFiles.length > 0 ? allFiles : (singleFile ? [singleFile] : []);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    const bucket = getR2Bucket();
    const urls = [];
    const errors = [];

    // Validate all files first
    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (urls.length === 0 && errors.length === filesToProcess.length) {
      return NextResponse.json({ error: errors.join(' | '), errors }, { status: 400 });
    }

    // Upload sequentially (avoids R2 concurrency issues)
    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.valid) continue; // Already recorded above

      try {
        const url = await uploadSingleFile(file, bucket);
        urls.push(url);
      } catch (uploadError) {
        console.error(`Error al subir ${file.name}:`, uploadError);
        errors.push(`Error al subir ${file.name}: ${uploadError.message}`);
      }
    }

    // Single file backward compat: return { url } shape
    if (singleFile && allFiles.length === 0) {
      if (urls.length === 1) {
        return NextResponse.json({ url: urls[0] });
      }
      return NextResponse.json({ error: errors[0] || 'Error al subir el archivo.' }, { status: 500 });
    }

    // Multi-file: return { urls, errors } shape
    return NextResponse.json({ urls, errors });
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la carga.' }, { status: 500 });
  }
}
