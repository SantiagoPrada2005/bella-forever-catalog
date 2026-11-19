import { CONFIG } from '../../config';
import type { ProductWithRelations, Tone } from '../../db/schema';

export interface EnrichedMetaAttributes {
  brand: string;
  mpn: string;
  description: string;
  richTextDescription: string;
  googleProductCategory: string;
  fbProductCategory: string;
  gender: 'female' | 'male' | 'unisex';
  ageGroup: 'adult' | 'all ages';
  color?: string;
  size?: string;
  capacity?: string;
  material?: string;
  shippingWeight: string;
  bodyParts: string[];
  productForm?: string;
  skinType?: string;
  skinCareConcerns: string[];
  scents: string[];
  ingredients: string[];
  spfValue?: string;
  instructions: string[];
  standardFeatures: string[];
  additionalFeatures: string[];
  productTags: string[];
  keywords: string[];
}

const KNOWN_BRANDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\btrendy\b/i, label: 'Trendy' },
  { pattern: /\bbeauty\s+glazed\b/i, label: 'Beauty Glazed' },
  { pattern: /\bruby\s+rose\b/i, label: 'Ruby Rose' },
  { pattern: /\batenea\b/i, label: 'Atenea' },
  { pattern: /\bmontoc\b/i, label: 'Montoc' },
  { pattern: /\bani-?k\b/i, label: 'Ani-K' },
  { pattern: /\bdolce\s+bella\b/i, label: 'Dolce Bella' },
  { pattern: /\bsamy\b/i, label: 'Samy' },
  { pattern: /\bvogue\b/i, label: 'Vogue' },
  { pattern: /\braquel\b/i, label: 'Raquel' },
  { pattern: /\bkiss\s+beauty\b/i, label: 'Kiss Beauty' },
  { pattern: /\bushas\b/i, label: 'Ushas' },
];

const COLOR_CANDIDATES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\btransparente\b/i, label: 'Transparente' },
  { pattern: /\bm[aá]rmol\b/i, label: 'Mármol' },
  { pattern: /\brojo\b/i, label: 'Rojo' },
  { pattern: /\brosa(?:do)?\b/i, label: 'Rosa' },
  { pattern: /\bmorado\b/i, label: 'Morado' },
  { pattern: /\bverde\b/i, label: 'Verde' },
  { pattern: /\bdorado\b/i, label: 'Dorado' },
  { pattern: /\bnegro\b/i, label: 'Negro' },
  { pattern: /\bchocolate\b/i, label: 'Chocolate' },
  { pattern: /\bcherry\b/i, label: 'Cherry' },
  { pattern: /\bdurazno\b/i, label: 'Durazno' },
  { pattern: /\bcoral\b/i, label: 'Coral' },
  { pattern: /\btierra\b/i, label: 'Tierra' },
  { pattern: /\bpastel\b/i, label: 'Pastel' },
  { pattern: /\bnude\b/i, label: 'Nude' },
  { pattern: /\bsand[ií]a\b/i, label: 'Sandía' },
];

const SCENT_CANDIDATES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bsand[ií]a\b/i, label: 'Sandía' },
  { pattern: /\bchocolate\b/i, label: 'Chocolate' },
  { pattern: /\bmenta\b/i, label: 'Menta' },
  { pattern: /\baloe\s+vera\b/i, label: 'Aloe Vera' },
  { pattern: /\bfloral\b/i, label: 'Floral' },
  { pattern: /\bfrutal\b/i, label: 'Frutal' },
  { pattern: /\b(?:cherry|cereza)\b/i, label: 'Cereza' },
  { pattern: /\bdurazno\b/i, label: 'Durazno' },
  { pattern: /\bcoco\b/i, label: 'Coco' },
  { pattern: /\bvainilla\b/i, label: 'Vainilla' },
];

