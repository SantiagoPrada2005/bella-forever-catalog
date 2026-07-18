import React from 'react';
import { getDb } from '../../src/lib/db';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const db = getDb();
  const products = await db.query.products.findMany({
    with: {
      tones: true,
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  return <CatalogClient initialProducts={products} />;
}
