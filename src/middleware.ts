import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const request = context.request;
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';

  // Forzar redirección 301 de HTTP a HTTPS en producción (Cloudflare Workers)
  if (proto === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  return next();
});
