import type { Category, ProductWithRelations, OrderWithItems, OrderPayment } from '../db/schema';
import type {
  ProductInput,
  ToneInput,
  ProductImageInput,
  CreateOrderInput,
  UpdateOrderInput,
  AddPaymentInput,
  AnalyticsSummary,
} from './services';

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Error al cargar categorías');
  return res.json();
}

export async function createCategory(name: string): Promise<{ id: string; slug: string; name: string }> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Error al crear categoría');
  return res.json();
}

export async function updateCategory(id: string, name: string): Promise<{ id: string; slug: string; name: string }> {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Error al actualizar categoría');
  return res.json();
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar categoría');
  return res.json();
}

export async function getProducts(): Promise<ProductWithRelations[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function getProductById(id: string): Promise<ProductWithRelations> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Error al cargar producto');
  return res.json();
}

export async function createProduct(
  data: ProductInput,
  tones: ToneInput[] = [],
  images: ProductImageInput[] = []
): Promise<{ id: string }> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, tones, images }),
  });
  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

export async function updateProduct(
  id: string,
  data: ProductInput,
  tones: ToneInput[] = [],
  images: ProductImageInput[] = []
): Promise<{ id: string }> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, tones, images }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar producto');
  return json as { id: string };
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
  if (!res.ok) throw new Error(json.error || 'Error al eliminar producto');
  return json as { success: boolean };
}

export async function toggleProductStock(id: string, inStock: boolean): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inStock }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar stock de producto');
  return json as { success: boolean };
}

export async function updateProductStockQuantity(id: string, stock: number, inStock?: boolean): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock, inStock }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar cantidad de stock');
  return json as { success: boolean };
}

export async function updateProductTonesStock(
  id: string,
  tones: Array<{ id: string; stock: number; inStock?: boolean }>
): Promise<{ success: boolean; product?: ProductWithRelations }> {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tones }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean; product?: ProductWithRelations };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar inventario de tonos');
  return json as { success: boolean; product?: ProductWithRelations };
}

export async function toggleToneStock(id: string, inStock: boolean): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tones/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inStock }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar stock de tono');
  return json as { success: boolean };
}

export async function updateToneStockQuantity(id: string, stock: number, inStock?: boolean): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tones/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock, inStock }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar cantidad de stock del tono');
  return json as { success: boolean };
}

export async function createOrder(data: CreateOrderInput): Promise<OrderWithItems> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as { error?: string } & OrderWithItems;
  if (!res.ok) {
    throw new Error(json.error || 'Error al procesar el pedido');
  }
  return json as OrderWithItems;
}

export async function getOrders(status?: string): Promise<OrderWithItems[]> {
  const query = status && status !== 'todos' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/orders${query}`);
  if (!res.ok) throw new Error('Error al cargar pedidos');
  return res.json();
}

export async function getOrderById(id: string): Promise<OrderWithItems> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error('Error al cargar pedido');
  return res.json();
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated',
  restock: boolean = false
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, restock }),
  });
  const json = (await res.json()) as { success: boolean; status: string; error?: string };
  if (!res.ok) throw new Error(json.error || 'Error al actualizar estado del pedido');
  return json;
}

export async function createManualAdminOrder(data: CreateOrderInput): Promise<OrderWithItems> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, isManualAdmin: true }),
  });
  const json = (await res.json()) as { error?: string } & OrderWithItems;
  if (!res.ok) {
    throw new Error(json.error || 'Error al procesar el pedido');
  }
  return json as OrderWithItems;
}

export async function updateOrder(id: string, data: UpdateOrderInput): Promise<OrderWithItems> {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as { error?: string } & OrderWithItems;
  if (!res.ok) {
    throw new Error(json.error || 'Error al actualizar el pedido');
  }
  return json as OrderWithItems;
}

export async function deleteOrder(id: string, restock: boolean = true): Promise<{ success: boolean }> {
  const res = await fetch(`/api/orders/${id}?restock=${restock}`, {
    method: 'DELETE',
  });
  const json = (await res.json()) as { success?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(json.error || 'Error al eliminar el pedido');
  }
  return { success: true };
}

export async function getOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const res = await fetch(`/api/orders/${orderId}/payments`);
  if (!res.ok) throw new Error('Error al cargar historial de pagos');
  return res.json();
}

export async function addOrderPayment(orderId: string, data: AddPaymentInput): Promise<OrderPayment> {
  const res = await fetch(`/api/orders/${orderId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as { error?: string } & OrderPayment;
  if (!res.ok) {
    throw new Error(json.error || 'Error al registrar el abono');
  }
  return json as OrderPayment;
}

export async function deleteOrderPayment(orderId: string, paymentId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/orders/${orderId}/payments?paymentId=${paymentId}`, {
    method: 'DELETE',
  });
  const json = (await res.json()) as { success?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(json.error || 'Error al eliminar el abono');
  }
  return { success: true };
}

export async function getDbAnalyticsMetrics(period: string = 'all'): Promise<AnalyticsSummary> {
  const res = await fetch(`/api/analytics/metrics?period=${encodeURIComponent(period)}`);
  if (!res.ok) throw new Error('Error al cargar métricas de base de datos');
  return res.json();
}



