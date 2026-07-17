import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName, publicUrl } from '../../../src/lib/r2';

export async function POST(request) {
  try {
    // Validar configuración de variables de entorno
    if (
      !process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID === 'your-cloudflare-account-id' ||
      !process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID === 'your-r2-access-key-id' ||
      !process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY === 'your-r2-secret-access-key'
    ) {
      return NextResponse.json(
        { error: 'Las credenciales de Cloudflare R2 no están configuradas en el archivo .env. Por favor edita las variables de entorno.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar un nombre único para el archivo
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${cleanFileName}`;

    // Subir el archivo a Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Retornar la URL pública del archivo
    const fileUrl = `${publicUrl}/${key}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la carga.' }, { status: 500 });
  }
}
