import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import {
  products,
  tones,
  categories,
  productImages,
  orders,
  orderItems,
  orderPayments,
  type ProductWithRelations,
  type Category,
  type OrderWithItems,
  type OrderPayment,
} from '../db/schema';
import type { AppDb } from './db';

export interface ProductInput {
  name: string;
  price: number | string;
  description?: string;
  category: string;
  mainImage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  stock?: number | string;
}

export interface ToneInput {
  name: string;
  hex: string;
  image: string;
  inStock?: boolean;
  stock?: number | string;
}

export interface ProductImageInput {
  url: string;
  sortOrder?: number;
  altText?: string | null;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function getCategories(db: AppDb): Promise<Category[]> {
  let result = await db.select().from(categories).all();
  if (result.length === 0) {
    const now = new Date().toISOString();
    const defaultCats = [
      { id: 'sin-categoria', name: 'Sin categoría', slug: 'sin-categoria', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Rubor', slug: 'rubor', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Labiales', slug: 'labiales', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Cejas', slug: 'cejas', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Pestañas', slug: 'pestanas', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Correctores', slug: 'correctores', createdAt: now, updatedAt: now },
    ];
    await db.insert(categories).values(defaultCats).run();
    result = await db.select().from(categories).all();
  }
  return result;
}

export async function createCategory(db: AppDb, name: string): Promise<{ id: string; slug: string; name: string }> {
  const now = new Date().toISOString();
  const slug = slugify(name);
  const id = crypto.randomUUID();

  await db.insert(categories).values({
    id,
    name,
    slug,
    createdAt: now,
    updatedAt: now,
  }).run();

  return { id, slug, name };
}

export async function updateCategory(db: AppDb, id: string, name: string): Promise<{ id: string; slug: string; name: string }> {
  const now = new Date().toISOString();
  const slug = id === 'sin-categoria' ? 'sin-categoria' : slugify(name);

  const targetCat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!targetCat) {
    throw new Error('Categoría no encontrada');
  }

  const statements: BatchItem<'sqlite'>[] = [
    db.update(categories)
      .set({ name, slug, updatedAt: now })
      .where(eq(categories.id, id)),
  ];

  if (targetCat.slug !== slug) {
    statements.push(
      db.update(products)
        .set({ category: slug })
        .where(eq(products.category, targetCat.slug))
    );
  }

  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

  return { id, name, slug };
}

export async function deleteCategory(db: AppDb, id: string): Promise<void> {
  if (id === 'sin-categoria') {
    throw new Error('No se puede eliminar la categoría por defecto');
  }
  const targetCat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!targetCat) return;

  await db.batch([
    db.update(products)
      .set({ category: 'sin-categoria' })
      .where(eq(products.category, targetCat.slug)),
    db.delete(categories)
      .where(eq(categories.id, id)),
  ]);
}

export async function getProducts(db: AppDb): Promise<ProductWithRelations[]> {
  const result = await db.query.products.findMany({
    with: {
      tones: true,
      productImages: {
        orderBy: (imgs, { asc }) => [asc(imgs.sortOrder)],
      },
    },
    orderBy: (prods, { desc }) => [desc(prods.createdAt)],
  });
  return result as ProductWithRelations[];
}

export async function getProductById(db: AppDb, id: string): Promise<ProductWithRelations | undefined> {
  const result = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      tones: true,
      productImages: {
        orderBy: (imgs, { asc }) => [asc(imgs.sortOrder)],
      },
    },
  });
  return result as ProductWithRelations | undefined;
}

export async function toggleProductStock(db: AppDb, id: string, inStock: boolean): Promise<void> {
  await db.update(products)
    .set({ inStock })
    .where(eq(products.id, id))
    .run();
}

export async function updateProductStock(db: AppDb, id: string, stock: number, inStock?: boolean): Promise<void> {
  const safeStock = Math.max(0, Math.floor(stock));
  const safeInStock = inStock !== undefined ? inStock : safeStock > 0;
  await db.update(products)
    .set({ stock: safeStock, inStock: safeInStock, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id))
    .run();
}

