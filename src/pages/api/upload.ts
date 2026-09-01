import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function validateFile(file: File) {
  if (!file) return { valid: false, error: 'Archivo no proporcionado' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Formato no soportado: ${file.name}. Solo se aceptan JPEG, PNG, WebP y AVIF.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo ${file.name} excede el tamaño máximo de 10 MB.` };
  }
  return { valid: true };
}

async function uploadSingleFile(file: File, bucket: any) {
  const bytes = await file.arrayBuffer();
  const timestamp = Date.now();
  const cleanFileName = sanitizeFileName(file.name);
  const key = `uploads/${timestamp}-${cleanFileName}`;

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: file.type },
  });

  return `/api/images/${key}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const singleFile = formData.get('file') as File | null;
    const allFiles = formData.getAll('files') as File[];

    const filesToProcess = allFiles.length > 0 ? allFiles : (singleFile ? [singleFile] : []);

    if (filesToProcess.length === 0) {
      return new Response(JSON.stringify({ error: 'No se envió ningún archivo.' }), {
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

    const urls: string[] = [];
    const errors: string[] = [];

    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(validation.error as string);
      }
    }

    if (urls.length === 0 && errors.length === filesToProcess.length) {
      return new Response(JSON.stringify({ error: errors.join(' | '), errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const file of filesToProcess) {
      const validation = validateFile(file);
      if (!validation.valid) continue;

      try {
        const url = await uploadSingleFile(file, bucket);
        urls.push(url);
      } catch (uploadError: any) {
        console.error(`Error al subir ${file.name}:`, uploadError);
        errors.push(`Error al subir ${file.name}: ${uploadError.message}`);
      }
    }

    if (singleFile && allFiles.length === 0) {
      if (urls.length === 1) {
        return new Response(JSON.stringify({ url: urls[0] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: errors[0] || 'Error al subir el archivo.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ urls, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor al procesar la carga.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
