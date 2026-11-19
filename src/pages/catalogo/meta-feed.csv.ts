import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { getCategories, getProducts } from '../../lib/services';
import { buildMetaCatalogCsv, type MetaFeedMode } from '../../lib/catalog/meta-feed';
import { getErrorMessage } from '../../lib/errors';

export const prerender = false;

export const GET: APIRoute = async ({ request, site }) => {
  try {
    const url = new URL(request.url);
    const modeParam = url.searchParams.get('mode');
    const mode: MetaFeedMode = modeParam === 'products' ? 'products' : 'variants';

    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const siteUrl = isLocal
      ? url.origin
      : site
        ? site.toString().replace(/\/$/, '')
        : 'https://bella-forever.com';

    const db = getDb();
    const [productsList, categoriesList] = await Promise.all([
      getProducts(db),
      getCategories(db),
    ]);

    const csv = buildMetaCatalogCsv(productsList, categoriesList, {
      siteUrl,
      mode,
    });

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename="bella-forever-meta-catalog.csv"',
        'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error: unknown) {
    console.error('Error generando feed CSV de catálogo para Meta:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