export async function toggleToneStock(db: AppDb, id: string, inStock: boolean): Promise<void> {
  await db.update(tones)
    .set({ inStock })
    .where(eq(tones.id, id))
    .run();
}

export async function updateToneStock(db: AppDb, id: string, stock: number, inStock?: boolean): Promise<void> {
  const safeStock = Math.max(0, Math.floor(stock));
  const safeInStock = inStock !== undefined ? inStock : safeStock > 0;
  await db.update(tones)
    .set({ stock: safeStock, inStock: safeInStock })
    .where(eq(tones.id, id))
    .run();
}

export async function deleteProduct(db: AppDb, id: string): Promise<void> {
  await db.delete(products)
    .where(eq(products.id, id))
    .run();
}

export async function createProduct(
  db: AppDb,
  data: ProductInput,
  tonesData: ToneInput[] = [],
  imagesData: ProductImageInput[] = []
): Promise<{ id: string }> {
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const parsedPrice = typeof data.price === 'number' ? data.price : (parseFloat(String(data.price)) || 0);
  const derivedMainImage = imagesData.length > 0 ? imagesData[0]?.url || '' : (data.mainImage || '');
  const parsedStock = data.stock !== undefined ? Math.max(0, parseInt(String(data.stock), 10) || 0) : 10;
  const isStockValid = data.inStock !== undefined ? Boolean(data.inStock) : parsedStock > 0;

  const statements: BatchItem<'sqlite'>[] = [
    db.insert(products).values({
      id: productId,
      name: data.name,
      price: parsedPrice,
      description: data.description || '',
      category: data.category,
      mainImage: derivedMainImage,
      isNew: Boolean(data.isNew),
      isFeatured: Boolean(data.isFeatured),
      inStock: isStockValid,
      stock: parsedStock,
      createdAt: now,
      updatedAt: now,
    }),
  ];

  if (tonesData && tonesData.length > 0) {
    statements.push(
      db.insert(tones).values(
        tonesData.map(t => {
          const toneStock = t.stock !== undefined ? Math.max(0, parseInt(String(t.stock), 10) || 0) : 10;
          return {
            id: crypto.randomUUID(),
            name: t.name,
            hex: t.hex,
            image: t.image,
            inStock: t.inStock !== undefined ? Boolean(t.inStock) : toneStock > 0,
            stock: toneStock,
            productId,
          };
        })
      )
    );
  }

  if (imagesData && imagesData.length > 0) {
    statements.push(
      db.insert(productImages).values(
        imagesData.map((img, i) => ({
          id: crypto.randomUUID(),
          productId,
          url: img.url,
          sortOrder: img.sortOrder !== undefined ? img.sortOrder : i,
          altText: img.altText || null,
          createdAt: now,
          updatedAt: now,
        }))
      )
    );
  }

  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

  return { id: productId };
}

