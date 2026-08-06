'use server';

import { getDb } from '../../src/lib/db';
import { products, tones, categories, productImages } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function slugify(text) {
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

export async function getCategories() {
  const db = getDb();
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

export async function createCategory(name) {
  const db = getDb();
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

  revalidatePath('/admin');
  revalidatePath('/catalogo');
  return { id, slug };
}

export async function updateCategory(id, name) {
  const db = getDb();
  const now = new Date().toISOString();
  const slug = id === 'sin-categoria' ? 'sin-categoria' : slugify(name);

  await db.update(categories)
    .set({ name, slug, updatedAt: now })
    .where(eq(categories.id, id))
    .run();

  revalidatePath('/admin');
  revalidatePath('/catalogo');
}

export async function deleteCategory(id) {
  if (id === 'sin-categoria') {
    throw new Error('No se puede eliminar la categoría por defecto');
  }
  const db = getDb();
  const targetCat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!targetCat) return;

  await db.update(products)
    .set({ category: 'sin-categoria' })
    .where(eq(products.category, targetCat.slug))
    .run();

  await db.delete(categories)
    .where(eq(categories.id, id))
    .run();

  revalidatePath('/admin');
  revalidatePath('/catalogo');
}


export async function getProducts() {
  const db = getDb();
  return await db.query.products.findMany({
    with: {
      tones: true,
      productImages: {
        orderBy: (productImages, { asc }) => [asc(productImages.sortOrder)],
      },
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
      productImages: {
        orderBy: (productImages, { asc }) => [asc(productImages.sortOrder)],
      },
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

export async function createProduct(data, tonesData, imagesData = []) {
  const db = getDb();
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();

  // Derive mainImage from first gallery image, fall back to explicit data.mainImage
  const derivedMainImage = imagesData.length > 0 ? imagesData[0].url : data.mainImage;

  await db.insert(products).values({
    id: productId,
    name: data.name,
    price: parseFloat(data.price),
    description: data.description,
    category: data.category,
    mainImage: derivedMainImage,
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

  if (imagesData.length > 0) {
    await db.insert(productImages).values(
      imagesData.map((img, i) => ({
        id: crypto.randomUUID(),
        productId,
        url: img.url,
        sortOrder: img.sortOrder !== undefined ? img.sortOrder : i,
        altText: img.altText || null,
        createdAt: now,
        updatedAt: now,
      }))
    ).run();
  }

  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return { id: productId };
}

export async function updateProduct(id, data, tonesData, imagesData = []) {
  const db = getDb();
  const now = new Date().toISOString();

  // Derive mainImage from first gallery image, fall back to explicit data.mainImage
  const derivedMainImage = imagesData.length > 0 ? imagesData[0].url : data.mainImage;

  await db.delete(tones)
    .where(eq(tones.productId, id))
    .run();

  // Delete existing productImages (replace-all strategy)
  await db.delete(productImages)
    .where(eq(productImages.productId, id))
    .run();

  await db.update(products)
    .set({
      name: data.name,
      price: parseFloat(data.price),
      description: data.description,
      category: data.category,
      mainImage: derivedMainImage,
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

  if (imagesData.length > 0) {
    await db.insert(productImages).values(
      imagesData.map((img, i) => ({
        id: crypto.randomUUID(),
        productId: id,
        url: img.url,
        sortOrder: img.sortOrder !== undefined ? img.sortOrder : i,
        altText: img.altText || null,
        createdAt: now,
        updatedAt: now,
      }))
    ).run();
  }

  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return { id };
}
