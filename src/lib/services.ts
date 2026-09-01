import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import {
  products,
  tones,
  categories,
  productImages,
  type ProductWithRelations,
  type Category,
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
}

export interface ToneInput {
  name: string;
  hex: string;
  image: string;
  inStock?: boolean;
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

  if (statements.length === 1 && statements[0]) {
    await statements[0];
  } else {
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  }

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

export async function toggleToneStock(db: AppDb, id: string, inStock: boolean): Promise<void> {
  await db.update(tones)
    .set({ inStock })
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
      inStock: data.inStock !== undefined ? Boolean(data.inStock) : true,
      createdAt: now,
      updatedAt: now,
    }),
  ];

  if (tonesData && tonesData.length > 0) {
    statements.push(
      db.insert(tones).values(
        tonesData.map(t => ({
          id: crypto.randomUUID(),
          name: t.name,
          hex: t.hex,
          image: t.image,
          inStock: t.inStock !== undefined ? Boolean(t.inStock) : true,
          productId,
        }))
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

  if (statements.length === 1 && statements[0]) {
    await statements[0];
  } else {
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  }

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
        inStock: data.inStock !== undefined ? Boolean(data.inStock) : true,
        updatedAt: now,
      })
      .where(eq(products.id, id)),
  ];

  if (tonesData && tonesData.length > 0) {
    statements.push(
      db.insert(tones).values(
        tonesData.map(t => ({
          id: crypto.randomUUID(),
          name: t.name,
          hex: t.hex,
          image: t.image,
          inStock: t.inStock !== undefined ? Boolean(t.inStock) : true,
          productId: id,
        }))
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