export async function updateProduct(
  db: AppDb,
  id: string,
  data: ProductInput,
  tonesData: ToneInput[] = [],
  imagesData: ProductImageInput[] = []
): Promise<{ id: string }> {
  const derivedMainImage = imagesData.length > 0 ? imagesData[0]?.url || '' : (data.mainImage || '');
  if (!derivedMainImage) {
    throw new Error('Debe haber al menos una imagen principal o en galería');
  }

  const now = new Date().toISOString();
  const parsedPrice = typeof data.price === 'number' ? data.price : (parseFloat(String(data.price)) || 0);
  const parsedStock = data.stock !== undefined ? Math.max(0, parseInt(String(data.stock), 10) || 0) : 10;
  const isStockValid = data.inStock !== undefined ? Boolean(data.inStock) : parsedStock > 0;

  const statements: BatchItem<'sqlite'>[] = [
    db.delete(tones).where(eq(tones.productId, id)),
    db.delete(productImages).where(eq(productImages.productId, id)),
    db.update(products)
      .set({
        name: data.name,
        price: parsedPrice,
        description: data.description || '',
        category: data.category,
        mainImage: derivedMainImage,
        isNew: Boolean(data.isNew),
        isFeatured: Boolean(data.isFeatured),
        inStock: isStockValid,
        stock: parsedStock,
        updatedAt: now,
      })
      .where(eq(products.id, id)),
  ];

  if (tonesData && tonesData.length > 0) {
    statements.push(
      db.insert(tones).values(
        tonesData.map(t => {
          const toneStock = t.stock !== undefined ? Math.max(0, parseInt(String(t.stock), 10) || 0) : 10;
          return {
            id: crypto.randomUUID(),
            name: t.name,
            hex: t.hex,
            image: t.image,
            inStock: t.inStock !== undefined ? Boolean(t.inStock) : toneStock > 0,
            stock: toneStock,
            productId: id,
          };
        })
      )
    );
  }

  if (imagesData && imagesData.length > 0) {
    statements.push(
      db.insert(productImages).values(
        imagesData.map((img, i) => ({
          id: crypto.randomUUID(),
          productId: id,
          url: img.url,
          sortOrder: img.sortOrder !== undefined ? img.sortOrder : i,
          altText: img.altText || null,
          createdAt: now,
          updatedAt: now,
        }))
      )
    );
  }

  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

  return { id };
}

export interface CreateOrderCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
}

export interface CreateOrderItemInput {
  productId: string;
  toneId?: string | null;
  quantity: number;
  price?: number;
}

export interface CreateOrderInput {
  customer: CreateOrderCustomerInput;
  items: CreateOrderItemInput[];
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated';
}

export async function generateNextOrderNumber(db: AppDb): Promise<string> {
  const latestOrder = await db.query.orders.findFirst({
    orderBy: (o, { desc: orderDesc }) => [orderDesc(o.createdAt)],
    columns: { orderNumber: true },
  });

  if (!latestOrder || !latestOrder.orderNumber) {
    return 'BF-1001';
  }

  const match = latestOrder.orderNumber.match(/BF-(\d+)/);
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `BF-${nextNum}`;
  }

  return `BF-${Date.now().toString().slice(-4)}`;
}

