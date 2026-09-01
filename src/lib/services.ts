import { eq, desc, asc } from 'drizzle-orm';
import { products, tones, categories, productImages } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export function slugify(text: string) {
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

export async function getCategories(db: any) {
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

export async function createCategory(db: any, name: string) {
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

export async function updateCategory(db: any, id: string, name: string) {
  const now = new Date().toISOString();
  const slug = id === 'sin-categoria' ? 'sin-categoria' : slugify(name);

  await db.update(categories)
    .set({ name, slug, updatedAt: now })
    .where(eq(categories.id, id))
    .run();

  return { id, name, slug };
}

export async function deleteCategory(db: any, id: string) {
  if (id === 'sin-categoria') {
    throw new Error('No se puede eliminar la categoría por defecto');
  }
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
}

export async function getProducts(db: any) {
  return await db.query.products.findMany({
    with: {
      tones: true,
      productImages: {
        orderBy: (imgs: any, { asc }: any) => [asc(imgs.sortOrder)],
      },
    },
    orderBy: (prods: any, { desc }: any) => [desc(prods.createdAt)],
  });
}

export async function getProductById(db: any, id: string) {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      tones: true,
      productImages: {
        orderBy: (imgs: any, { asc }: any) => [asc(imgs.sortOrder)],
      },
    },
  });
}

export async function toggleProductStock(db: any, id: string, inStock: boolean) {
  await db.update(products)
    .set({ inStock })
    .where(eq(products.id, id))
    .run();
}

export async function toggleToneStock(db: any, id: string, inStock: boolean) {
  await db.update(tones)
    .set({ inStock })
    .where(eq(tones.id, id))
    .run();
}

export async function deleteProduct(db: any, id: string) {
  await db.delete(products)
    .where(eq(products.id, id))
    .run();
}

export async function createProduct(db: any, data: any, tonesData: any[] = [], imagesData: any[] = []) {
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const derivedMainImage = imagesData.length > 0 ? imagesData[0].url : data.mainImage;

  await db.insert(products).values({
    id: productId,
    name: data.name,
    price: parseFloat(data.price),
    description: data.description || '',
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

  if (imagesData && imagesData.length > 0) {
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

  return { id: productId };
}

export async function updateProduct(db: any, id: string, data: any, tonesData: any[] = [], imagesData: any[] = []) {
  if (!imagesData || imagesData.length === 0) {
    throw new Error('Debe haber al menos una imagen');
  }

  const now = new Date().toISOString();
  const derivedMainImage = imagesData[0].url;

  await db.delete(tones)
    .where(eq(tones.productId, id))
    .run();

  await db.delete(productImages)
    .where(eq(productImages.productId, id))
    .run();

  await db.update(products)
    .set({
      name: data.name,
      price: parseFloat(data.price),
      description: data.description || '',
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

  if (imagesData && imagesData.length > 0) {
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

  return { id };
}