const INGREDIENT_CANDIDATES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\baloe\s+vera\b/i, label: 'Aloe Vera' },
  { pattern: /\bvitamina\s+e\b/i, label: 'Vitamina E' },
  { pattern: /\b[aá]cido\s+hialur[oó]nico\b/i, label: 'Ácido Hialurónico' },
  { pattern: /\bcol[aá]geno\b/i, label: 'Colágeno' },
  { pattern: /\bniacinamida\b/i, label: 'Niacinamida' },
  { pattern: /\baceites?\s+hidratantes?\b/i, label: 'Aceites Hidratantes' },
  { pattern: /\bglicerina\b/i, label: 'Glicerina' },
];

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function uniqueNonEmpty(values: Array<string | undefined | null>, limit?: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const val of values) {
    const clean = (val || '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clean);
      if (limit && out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Formatea el nombre del tono evitando duplicaciones como "Tono Tono 01".
 */
export function formatToneLabel(toneName: string): string {
  const clean = toneName.trim();
  if (!clean) return '';
  if (/^tono\b/i.test(clean)) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `Tono ${clean}`;
}

/**
 * Normaliza la descripción en texto plano: corrige textos en MAYÚSCULAS y amplía textos muy cortos.
 */
export function normalizePlainDescription(
  rawDesc: string | null | undefined,
  productName: string,
  categoryName: string,
  brand: string
): string {
  let clean = stripHtmlTags(rawDesc || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return `${productName} de ${brand}, ${categoryName.toLowerCase()} disponible en ${CONFIG.brandName} ${CONFIG.defaultCity}.`;
  }

  // Corregir descripciones escritas completamente en mayúsculas (penalizadas por Meta)
  const letters = clean.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || [];
  const upperLetters = clean.match(/[A-ZÁÉÍÓÚÑ]/g) || [];
  if (letters.length >= 10 && upperLetters.length / letters.length > 0.75) {
    const lowered = clean.toLowerCase();
    clean = lowered.charAt(0).toUpperCase() + lowered.slice(1);
  }

  if (clean.length < 25) {
    const base = clean.replace(/[.!?]+$/, '');
    const normalizedBase = base.charAt(0).toUpperCase() + base.slice(1);
    return `${normalizedBase}. ${productName} de ${brand}, disponible en ${CONFIG.brandName} ${CONFIG.defaultCity}.`;
  }

  return clean;
}

/**
 * Detecta la marca comercial del producto a partir del título y descripción.
 */
export function detectBrand(title: string, description: string): string {
  const text = `${title} ${description}`;
  for (const candidate of KNOWN_BRANDS) {
    if (candidate.pattern.test(text)) {
      return candidate.label;
    }
  }
  return CONFIG.brandName;
}

/**
 * Extrae la referencia del fabricante (MPN) o genera un SKU estable desde el ID.
 */
export function extractMpn(productId: string, title: string, description: string): string {
  const text = `${title} ${description}`;
  const refMatch = text.match(/\bRef\.?\s*[:#-]?\s*([A-Za-z0-9-]{3,20})\b/i);
  if (refMatch?.[1]) {
    return refMatch[1].toUpperCase();
  }

  const codeMatch = text.match(/\b(DYT\d{3,6}|BMT\d{3,6}|BAT\d{3,6}|CBG\d{3,6}|CRT?\d{3,6})\b/i);
  if (codeMatch?.[1]) {
    return codeMatch[1].toUpperCase();
  }

  const cleanId = productId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `BF-${cleanId || 'SKU'}`;
}

/**
 * Mapea categoría y palabras clave hacia taxonomías oficiales de Google y Meta Commerce.
 */
export function resolveTaxonomy(
  categorySlug: string,
  title: string,
  description: string
): { googleProductCategory: string; fbProductCategory: string } {
  const slug = categorySlug.toLowerCase().trim();
  const text = `${title} ${description}`.toLowerCase();

  if (/\b(balaca|diadema|hair\s+clips?|pinzas|hebillas)\b/.test(text)) {
    return {
      googleProductCategory: 'Apparel & Accessories > Clothing Accessories > Hair Accessories',
      fbProductCategory: 'Apparel & Accessories > Clothing Accessories > Hair Accessories',
    };
  }

  if (/\b(cosmetiquera|neceser|cartuchera)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic & Toiletry Bags',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  if (/\bespejo\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Face Mirrors',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  if (/\b(esponja|borla|almohadita)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Makeup Tools > Makeup Sponges',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  if (/\b(brocha|cepillo\s+pulidor)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Makeup Tools > Makeup Brushes',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  if (/\b(paleta\s+mezcladora|sticker|gemas|kit\s+pelo)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Makeup Tools',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  if (/\b(desmaquillante|toallas|espuma\s+desmaquillante|agua\s+micelar|aceite\s+desmaquillante)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Skin Care > Makeup Removers',
      fbProductCategory: 'Health & Beauty > Beauty > Skin Care > Facial Cleansers',
    };
  }

  if (/\b(crema\s+hidratante|hidratante\s+facial|serum|suero|t[oó]nico|mascarilla\s+facial)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotion & Moisturizer',
      fbProductCategory: 'Health & Beauty > Beauty > Skin Care > Facial Moisturizers & Creams',
    };
  }

  if (/\b(pestañina|pestanina|m[aá]scara\s+de\s+pestañas)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Mascara',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }

  if (/\b(cejas?|brow)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eyebrow Enhancers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }

  if (/\b(delineador.*ojos?|cat\s+eye|delineadores)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eyeliner',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }

  if (/\b(sombra|eyesterra)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eye Shadow',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }

  if (/\b(lip\s+balm|b[aá]lsamo|hidratante\s+m[aá]gico|candy\s+gamer)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lip Balms & Treatments',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Lip Makeup',
    };
  }

  if (/\b(gloss|brillo|lip\s+oil)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Lip Makeup > Lip Gloss',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Lip Makeup',
    };
  }

  if (/\b(labial|tinta|delineador\s+de\s+labios|voluminizador|wild\s+lips)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Lip Makeup > Lipsticks',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Lip Makeup',
    };
  }

  if (/\b(rubor|blush)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Blushes & Bronzers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  if (/\b(contorno|bronzer|iluminador|highlighter)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Highlighters & Luminizers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  if (/\bcorrector\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Concealers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  if (/\b(base|bb\s+cream)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Foundations',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  if (/\bpolvo\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Face Powder',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  if (/\b(primer|fijador)\b/.test(text)) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Face Primers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }

  // Fallbacks por categoría D1
  if (slug === 'rubor') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Blushes & Bronzers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }
  if (slug === 'cejas') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eyebrow Enhancers',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }
  if (slug === 'pestanas') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Mascara',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }
  if (slug === 'correctores' || slug === 'rostro') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Face Makeup',
    };
  }
  if (slug === 'ojos') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Eye Makeup',
    };
  }
  if (slug === 'labiales' || slug === 'labial') {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Makeup > Lip Makeup',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Lip Makeup',
    };
  }
  if (slug === 'skincare' || slug === 'hombre') {
    return {
      googleProductCategory: 'Health & Beauty > Personal Care > Cosmetics > Skin Care',
      fbProductCategory: 'Health & Beauty > Beauty > Skin Care',
    };
  }
  if (slug.includes('accesorio')) {
    return {
      googleProductCategory:
        'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Makeup Tools',
      fbProductCategory: 'Health & Beauty > Beauty > Makeup > Makeup Tools & Accessories',
    };
  }

  return {
    googleProductCategory: 'Health & Beauty > Personal Care > Cosmetics > Makeup',
    fbProductCategory: 'Health & Beauty > Beauty > Makeup',
  };
}

/**
 * Determina género y grupo etario objetivo según categoría y nombre del producto.
 */
export function resolveGenderAndAge(
  categorySlug: string,
  title: string
): { gender: 'female' | 'male' | 'unisex'; ageGroup: 'adult' | 'all ages' } {
  const slug = categorySlug.toLowerCase().trim();
  const lowerTitle = title.toLowerCase();

  let gender: 'female' | 'male' | 'unisex' = 'female';
  if (slug === 'hombre' || /\bhombre\b/.test(lowerTitle)) {
    gender = 'male';
  } else if (
    slug === 'skincare' ||
    /\b(espejo|esponja|borla|paleta\s+mezcladora|toallas|desmaquillante|espuma\s+desmaquillante|aceite\s+desmaquillante|crema\s+hidratante)\b/.test(
      lowerTitle
    )
  ) {
    gender = 'unisex';
  }

  const ageGroup: 'adult' | 'all ages' =
    slug.includes('accesorio') ||
    slug === 'skincare' ||
    /\b(sticker|balaca|hair\s+clips?|espejo|esponja|borla)\b/.test(lowerTitle)
      ? 'all ages'
      : 'adult';

  return { gender, ageGroup };
}

/**
 * Extrae capacidad o contenido neto (ej. "150 ml", "50 g").
 */
export function extractCapacity(text: string): string | undefined {
  const match = text.match(/\b(\d+(?:[.,]\d+)?)\s*(ml|g|gr|oz|kg)\b/i);
  if (!match?.[1] || !match[2]) return undefined;
  const amount = match[1].replace(',', '.');
  const rawUnit = match[2].toLowerCase();
  const unit = rawUnit === 'gr' ? 'g' : rawUnit;
  return `${amount} ${unit}`;
}

/**
 * Extrae presentación o tamaño del producto (Mini, Grande, Kit x3, etc.).
 */
export function extractSize(text: string): string | undefined {
  const kitMatch = text.match(/\bKit\s*x\s*(\d+)\b/i);
  if (kitMatch?.[1]) return `Kit x${kitMatch[1]}`;

  const multiMatch = text.match(/\bx\s*(\d+)\b/i);
  if (multiMatch?.[1]) return `Set x${multiMatch[1]}`;

  if (/\b(?:d[uú]o|doble)\b/i.test(text)) return 'Dúo';
  if (/\bmini\b/i.test(text)) return 'Mini';
  if (/\bpequeñ[oa]s?\b/i.test(text)) return 'Pequeño';
  if (/\bgigante\b/i.test(text)) return 'Gigante';
  if (/\bgrande\b/i.test(text)) return 'Grande';
  return undefined;
}

/**
 * Extrae el color o tono descriptivo sin usar códigos hexadecimales.
 */
export function extractColor(
  toneName: string | undefined,
  title: string,
  description: string
): string | undefined {
  if (toneName && toneName.trim()) {
    return toneName.trim();
  }
  for (const candidate of COLOR_CANDIDATES) {
    if (candidate.pattern.test(title)) {
      return candidate.label;
    }
  }
  for (const candidate of COLOR_CANDIDATES) {
    if (candidate.pattern.test(description)) {
      return candidate.label;
    }
  }
  return undefined;
}

function inferBodyParts(categorySlug: string, text: string): string[] {
  const parts: string[] = [];
  if (/\b(labio|labial|gloss|brillo|lip|tinta|b[aá]lsamo)\b/i.test(text)) {
    parts.push('Lips');
  }
  if (/\b(ojos?|pestañ|delineador.*ojos?|sombra|eyesterra)\b/i.test(text)) {
    parts.push('Eyes');
  }
  if (/\b(cejas?|brow)\b/i.test(text)) {
    parts.push('Eyebrows');
  }
  if (/\b(pestañina|pestanina|pestañas?)\b/i.test(text)) {
    parts.push('Eyelashes');
  }
  if (/\b(balaca|hair\s+clips?|pelo|cabello)\b/i.test(text)) {
    parts.push('Hair');
  }
  if (/\bcorporal\b/i.test(text)) {
    parts.push('Body');
  }
  if (
    parts.length === 0 ||
    /\b(rostro|facial|rubor|blush|contorno|bronzer|iluminador|corrector|base|bb\s+cream|polvo|primer|fijador|desmaquillante|crema)\b/i.test(
      text
    )
  ) {
    if (categorySlug === 'labiales' || categorySlug === 'labial') {
      if (!parts.includes('Lips')) parts.push('Lips');
    } else if (categorySlug === 'ojos' || categorySlug === 'cejas' || categorySlug === 'pestanas') {
      if (!parts.includes('Eyes')) parts.push('Eyes');
    } else if (!parts.includes('Hair')) {
      parts.unshift('Face');
    }
  }
  return uniqueNonEmpty(parts, 3);
}

function inferProductForm(categorySlug: string, text: string): string | undefined {
  if (
    categorySlug.includes('accesorio') ||
    /\b(espejo|esponja|borla|almohadita|brocha|cepillo|paleta\s+mezcladora|balaca|hair\s+clips?|cosmetiquera|sticker)\b/i.test(
      text
    )
  ) {
    return 'Tool';
  }
  if (/\bespuma\b/i.test(text)) return 'Foam';
  if (/\btoallas?\b/i.test(text)) return 'Wipe';
  if (/\bgel(?:atina)?\b/i.test(text)) return 'Gel';
  if (/\b(b[aá]lsamo|lip\s+balm)\b/i.test(text)) return 'Balm';
  if (/\b(barra|l[aá]piz|retr[aá]ctil|stick)\b/i.test(text)) return 'Stick';
  if (/\b(polvo|sombra|horneado|compacto)\b/i.test(text)) return 'Powder';
  if (/\b(crema|mousse|bb\s+cream|cremoso)\b/i.test(text)) return 'Cream';
  if (/\b(l[ií]quido|tinta|oil|aceite|bif[aá]sico|gloss|brillo|fijador|splash|primer)\b/i.test(text)) {
    return 'Liquid';
  }
  return undefined;
}

function inferMaterial(categorySlug: string, text: string): string | undefined {
  if (/\bterciopelo\b/i.test(text)) return 'Terciopelo';
  if (/\bpeluche\b/i.test(text)) return 'Peluche suave';
  if (/\bsilicona\b/i.test(text)) return 'Silicona';
  if (/\bacr[ií]lico\b/i.test(text)) return 'Acrílico';
  if (/\besponjas?\b/i.test(text)) return 'Esponja libre de látex';
  if (/\b(algod[oó]n|toallas?)\b/i.test(text)) return 'Algodón suave';
  if (categorySlug.includes('accesorio') && /\b(espejo|paleta|clips?)\b/i.test(text)) {
    return 'Plástico y acrílico';
  }
  return undefined;
}

function inferShippingWeight(capacity: string | undefined, categorySlug: string, text: string): string {
  if (capacity) {
    const capMatch = capacity.match(/^(\d+(?:\.\d+)?)\s*(ml|g|oz|kg)$/i);
    if (capMatch?.[1] && capMatch[2]) {
      const value = Number(capMatch[1]);
      const unit = capMatch[2].toLowerCase();
      if (unit === 'kg') {
        return `${Math.max(100, Math.round(value * 1000 + 50))} g`;
      }
      if (unit === 'oz') {
        return `${Math.max(50, Math.round(value * 28.35 + 35))} g`;
      }
      return `${Math.max(40, Math.round(value + 35))} g`;
    }
  }

  if (/\b(kit|paleta|cosmetiquera|grande)\b/i.test(text)) return '160 g';
  if (/\b(crema|base|bb\s+cream|polvo|fijador|primer|espejo|desmaquillante)\b/i.test(text)) {
    return '120 g';
  }
  if (/\b(l[aá]piz|delineador|sticker|clips?|b[aá]lsamo|lip\s+balm)\b/i.test(text)) {
    return '45 g';
  }
  if (categorySlug === 'skincare' || categorySlug === 'hombre') return '140 g';
  return '80 g';
}

function inferInstructions(categorySlug: string, text: string): string[] {
  if (/\b(desmaquillante|toallas|espuma)\b/i.test(text)) {
    return [
      'Aplica sobre el rostro seco o húmedo realizando movimientos circulares suaves.',
      'Retira el maquillaje e impurezas y enjuaga o finaliza con tu rutina hidratante.',
    ];
  }
  if (/\b(rubor|blush)\b/i.test(text)) {
    return [
      'Aplica con toques suaves sobre las mejillas y difumina hacia las sienes con brocha o esponja.',
      'Modula la intensidad aplicando una segunda capa según el acabado deseado.',
    ];
  }
  if (/\b(contorno|bronzer|iluminador)\b/i.test(text)) {
    return [
      'Deposita una pequeña cantidad en pómulos, puente de la nariz o zonas a definir.',
      'Difumina suavemente a toques para lograr un acabado luminoso y natural.',
    ];
  }
  if (/\b(pestañina|pestanina)\b/i.test(text)) {
    return [
      'Aplica desde la raíz de las pestañas con movimientos en zigzag hacia las puntas.',
      'Repite en las pestañas inferiores para mayor definición.',
    ];
  }
  if (/\b(cejas?|brow)\b/i.test(text)) {
    return [
      'Peina las cejas hacia arriba y define siguiendo la dirección natural del vello.',
    ];
  }
  if (categorySlug === 'labiales' || categorySlug === 'labial' || /\b(labial|gloss|brillo|tinta|lip)\b/i.test(text)) {
    return [
      'Desliza el aplicador desde el centro del labio hacia las comisuras para un color uniforme.',
    ];
  }
  if (categorySlug.includes('accesorio')) {
    return [
      'Utiliza como complemento en tu rutina diaria de maquillaje o cuidado facial.',
      'Limpia periódicamente con agua tibia y jabón suave.',
    ];
  }
  return [
    'Aplica de manera uniforme sobre la piel limpia o preparada según tu rutina de belleza.',
  ];
}

function inferStandardFeatures(text: string, categorySlug: string): string[] {
  const detected: string[] = [];
  if (/\b(larga\s+duraci[oó]n|duradero|excelente\s+duraci[oó]n)\b/i.test(text)) {
    detected.push('Larga duración');
  }
  if (/\b(alta\s+pigmentaci[oó]n|pigmentaci[oó]n|saturaci[oó]n)\b/i.test(text)) {
    detected.push('Alta pigmentación');
  }
  if (/\b(hidratante|hidrata|nutritivo|aloe|vitamina)\b/i.test(text)) {
    detected.push('Fórmula hidratante');
  }
  if (/\b(a\s+prueba\s+de\s+agua|resistente\s+al\s+agua|waterproof)\b/i.test(text)) {
    detected.push('Resistente al agua');
  }
  if (/\blavable\b/i.test(text)) detected.push('Fórmula lavable');
  if (/\b(ligera|ultrasuave|suave|sedoso)\b/i.test(text)) detected.push('Textura ligera');
  if (/\b(f[aá]cil\s+aplicaci[oó]n|pr[aá]ctico|viaje)\b/i.test(text)) {
    detected.push('Fácil aplicación');
  }
  if (/\b(glow|luminoso|brillo)\b/i.test(text)) detected.push('Acabado luminoso');
  if (/\bmate\b/i.test(text)) detected.push('Acabado mate');

  if (detected.length === 0) {
    if (categorySlug.includes('accesorio')) {
      detected.push('Diseño práctico', 'Fácil de limpiar');
    } else {
      detected.push('Acabado uniforme', 'Textura confortable');
    }
  }

  return uniqueNonEmpty(detected, 4);
}

/**
 * Enriquece un producto (y su variante opcional) con todos los atributos de catálogo Meta.
 */
export function enrichProductAttributes(
  product: ProductWithRelations,
  categoryName: string,
  tone?: Tone | null
): EnrichedMetaAttributes {
  const rawTitle = product.name || '';
  const rawDesc = product.description || '';
  const combinedText = `${rawTitle} ${rawDesc}`;
  const brand = detectBrand(rawTitle, rawDesc);
  const mpn = extractMpn(product.id, rawTitle, rawDesc);

  const cleanBaseDesc = normalizePlainDescription(rawDesc, rawTitle, categoryName, brand);
  const toneLabel = tone?.name ? formatToneLabel(tone.name) : '';
  const description = toneLabel ? `${toneLabel}. ${cleanBaseDesc}` : cleanBaseDesc;

  const { googleProductCategory, fbProductCategory } = resolveTaxonomy(
    product.category,
    rawTitle,
    rawDesc
  );
  const { gender, ageGroup } = resolveGenderAndAge(product.category, rawTitle);
  const capacity = extractCapacity(combinedText);
  const size = extractSize(combinedText);
  const color = extractColor(tone?.name, rawTitle, rawDesc);
  const material = inferMaterial(product.category, combinedText);
  const bodyParts = inferBodyParts(product.category, combinedText);
  const productForm = inferProductForm(product.category, combinedText);

  const isAccessory = productForm === 'Tool';
  let skinType: string | undefined;
  if (!isAccessory) {
    if (/\bpiel\s+grasa\b/i.test(combinedText)) skinType = 'Oily';
    else if (/\bpiel\s+seca\b/i.test(combinedText)) skinType = 'Dry';
    else if (/\bpiel\s+mixta\b/i.test(combinedText)) skinType = 'Combination';
    else if (/\bpiel\s+sensible\b/i.test(combinedText)) skinType = 'Sensitive';
    else skinType = 'All Skin Types';
  }

  const skinCareConcerns = uniqueNonEmpty(
    [
      /\b(hidrat|resec|humect)\b/i.test(combinedText) ? 'Hidratación' : null,
      /\bporos?\b/i.test(combinedText) ? 'Poros' : null,
      /\bojeras?\b/i.test(combinedText) ? 'Ojeras' : null,
      /\b(matific|brillo\s+facial|grasa)\b/i.test(combinedText) ? 'Control de brillo' : null,
      /\b(desmaquill|limpiez|impurez)\b/i.test(combinedText) ? 'Limpieza facial' : null,
    ],
    3
  );

  const scents = uniqueNonEmpty(
    SCENT_CANDIDATES.filter((c) => c.pattern.test(combinedText)).map((c) => c.label),
    2
  );
  const ingredients = uniqueNonEmpty(
    INGREDIENT_CANDIDATES.filter((c) => c.pattern.test(combinedText)).map((c) => c.label),
    4
  );

  const spfMatch = combinedText.match(/\b(?:SPF|FPS)\s*(\d{1,3})\b/i);
  const spfValue = spfMatch?.[1] ? spfMatch[1] : undefined;

  const instructions = inferInstructions(product.category, combinedText);
  const standardFeatures = inferStandardFeatures(combinedText, product.category);
  const additionalFeatures = uniqueNonEmpty(
    [
      `Entrega en ${CONFIG.defaultCity}`,
      'Pago contra entrega disponible',
      product.isNew ? 'Nuevo lanzamiento' : null,
      product.isFeatured ? 'Favorito del estudio' : null,
    ],
    4
  );

  const shippingWeight = inferShippingWeight(capacity, product.category, combinedText);

  const productTags = uniqueNonEmpty(
    [
      product.category,
      brand.toLowerCase(),
      productForm ? productForm.toLowerCase() : null,
      color ? color.toLowerCase() : null,
      product.isNew ? 'nuevo' : null,
      product.isFeatured ? 'destacado' : null,
      'roldanillo',
      'bella forever',
    ],
    8
  );

  const keywords = uniqueNonEmpty(
    [
      rawTitle.toLowerCase(),
      categoryName.toLowerCase(),
      brand.toLowerCase(),
      color ? color.toLowerCase() : null,
      'maquillaje roldanillo',
      'cosmeticos valle del cauca',
    ],
    6
  );

  const richFeaturesHtml = standardFeatures
    .map((feat) => `<li>${escapeHtmlText(feat)}</li>`)
    .join('');

  const richTextDescription = [
    `<p>${escapeHtmlText(description)}</p>`,
    toneLabel ? `<p><strong>Tono seleccionado:</strong> ${escapeHtmlText(toneLabel)}</p>` : '',
    richFeaturesHtml ? `<ul>${richFeaturesHtml}</ul>` : '',
    `<p>Disponible para entrega rápida en ${escapeHtmlText(CONFIG.defaultCity)} y envíos en el Valle del Cauca.</p>`,
  ]
    .filter(Boolean)
    .join('');

  return {
    brand,
    mpn,
    description,
    richTextDescription,
    googleProductCategory,
    fbProductCategory,
    gender,
    ageGroup,
    color,
    size,
    capacity,
    material,
    shippingWeight,
    bodyParts,
    productForm,
    skinType,
    skinCareConcerns,
    scents,
    ingredients,
    spfValue,
    instructions,
    standardFeatures,
    additionalFeatures,
    productTags,
    keywords,
  };
}