export async function createOrderWithInventoryCheck(
  db: AppDb,
  input: CreateOrderInput
): Promise<OrderWithItems> {
  const { customer, items } = input;

  if (!customer?.name?.trim()) throw new Error('El nombre del cliente es obligatorio');
  if (!customer?.phone?.trim()) throw new Error('El teléfono del cliente es obligatorio');
  if (!customer?.address?.trim()) throw new Error('La dirección de entrega es obligatoria');
  if (!customer?.city?.trim()) throw new Error('La ciudad de entrega es obligatoria');
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('El pedido debe incluir al menos un producto');
  }

  const orderId = crypto.randomUUID();
  const orderNumber = await generateNextOrderNumber(db);
  const now = new Date().toISOString();

  // 1. Obtener y validar disponibilidad de todos los productos y tonos
  const productIds = Array.from(new Set(items.map(item => item.productId)));

  const existingProducts = await db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, productIds),
    with: { tones: true },
  });

  const productMap = new Map(existingProducts.map(p => [p.id, p]));
  const toneMap = new Map<string, typeof tones.$inferSelect>();
  existingProducts.forEach(p => {
    (p.tones || []).forEach(t => toneMap.set(t.id, t));
  });

  let totalOrder = 0;
  const processedOrderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    toneId: string | null;
    productName: string;
    toneName: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl: string | null;
    createdAt: string;
  }> = [];

  const stockUpdateStatements: BatchItem<'sqlite'>[] = [];

  for (const item of items) {
    const qty = Math.floor(item.quantity);
    if (qty <= 0) {
      throw new Error('La cantidad de cada item debe ser mayor a cero');
    }

    const prod = productMap.get(item.productId);
    if (!prod) {
      throw new Error(`Producto no encontrado (ID: ${item.productId})`);
    }

    if (item.toneId) {
      const tone = toneMap.get(item.toneId);
      if (!tone || tone.productId !== prod.id) {
        throw new Error(`Tono no encontrado para el producto "${prod.name}"`);
      }

      if (tone.stock < qty || !tone.inStock) {
        throw new Error(
          `Stock insuficiente para "${prod.name} (${tone.name})". Disponibles: ${tone.stock}`
        );
      }

      const nextStock = tone.stock - qty;
      const nextInStock = nextStock > 0;

      // Actualizar memoria local para evitar race condition en el mismo pedido con items repetidos
      tone.stock = nextStock;
      tone.inStock = nextInStock;

      stockUpdateStatements.push(
        db.update(tones)
          .set({ stock: nextStock, inStock: nextInStock })
          .where(eq(tones.id, tone.id))
      );

      const effectivePrice = typeof item.price === 'number' && item.price >= 0 ? item.price : prod.price;
      const itemSubtotal = effectivePrice * qty;
      totalOrder += itemSubtotal;

      processedOrderItems.push({
        id: crypto.randomUUID(),
        orderId,
        productId: prod.id,
        toneId: tone.id,
        productName: prod.name,
        toneName: tone.name,
        price: effectivePrice,
        quantity: qty,
        subtotal: itemSubtotal,
        imageUrl: tone.image || prod.mainImage || null,
        createdAt: now,
      });
    } else {
      if (prod.stock < qty || !prod.inStock) {
        throw new Error(
          `Stock insuficiente para "${prod.name}". Disponibles: ${prod.stock}`
        );
      }

      const nextStock = prod.stock - qty;
      const nextInStock = nextStock > 0;

      prod.stock = nextStock;
      prod.inStock = nextInStock;

      stockUpdateStatements.push(
        db.update(products)
          .set({ stock: nextStock, inStock: nextInStock, updatedAt: now })
          .where(eq(products.id, prod.id))
      );

      const effectivePrice = typeof item.price === 'number' && item.price >= 0 ? item.price : prod.price;
      const itemSubtotal = effectivePrice * qty;
      totalOrder += itemSubtotal;

      processedOrderItems.push({
        id: crypto.randomUUID(),
        orderId,
        productId: prod.id,
        toneId: null,
        productName: prod.name,
        toneName: null,
        price: effectivePrice,
        quantity: qty,
        subtotal: itemSubtotal,
        imageUrl: prod.mainImage || null,
        createdAt: now,
      });
    }
  }

  // 2. Transacción atómica batch en Cloudflare D1
  const batchStatements: BatchItem<'sqlite'>[] = [
    ...stockUpdateStatements,
    db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      customerEmail: customer.email?.trim() || null,
      customerAddress: customer.address.trim(),
      customerCity: customer.city.trim(),
      customerNotes: customer.notes?.trim() || null,
      total: totalOrder,
      status: input.status || 'pending',
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(orderItems).values(processedOrderItems),
  ];

  await db.batch(batchStatements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

  const createdOrder = await getOrderById(db, orderId);
  if (!createdOrder) {
    throw new Error('Error al recuperar la orden creada');
  }

  return createdOrder;
}

export async function getOrders(db: AppDb, statusFilter?: string): Promise<OrderWithItems[]> {
  const result = await db.query.orders.findMany({
    where: statusFilter && statusFilter !== 'todos' ? eq(orders.status, statusFilter as any) : undefined,
    with: {
      items: true,
      payments: {
        orderBy: (p, { desc: pDesc }) => [pDesc(p.createdAt)],
      },
    },
    orderBy: (o, { desc: orderDesc }) => [orderDesc(o.createdAt)],
  });

  return result as OrderWithItems[];
}

