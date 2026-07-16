import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');
  
  // Leer products.json
  const filePath = path.join(__dirname, '../src/data/products.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const products = JSON.parse(fileData);

  // Limpiar base de datos
  await prisma.tone.deleteMany({});
  await prisma.product.deleteMany({});
  
  console.log('Base de datos limpiada.');

  const seenProductIds = new Set();
  const seenToneIds = new Set();

  for (const prod of products) {
    if (seenProductIds.has(prod.id)) {
      continue;
    }
    seenProductIds.add(prod.id);

    const createdProduct = await prisma.product.create({
      data: {
        id: prod.id,
        name: prod.name,
        price: prod.price,
        description: prod.description,
        category: prod.category,
        mainImage: prod.mainImage,
        isNew: prod.isNew || false,
        isFeatured: prod.isFeatured || false,
        inStock: prod.inStock !== undefined ? prod.inStock : true,
      }
    });

    console.log(`Producto creado: ${createdProduct.name}`);

    if (prod.tones && prod.tones.length > 0) {
      for (const tone of prod.tones) {
        if (seenToneIds.has(tone.id)) {
          continue;
        }
        seenToneIds.add(tone.id);

        await prisma.tone.create({
          data: {
            id: tone.id,
            name: tone.name,
            hex: tone.hex,
            image: tone.image,
            inStock: tone.inStock !== undefined ? tone.inStock : true,
            productId: createdProduct.id
          }
        });
      }
      console.log(`  Variantes de tono creadas para: ${createdProduct.name}`);
    }
  }

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
