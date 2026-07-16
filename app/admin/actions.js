'use server';

import { prisma } from '../../src/lib/db';
import { revalidatePath } from 'next/cache';

// Obtener todos los productos
export async function getProducts() {
  return await prisma.product.findMany({
    include: {
      tones: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Obtener un producto por ID
export async function getProductById(id) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      tones: true,
    },
  });
}

// Alternar stock del producto
export async function toggleProductStock(id, inStock) {
  await prisma.product.update({
    where: { id },
    data: { inStock },
  });
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

// Alternar stock de un tono
export async function toggleToneStock(id, inStock) {
  await prisma.tone.update({
    where: { id },
    data: { inStock },
  });
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

// Eliminar un producto
export async function deleteProduct(id) {
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath('/catalogo');
  revalidatePath('/admin');
}

// Crear un producto
export async function createProduct(data, tones) {
  const created = await prisma.product.create({
    data: {
      name: data.name,
      price: parseFloat(data.price),
      description: data.description,
      category: data.category,
      mainImage: data.mainImage,
      isNew: data.isNew || false,
      isFeatured: data.isFeatured || false,
      inStock: data.inStock !== undefined ? data.inStock : true,
      tones: {
        create: tones.map(t => ({
          name: t.name,
          hex: t.hex,
          image: t.image,
          inStock: t.inStock !== undefined ? t.inStock : true,
        })),
      },
    },
  });
  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return created;
}

// Actualizar un producto
export async function updateProduct(id, data, tones) {
  // Primero eliminamos los tonos existentes para volver a crearlos
  await prisma.tone.deleteMany({
    where: { productId: id },
  });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      price: parseFloat(data.price),
      description: data.description,
      category: data.category,
      mainImage: data.mainImage,
      isNew: data.isNew || false,
      isFeatured: data.isFeatured || false,
      inStock: data.inStock !== undefined ? data.inStock : true,
      tones: {
        create: tones.map(t => ({
          name: t.name,
          hex: t.hex,
          image: t.image,
          inStock: t.inStock !== undefined ? t.inStock : true,
        })),
      },
    },
  });
  revalidatePath('/catalogo');
  revalidatePath('/admin');
  return updated;
}