export async function getOrderById(db: AppDb, id: string): Promise<OrderWithItems | undefined> {
  const result = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      payments: {
        orderBy: (p, { desc: pDesc }) => [pDesc(p.createdAt)],
      },
    },
  });

  return result as OrderWithItems | undefined;
}

export async function updateOrderStatus(
  db: AppDb,
  id: string,
  newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated',
  restock: boolean = false
): Promise<void> {
  const order = await getOrderById(db, id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  const now = new Date().toISOString();

  // Si se cancela y se solicita restaurar inventario
  if (newStatus === 'cancelled' && restock && order.status !== 'cancelled') {
    const restockStatements: BatchItem<'sqlite'>[] = [];

    for (const item of order.items) {
      if (item.toneId) {
        const tone = await db.query.tones.findFirst({
          where: eq(tones.id, item.toneId),
        });
        if (tone) {
          restockStatements.push(
            db.update(tones)
              .set({ stock: tone.stock + item.quantity, inStock: true })
              .where(eq(tones.id, tone.id))
          );
        }
      } else {
        const prod = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        if (prod) {
          restockStatements.push(
            db.update(products)
              .set({ stock: prod.stock + item.quantity, inStock: true, updatedAt: now })
              .where(eq(products.id, prod.id))
          );
        }
      }
    }

    restockStatements.push(
      db.update(orders)
        .set({ status: newStatus, updatedAt: now })
        .where(eq(orders.id, id))
    );

    await db.batch(restockStatements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
    return;
  }

  // Si estaba cancelado y pasa a un estado activo, conciliar stock
  if (order.status === 'cancelled' && newStatus !== 'cancelled') {
    await updateOrderWithInventoryReconciliation(db, id, { status: newStatus });
    return;
  }

  await db.update(orders)
    .set({ status: newStatus, updatedAt: now })
    .where(eq(orders.id, id))
    .run();
}

export interface UpdateOrderCustomerInput {
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string;
  city?: string;
  notes?: string | null;
}

export interface UpdateOrderItemInput {
  productId: string;
  toneId?: string | null;
  quantity: number;
  price?: number;
}

export interface UpdateOrderInput {
  customer?: UpdateOrderCustomerInput;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated';
  items?: UpdateOrderItemInput[];
}

export async function updateOrderWithInventoryReconciliation(
  db: AppDb,
  orderId: string,
  input: UpdateOrderInput
): Promise<OrderWithItems> {
  const existingOrder = await getOrderById(db, orderId);
  if (!existingOrder) {
    throw new Error('Pedido no encontrado');
  }

  const now = new Date().toISOString();
  const targetStatus = input.status || existingOrder.status;

  const oldIsActive = existingOrder.status !== 'cancelled';
  const newIsActive = targetStatus !== 'cancelled';

  const itemsToProcess = input.items !== undefined ? input.items : existingOrder.items.map(i => ({
    productId: i.productId,
    toneId: i.toneId,
    quantity: i.quantity,
    price: i.price,
  }));

  if (itemsToProcess.length === 0) {
    throw new Error('El pedido debe incluir al menos un producto');
  }

  // 1. Mapas de asignación de stock
  const oldQtyMap = new Map<string, number>();
  if (oldIsActive) {
    for (const item of existingOrder.items) {
      const key = item.toneId ? `tone:${item.toneId}` : `prod:${item.productId}`;
      oldQtyMap.set(key, (oldQtyMap.get(key) || 0) + item.quantity);
    }
  }

  const newQtyMap = new Map<string, number>();
  if (newIsActive) {
    for (const item of itemsToProcess) {
      const qty = Math.floor(item.quantity);
      if (qty <= 0) {
        throw new Error('La cantidad de cada item debe ser mayor a cero');
      }
      const key = item.toneId ? `tone:${item.toneId}` : `prod:${item.productId}`;
      newQtyMap.set(key, (newQtyMap.get(key) || 0) + qty);
    }
  }

  // 2. Extraer todos los IDs de productos y tonos involucrados
  const allKeys = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
  const productIds = new Set<string>();
  itemsToProcess.forEach(i => productIds.add(i.productId));
  for (const k of allKeys) {
    if (k.startsWith('prod:')) productIds.add(k.replace('prod:', ''));
  }

  const dbProducts = await db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, Array.from(productIds)),
    with: { tones: true },
  });

  const productMap = new Map(dbProducts.map(p => [p.id, p]));
  const toneMap = new Map<string, typeof tones.$inferSelect>();
  dbProducts.forEach(p => {
    (p.tones || []).forEach(t => toneMap.set(t.id, t));
  });

  // Asegurar que tonos individuales también estén cargados
  for (const k of allKeys) {
    if (k.startsWith('tone:')) {
      const toneId = k.replace('tone:', '');
      if (!toneMap.has(toneId)) {
        const foundTone = await db.query.tones.findFirst({ where: eq(tones.id, toneId) });
        if (foundTone) toneMap.set(foundTone.id, foundTone);
      }
    }
  }

  // 3. Validar deltas de inventario y preparar sentencias de actualización de stock
  const stockUpdateStatements: BatchItem<'sqlite'>[] = [];

  for (const key of allKeys) {
    const oldQty = oldQtyMap.get(key) || 0;
    const newQty = newQtyMap.get(key) || 0;
    const netDelta = newQty - oldQty; // >0: requerimos más stock; <0: devolvemos stock

    if (netDelta === 0) continue;

    if (key.startsWith('tone:')) {
      const toneId = key.replace('tone:', '');
      const tone = toneMap.get(toneId);
      if (!tone) throw new Error(`Tono no encontrado en inventario (ID: ${toneId})`);

      if (netDelta > 0 && tone.stock < netDelta) {
        throw new Error(
          `Stock insuficiente para el tono "${tone.name}". Disponibles: ${tone.stock}, adicionales requeridas: ${netDelta}`
        );
      }

      const nextStock = tone.stock - netDelta;
      tone.stock = nextStock;
      tone.inStock = nextStock > 0;
      stockUpdateStatements.push(
        db.update(tones)
          .set({ stock: nextStock, inStock: nextStock > 0 })
          .where(eq(tones.id, tone.id))
      );
    } else {
      const prodId = key.replace('prod:', '');
      const prod = productMap.get(prodId);
      if (!prod) throw new Error(`Producto no encontrado en inventario (ID: ${prodId})`);

      if (netDelta > 0 && prod.stock < netDelta) {
        throw new Error(
          `Stock insuficiente para el producto "${prod.name}". Disponibles: ${prod.stock}, adicionales requeridas: ${netDelta}`
        );
      }

      const nextStock = prod.stock - netDelta;
      prod.stock = nextStock;
      prod.inStock = nextStock > 0;
      stockUpdateStatements.push(
        db.update(products)
          .set({ stock: nextStock, inStock: nextStock > 0, updatedAt: now })
          .where(eq(products.id, prod.id))
      );
    }
  }

  // 4. Preparar nuevos order items
  let newTotal = 0;
  const processedOrderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    toneId: string | null;
    productName: string;
    toneName: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl: string | null;
    createdAt: string;
  }> = [];

  for (const item of itemsToProcess) {
    const qty = Math.floor(item.quantity);
    const prod = productMap.get(item.productId);
    if (!prod) throw new Error(`Producto no encontrado (ID: ${item.productId})`);

    let toneName: string | null = null;
    let imageUrl = prod.mainImage || null;

    if (item.toneId) {
      const tone = toneMap.get(item.toneId);
      if (!tone || tone.productId !== prod.id) {
        throw new Error(`Tono no válido para el producto "${prod.name}"`);
      }
      toneName = tone.name;
      imageUrl = tone.image || prod.mainImage || null;
    }

    const effectivePrice = typeof item.price === 'number' && item.price >= 0 ? item.price : prod.price;
    const subtotal = effectivePrice * qty;
    newTotal += subtotal;

    processedOrderItems.push({
      id: crypto.randomUUID(),
      orderId,
      productId: prod.id,
      toneId: item.toneId || null,
      productName: prod.name,
      toneName,
      price: effectivePrice,
      quantity: qty,
      subtotal,
      imageUrl,
      createdAt: now,
    });
  }

  // 5. Transacción atómica batch
  const customer = input.customer;
  const batchStatements: BatchItem<'sqlite'>[] = [
    ...stockUpdateStatements,
    db.delete(orderItems).where(eq(orderItems.orderId, orderId)),
    db.insert(orderItems).values(processedOrderItems),
    db.update(orders)
      .set({
        customerName: customer?.name !== undefined ? customer.name.trim() : existingOrder.customerName,
        customerPhone: customer?.phone !== undefined ? customer.phone.trim() : existingOrder.customerPhone,
        customerEmail: customer?.email !== undefined ? (customer.email?.trim() || null) : existingOrder.customerEmail,
        customerAddress: customer?.address !== undefined ? customer.address.trim() : existingOrder.customerAddress,
        customerCity: customer?.city !== undefined ? customer.city.trim() : existingOrder.customerCity,
        customerNotes: customer?.notes !== undefined ? (customer.notes?.trim() || null) : existingOrder.customerNotes,
        total: newTotal,
        status: targetStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId)),
  ];

  await db.batch(batchStatements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);

  const updatedOrder = await getOrderById(db, orderId);
  if (!updatedOrder) {
    throw new Error('Error al recuperar pedido actualizado');
  }

  return updatedOrder;
}

