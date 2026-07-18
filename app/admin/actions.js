'use server';

import { getDb } from '../../src/lib/db';
import { products, tones } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  const db = getDb();
  return await db.query.products.findMany({
    with: {
      tones: true,
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
}

export async function getProductById(id) {
  const db = getDb();
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      tones: true,
    },
  });
}

export async function toggleProductStock(id, inStock) {
  const db = getDb();
  await db.update(products)
    .set({ inStock })
    .where(eq(products.id, id))
    .run();
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

export async function toggleToneStock(id, inStock) {
  const db = getDb();
  await db.update(tones)
    .set({ inStock })
    .where(eq(tones.id, id))
    .run();
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

export async function deleteProduct(id) {
  const db = getDb();
  await db.delete(products)
    .where(eq(products.id, id))
    .run();
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

export async function createProduct(data, tonesData) {
  const db = getDb();
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();

  await db.insert(products).values({
    id: productId,
    name: data.name,
    price: parseFloat(data.price),
    description: data.description,
    category: data.category,
    mainImage: data.mainImage,
    isNew: data.isNew || false,
    isFeatured: data.isFeatured || false,
    inStock: data.inStock !== undefined ? data.inStock : true,
    createdAt: now,
    updatedAt: now,
  }).run();

  if (tonesData && tonesData.length > 0) {
    await db.insert(tones).values(
      tonesData.map(t => ({
        id: crypto.randomUUID(),
        name: t.name,
        hex: t.hex,
        image: t.image,
        inStock: t.inStock !== undefined ? t.inStock : true,
        productId,
      }))
    ).run();
  }

  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return { id: productId };
}

export async function updateProduct(id, data, tonesData) {
  const db = getDb();
  const now = new Date().toISOString();

  await db.delete(tones)
    .where(eq(tones.productId, id))
    .run();

  await db.update(products)
    .set({
      name: data.name,
      price: parseFloat(data.price),
      description: data.description,
      category: data.category,
      mainImage: data.mainImage,
      isNew: data.isNew || false,
      isFeatured: data.isFeatured || false,
      inStock: data.inStock !== undefined ? data.inStock : true,
      updatedAt: now,
    })
    .where(eq(products.id, id))
    .run();

  if (tonesData && tonesData.length > 0) {
    await db.insert(tones).values(
      tonesData.map(t => ({
        id: crypto.randomUUID(),
        name: t.name,
        hex: t.hex,
        image: t.image,
        inStock: t.inStock !== undefined ? t.inStock : true,
        productId: id,
      }))
    ).run();
  }

  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return { id };
}
