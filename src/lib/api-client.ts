export async function getCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Error al cargar categorías');
  return res.json();
}

export async function createCategory(name: string) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Error al crear categoría');
  return res.json();
}

export async function updateCategory(id: string, name: string) {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Error al actualizar categoría');
  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar categoría');
  return res.json();
}

export async function getProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function getProductById(id: string) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Error al cargar producto');
  return res.json();
}

export async function createProduct(data: any, tones: any[] = [], images: any[] = []) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, tones, images }),
  });
  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

export async function updateProduct(id: string, data: any, tones: any[] = [], images: any[] = []) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, tones, images }),
  });
  if (!res.ok) throw new Error('Error al actualizar producto');
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar producto');
  return res.json();
}

export async function toggleProductStock(id: string, inStock: boolean) {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inStock }),
  });
  if (!res.ok) throw new Error('Error al actualizar stock de producto');
  return res.json();
}

export async function toggleToneStock(id: string, inStock: boolean) {
  const res = await fetch(`/api/tones/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inStock }),
  });
  if (!res.ok) throw new Error('Error al actualizar stock de tono');
  return res.json();
}
