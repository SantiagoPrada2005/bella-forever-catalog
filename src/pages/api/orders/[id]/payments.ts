import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import {
  getOrderPayments,
  addOrderPayment,
  deleteOrderPayment,
  type AddPaymentInput,
} from '../../../../lib/services';
import { getErrorMessage } from '../../../../lib/errors';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const payments = await getOrderPayments(db, id);

    return new Response(JSON.stringify(payments), {
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

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as AddPaymentInput;
    if (!body || body.amount === undefined) {
      return new Response(JSON.stringify({ error: 'Monto de pago requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const payment = await addOrderPayment(db, id, body);

    return new Response(JSON.stringify(payment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('paymentId');
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    await deleteOrderPayment(db, paymentId);

    return new Response(JSON.stringify({ success: true }), {
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
