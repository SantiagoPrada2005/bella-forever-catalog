import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const nodeRequire = createRequire(import.meta.url);
const sharp = nodeRequire('../node_modules/.pnpm/sharp@0.35.5_@types+node@22.20.5/node_modules/sharp');

const IMAGES_DIR = path.resolve('public/images');
const TEMP_DIR = path.resolve('/tmp/bella_convert');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Mapeo semántico de los archivos originales a nombres web optimizados
const MAPPING = [
  {
    original: 'A002_09051914_C215_still.HEIC',
    target: 'hero-silvy-blush.webp',
    description: 'Silvy Loaiza sosteniendo rubor en barra'
  },
  {
    original: 'A002_09051923_C221_still.HEIC',
    target: 'hero-silvy-mascara.webp',
    description: 'Silvy Loaiza sosteniendo pestañina waterproof'
  },
  {
    original: 'A002_09201937_C331_still.HEIC',
    target: 'gallery-gold-eyes.webp',
    description: 'Modelo sosteniendo kit Bold Eyes'
  },
  {
    original: 'A002_09201938_C333_still.HEIC',
    target: 'gallery-lip-plump.webp',
    description: 'Modelo sosteniendo Lip Plump'
  },
  {
    original: 'A002_09201938_C333_still 2.HEIC',
    target: 'gallery-lip-plump-pose.webp',
    description: 'Modelo en pose con Lip Plump'
  },
  {
    original: 'A002_09201955_C339_still.HEIC',
    target: 'gallery-mirror.webp',
    description: 'Modelo en tocador iluminado aplicándose labial'
  },
  {
    original: 'A002_09202007_C346_still.HEIC',
    target: 'gallery-collection-flatlay.webp',
    description: 'Flatlay con colección completa de productos Bella Forever'
  }
];

async function processImages() {
  console.log('🚀 Iniciando pipeline de optimización de imágenes...');
  
  for (const item of MAPPING) {
    const inputPath = path.join(IMAGES_DIR, item.original);
    const outputPath = path.join(IMAGES_DIR, item.target);
    const tempPngPath = path.join(TEMP_DIR, `${path.basename(item.target, '.webp')}.png`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️ Archivo de origen no encontrado: ${item.original}`);
      continue;
    }

    const originalStats = fs.statSync(inputPath);
    console.log(`\n📸 Procesando: ${item.original} (${item.description})`);

    // 1. Decodificación con sips (soporta HEIC nativo de Apple) a PNG temporal sin pérdidas
    execSync(`sips -s format png "${inputPath}" --out "${tempPngPath}" > /dev/null 2>&1`);

    // 2. Compresión y optimización con Sharp a WebP
    const info = await sharp(tempPngPath)
      .rotate() // Auto-orientación EXIF
      .toColorspace('srgb') // Normalización de espacio de color
      .webp({
        quality: 82,
        effort: 6,
        smartSubsample: true
      })
      .toFile(outputPath);

    // 3. Limpieza de PNG temporal
    if (fs.existsSync(tempPngPath)) {
      fs.unlinkSync(tempPngPath);
    }

    const originalKb = (originalStats.size / 1024).toFixed(1);
    const optimizedKb = (info.size / 1024).toFixed(1);
    const reduction = ((1 - info.size / originalStats.size) * 100).toFixed(1);

    console.log(`✅ Creado: ${item.target} [${info.width}x${info.height}]`);
    console.log(`   Tamaño original: ${originalKb} KB -> Optimizado: ${optimizedKb} KB (${reduction}% de reducción)`);
  }

  // Eliminar directorio temporal
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n🎉 Todas las imágenes se han procesado exitosamente.');
}

processImages().catch(err => {
  console.error('❌ Error durante la optimización:', err);
  process.exit(1);
});
