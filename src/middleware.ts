import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const request = context.request;
  const url = new URL(request.url);
  
  // Detectar protocolo en Cloudflare Workers y proxies
  const cfVisitorHeader = request.headers.get('cf-visitor');
  let cfVisitorScheme = '';
  if (cfVisitorHeader) {
    try {
      const parsed = JSON.parse(cfVisitorHeader) as { scheme?: string };
      cfVisitorScheme = parsed.scheme || '';
    } catch {
      // Ignorar errores de parseo
    }
  }

  const proto = request.headers.get('x-forwarded-proto') || cfVisitorScheme || url.protocol.replace(':', '');
  const host = request.headers.get('host') || url.host;

  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const isWww = host.startsWith('www.');
  const isHttp = proto === 'http' || url.protocol === 'http:';

  // Forzar redirección 301 permanente a HTTPS y dominio canónico sin www en producción
  if (!isLocal && (isHttp || isWww)) {
    const cleanHost = host.replace(/^www\./, '');
    const destination = `https://${cleanHost}${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: {
        Location: destination,
      },
    });
  }

  const response = await next();

  // Asegurar codificación de caracteres explícita en la cabecera HTTP Content-Type
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html') && !contentType.toLowerCase().includes('charset')) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('content-type', 'text/html; charset=utf-8');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
});
