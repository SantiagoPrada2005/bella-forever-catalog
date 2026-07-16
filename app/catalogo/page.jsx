import React from 'react';
import { prisma } from '../../src/lib/db';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Obtener productos de PostgreSQL con sus tonos correspondientes
  const products = await prisma.product.findMany({
    include: {
      tones: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <CatalogClient initialProducts={products} />;
}
