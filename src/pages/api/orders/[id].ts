import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import {
  getOrderById,
  updateOrderStatus,
  updateOrderWithInventoryReconciliation,
  deleteOrder,
  type UpdateOrderInput,
} from '../../../lib/services';
import { getErrorMessage } from '../../../lib/errors';

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
    const order = await getOrderById(db, id);

    if (!order) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(order), {
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

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as {
      status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated';
      restock?: boolean;
    };

    if (!body || !body.status) {
      return new Response(
        JSON.stringify({ error: 'Campo status requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'separated'];
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDb();
    await updateOrderStatus(db, id, body.status, Boolean(body.restock));

    return new Response(JSON.stringify({ success: true, status: body.status }), {
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as UpdateOrderInput;
    if (!body) {
      return new Response(JSON.stringify({ error: 'Datos de pedido requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const updatedOrder = await updateOrderWithInventoryReconciliation(db, id, body);

    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
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

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const restock = url.searchParams.get('restock') !== 'false';

    const db = getDb();
    await deleteOrder(db, id, restock);

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