export async function deleteOrder(
  db: AppDb,
  orderId: string,
  restock: boolean = true
): Promise<void> {
  const order = await getOrderById(db, orderId);
  if (!order) return;

  const statements: BatchItem<'sqlite'>[] = [];
  const now = new Date().toISOString();

  if (restock && order.status !== 'cancelled') {
    for (const item of order.items) {
      if (item.toneId) {
        const tone = await db.query.tones.findFirst({
          where: eq(tones.id, item.toneId),
        });
        if (tone) {
          statements.push(
            db.update(tones)
              .set({ stock: tone.stock + item.quantity, inStock: true })
              .where(eq(tones.id, tone.id))
          );
        }
      } else {
        const prod = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        if (prod) {
          statements.push(
            db.update(products)
              .set({ stock: prod.stock + item.quantity, inStock: true, updatedAt: now })
              .where(eq(products.id, prod.id))
          );
        }
      }
    }
  }

  statements.push(db.delete(orders).where(eq(orders.id, orderId)));
  await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
}

export interface AddPaymentInput {
  amount: number;
  method?: string;
  reference?: string | null;
  notes?: string | null;
}

export async function addOrderPayment(
  db: AppDb,
  orderId: string,
  input: AddPaymentInput
): Promise<OrderPayment> {
  const order = await getOrderById(db, orderId);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  const amount = Number(input.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto del abono debe ser mayor a cero');
  }

  const paymentId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(orderPayments).values({
    id: paymentId,
    orderId,
    amount,
    method: (input.method || 'efectivo').trim(),
    reference: input.reference?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt: now,
  }).run();

  const created = await db.query.orderPayments.findFirst({
    where: eq(orderPayments.id, paymentId),
  });

  if (!created) {
    throw new Error('Error al registrar el abono');
  }

  return created;
}

export async function getOrderPayments(db: AppDb, orderId: string): Promise<OrderPayment[]> {
  const result = await db.query.orderPayments.findMany({
    where: eq(orderPayments.orderId, orderId),
    orderBy: (p, { desc: pDesc }) => [pDesc(p.createdAt)],
  });
  return result;
}

export async function deleteOrderPayment(db: AppDb, paymentId: string): Promise<void> {
  await db.delete(orderPayments).where(eq(orderPayments.id, paymentId)).run();
}

