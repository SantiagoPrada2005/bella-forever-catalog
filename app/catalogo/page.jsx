import React from 'react';
import { getDb } from '../../src/lib/db';
import { categories as categoriesTable } from '../../src/db/schema';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const db = getDb();
  const [productsList, dbCategories] = await Promise.all([
    db.query.products.findMany({
      with: {
        tones: true,
        productImages: {
          orderBy: (productImages, { asc }) => [asc(productImages.sortOrder)],
        },
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    }),
    db.select().from(categoriesTable).all(),
  ]);

  return <CatalogClient initialProducts={productsList} initialCategories={dbCategories} />;
}
