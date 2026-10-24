import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  createOrderWithInventoryCheck,
  getOrders,
  type CreateOrderInput,
} from '../../../lib/services';
import { formatCustomerSetCookie } from '../../../utils/cookie';
import { getErrorMessage } from '../../../lib/errors';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const db = getDb();
    const ordersList = await getOrders(db, status);

    return new Response(JSON.stringify(ordersList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateOrderInput & { isManualAdmin?: boolean };
    if (!body || !body.customer || !body.items) {
      return new Response(
        JSON.stringify({ error: 'Datos de cliente e items requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDb();
    const order = await createOrderWithInventoryCheck(db, body);

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Formatear la cookie para persistir datos en el navegador del cliente (solo si no es admin manual)
    if (!body.isManualAdmin) {
      const setCookieHeader = formatCustomerSetCookie({
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || undefined,
        address: order.customerAddress,
        city: order.customerCity,
        notes: order.customerNotes || undefined,
        lastOrderId: order.id,
        lastOrderNumber: order.orderNumber,
      });
      headers.set('Set-Cookie', setCookieHeader);
    }

    return new Response(JSON.stringify(order), {
      status: 201,
      headers,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    const isStockError = message.toLowerCase().includes('stock insuficiente');
    return new Response(JSON.stringify({ error: message }), {
      status: isStockError ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
