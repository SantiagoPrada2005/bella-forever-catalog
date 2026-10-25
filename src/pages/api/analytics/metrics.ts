import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getAnalyticsSummary } from '../../../lib/services';
import { getErrorMessage } from '../../../lib/errors';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const periodParam = (url.searchParams.get('period') || 'all') as
      | 'all'
      | 'today'
      | '7days'
      | '30days';

    const validPeriod = ['all', 'today', '7days', '30days'].includes(periodParam)
      ? periodParam
      : 'all';

    const db = getDb();
    const summary = await getAnalyticsSummary(db, validPeriod);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
