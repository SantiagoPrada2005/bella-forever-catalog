import { CONFIG } from '../../config';
import type { Category, ProductImage, ProductWithRelations, Tone } from '../../db/schema';
import { enrichProductAttributes, resolveTaxonomy } from './meta-attributes';

export type MetaFeedMode = 'variants' | 'products';

export interface MetaFeedOptions {
  siteUrl: string;
  mode?: MetaFeedMode;
}

export interface ImageWarningItem {
  productId: string;
  productName: string;
  reason: 'webp' | 'thumbnail';
  imageUrl: string;
}

export interface MetaFeedStats {
  totalProducts: number;
  totalFeedItems: number;
  inStockItems: number;
  outOfStockItems: number;
  totalTones: number;
  imageWarnings: ImageWarningItem[];
}

interface FeedItemRecord {
  id: string;
  itemGroupId: string;
  title: string;
  description: string;
  richTextDescription: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: 'in stock' | 'out of stock';
  inventory: number;
  price: number;
  brand: string;
  mpn: string;
  color?: string;
  size?: string;
  material?: string;
  capacity?: string;
  googleProductCategory: string;
  fbProductCategory: string;
  productType: string;
  gender: 'female' | 'male' | 'unisex';
  ageGroup: 'adult' | 'all ages';
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
  customLabel0: string;
  customLabel1: string;
  customLabel2: string;
  customLabel3: string;
  customLabel4: string;
  customNumber0: number;
  customNumber1: number;
  customNumber2: number;
  customNumber3: number;
}

const CSV_COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'link',
  'image_link',
  'brand',
  'price',
  'google_product_category',
  'fb_product_category',
  'quantity_to_sell_on_facebook',
  'sale_price',
  'sale_price_effective_date',
  'item_group_id',
  'gender',
  'color',
  'size',
  'age_group',
  'material',
  'pattern',
  'shipping',
  'shipping_weight',
  'offer_disclaimer',
  'offer_disclaimer_url',
  'video[0].url',
  'video[0].tag[0]',
  'gtin',
  'product_tags[0]',
  'product_tags[1]',
  'capacity',
  'ingredients[0]',
  'scent[0]',
  'skin_care_concern[0]',
  'health_concern[0]',
  'body_part[0]',
  'body_part[1]',
  'skin_type',
  'product_form',
  'inactive_ingredients[0]',
  'instructions[0]',
  'instructions[1]',
  'instructions[2]',
  'stop_use_indications[0]',
  'spf_value',
  'batteries_required',
  'is_powered',
  'power_type',
  'result_time',
  'standard_features[0]',
  'additional_features[0]',
  'keywords[0]',
  'hair_type[0]',
  'skin_tone',
  'wig_cap_type',
  'care_instructions[0]',
  'rich_text_description',
  'additional_image_link',
  'mpn',
  'product_type',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'custom_number_0',
  'custom_number_1',
  'custom_number_2',
  'custom_number_3',
] as const;

function stripInvalidXmlChars(value: string): string {
  let cleaned = '';
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    const isValid =
      cp === 0x09 ||
      cp === 0x0a ||
      cp === 0x0d ||
      (cp >= 0x20 && cp <= 0xd7ff) ||
      (cp >= 0xe000 && cp <= 0xfffd) ||
      cp >= 0x10000;
    if (isValid) {
      cleaned += ch;
    }
  }
  return cleaned;
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Escapa entidades XML y elimina caracteres de control no permitidos por XML 1.0.
 */
export function escapeXml(value: string): string {
  const clean = stripInvalidXmlChars(value);
  return clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Resuelve rutas relativas o URLs absolutas contra el dominio canónico del catálogo.
 */
export function toAbsoluteUrl(pathOrUrl: string | null | undefined, siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const trimmed = (pathOrUrl || '').trim();
  if (!trimmed) {
    return `${cleanSiteUrl}/images/og-bella-forever.jpg`;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `${cleanSiteUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * Convierte rutas R2 `/api/images/...` al alias público `/media/...` permitido para Meta.
 */
export function toMetaImageUrl(pathOrUrl: string | null | undefined, siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const abs = toAbsoluteUrl(pathOrUrl, cleanSiteUrl);

  if (abs.startsWith(`${cleanSiteUrl}/api/images/`)) {
    return `${cleanSiteUrl}/media/${abs.slice(`${cleanSiteUrl}/api/images/`.length)}`;
  }

  const prodImagesMatch = abs.match(/^https?:\/\/(?:www\.)?bella-forever\.com\/api\/images\/(.+)$/i);
  if (prodImagesMatch?.[1]) {
    return `${cleanSiteUrl}/media/${prodImagesMatch[1]}`;
  }

  return abs;
}

/**
 * Detecta formatos de imagen problemáticos o desaconsejados por Meta Commerce Manager.
 */
export function getImageWarningReason(url: string): 'webp' | 'thumbnail' | null {
  const lower = (url || '').trim().toLowerCase();
  if (!lower) return null;
  if (lower.includes('encrypted-tbn') || lower.includes('gstatic.com/shopping')) {
    return 'thumbnail';
  }
  const pathname = lower.split(/[?#]/)[0] || '';
  if (pathname.endsWith('.webp')) {
    return 'webp';
  }
  return null;
}

function isPreferredRasterFormat(url: string): boolean {
  const pathname = (url || '').trim().toLowerCase().split(/[?#]/)[0] || '';
  return !pathname.endsWith('.webp') && !pathname.endsWith('.avif');
}

function selectPrimaryImageUrl(
  productImages: ProductImage[] | undefined,
  mainImage: string | undefined,
  siteUrl: string,
  toneImage?: string | null
): string {
  if (toneImage && toneImage.trim()) {
    return toMetaImageUrl(toneImage, siteUrl);
  }

  const sortedGallery = [...(productImages || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const rawCandidates = [
    ...sortedGallery.map((img) => img?.url || ''),
    mainImage || '',
  ]
    .map((u) => u.trim())
    .filter(Boolean);

  const compatibleCandidate = rawCandidates.find((u) => isPreferredRasterFormat(u));
  if (compatibleCandidate) {
    return toMetaImageUrl(compatibleCandidate, siteUrl);
  }

  return toMetaImageUrl(rawCandidates[0] || '', siteUrl);
}

/**
 * Clasifica el precio en bandas comerciales COP para conjuntos de anuncios en Meta.
 */
export function getPriceTierLabel(
  price: number
): 'impulso_accesible' | 'ticket_medio' | 'edicion_premium' {
  if (price <= 18000) return 'impulso_accesible';
  if (price <= 32000) return 'ticket_medio';
  return 'edicion_premium';
}

/**
 * Determina la prioridad comercial del producto según banderas editoriales.
 */
export function getCommercialHookLabel(
  product: Pick<ProductWithRelations, 'isNew' | 'isFeatured'>
): 'nuevo_destacado' | 'nuevo_lanzamiento' | 'favorito_estudio' | 'coleccion_regular' {
  if (product.isNew && product.isFeatured) return 'nuevo_destacado';
  if (product.isNew) return 'nuevo_lanzamiento';
  if (product.isFeatured) return 'favorito_estudio';
  return 'coleccion_regular';
}

function getCommercialScore(product: Pick<ProductWithRelations, 'isNew' | 'isFeatured'>): number {
  if (product.isNew && product.isFeatured) return 3;
  if (product.isNew) return 2;
  if (product.isFeatured) return 1;
  return 0;
}

/**
 * Evalúa la salud del inventario para evitar gastar pauta fría en piezas a punto de agotarse.
 */
export function getStockHealthLabel(
  inStock: boolean,
  stock: number
): 'agotado' | 'ultimas_unidades' | 'stock_optimo' {
  if (!inStock || stock <= 0) return 'agotado';
  if (stock <= 3) return 'ultimas_unidades';
  return 'stock_optimo';
}

/**
 * Mapea el slug de categoría local hacia la taxonomía estándar de Google/Meta Commerce.
 */
export function getGoogleProductCategory(categorySlug: string): string {
  return resolveTaxonomy(categorySlug, '', '').googleProductCategory;
}

/**
 * Calcula métricas de sincronización del catálogo y alertas de imágenes para el panel de administración.
 */
export function computeMetaFeedStats(products: ProductWithRelations[]): MetaFeedStats {
  let totalFeedItems = 0;
  let inStockItems = 0;
  let outOfStockItems = 0;
  let totalTones = 0;
  const imageWarnings: ImageWarningItem[] = [];
  const warnedProductIds = new Set<string>();

  for (const product of products) {
    const productTones = product.tones || [];
    totalTones += productTones.length;

    const effectiveMainUrl = selectPrimaryImageUrl(
      product.productImages,
      product.mainImage,
      'https://bella-forever.com',
      productTones[0]?.image
    );
    const warningReason = getImageWarningReason(effectiveMainUrl);
    if (warningReason && !warnedProductIds.has(product.id)) {
      warnedProductIds.add(product.id);
      imageWarnings.push({
        productId: product.id,
        productName: product.name,
        reason: warningReason,
        imageUrl: effectiveMainUrl,
      });
    }

    if (productTones.length > 0) {
      for (const tone of productTones) {
        totalFeedItems += 1;
        const isToneAvailable =
          Boolean(product.inStock) && Boolean(tone.inStock) && tone.stock > 0;
        if (isToneAvailable) {
          inStockItems += 1;
        } else {
          outOfStockItems += 1;
        }
      }
    } else {
      totalFeedItems += 1;
      const isProductAvailable = Boolean(product.inStock) && product.stock > 0;
      if (isProductAvailable) {
        inStockItems += 1;
      } else {
        outOfStockItems += 1;
      }
    }
  }

  return {
    totalProducts: products.length,
    totalFeedItems,
    inStockItems,
    outOfStockItems,
    totalTones,
    imageWarnings,
  };
}

function collectProductGalleryUrls(product: ProductWithRelations, siteUrl: string): string[] {
  const rawUrls: string[] = [];
  const sortedGallery = [...(product.productImages || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  for (const img of sortedGallery) {
    if (img?.url) rawUrls.push(img.url);
  }
  if (product.mainImage) {
    rawUrls.push(product.mainImage);
  }
  for (const tone of product.tones || []) {
    if (tone?.image) rawUrls.push(tone.image);
  }

  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const raw of rawUrls) {
    const abs = toMetaImageUrl(raw, siteUrl);
    if (!seen.has(abs)) {
      seen.add(abs);
      resolved.push(abs);
    }
  }
  return resolved;
}

function buildDeepLink(siteUrl: string, productId: string, toneId?: string): string {
  const params = new URLSearchParams({
    producto: productId,
  });
  if (toneId) {
    params.set('tono', toneId);
  }
  params.set('utm_source', 'meta');
  params.set('utm_medium', 'cpc');
  params.set('utm_campaign', 'catalog_ads');
  return `${siteUrl}/catalogo?${params.toString()}`;
}

function createFeedRecord(params: {
  product: ProductWithRelations;
  categoryName: string;
  tone?: Tone | null;
  siteUrl: string;
  galleryUrls: string[];
  isAvailable: boolean;
  inventory: number;
  customLabel4: 'multi_tono' | 'tono_unico';
}): FeedItemRecord {
  const { product, categoryName, tone, siteUrl, galleryUrls, isAvailable, inventory, customLabel4 } =
    params;

  const enriched = enrichProductAttributes(product, categoryName, tone);
  const primaryImg = selectPrimaryImageUrl(
    product.productImages,
    product.mainImage,
    siteUrl,
    tone?.image
  );
  const additionalImgs = galleryUrls.filter((url) => url !== primaryImg);

  const itemId = tone ? tone.id : product.id;
  const title = tone ? `${product.name} - ${tone.name}` : product.name;
  const link = buildDeepLink(siteUrl, product.id, tone?.id);
  const tonesCount = product.tones?.length || 0;

  return {
    id: itemId,
    itemGroupId: product.id,
    title,
    description: enriched.description,
    richTextDescription: enriched.richTextDescription,
    link,
    imageLink: primaryImg,
    additionalImageLinks: additionalImgs,
    availability: isAvailable ? 'in stock' : 'out of stock',
    inventory: Math.max(0, Math.floor(inventory)),
    price: Math.round(product.price),
    brand: enriched.brand,
    mpn: enriched.mpn,
    color: enriched.color,
    size: enriched.size,
    material: enriched.material,
    capacity: enriched.capacity,
    googleProductCategory: enriched.googleProductCategory,
    fbProductCategory: enriched.fbProductCategory,
    productType: `Maquillaje > ${categoryName}`,
    gender: enriched.gender,
    ageGroup: enriched.ageGroup,
    shippingWeight: enriched.shippingWeight,
    bodyParts: enriched.bodyParts,
    productForm: enriched.productForm,
    skinType: enriched.skinType,
    skinCareConcerns: enriched.skinCareConcerns,
    scents: enriched.scents,
    ingredients: enriched.ingredients,
    spfValue: enriched.spfValue,
    instructions: enriched.instructions,
    standardFeatures: enriched.standardFeatures,
    additionalFeatures: enriched.additionalFeatures,
    productTags: enriched.productTags,
    keywords: enriched.keywords,
    customLabel0: product.category,
    customLabel1: getPriceTierLabel(product.price),
    customLabel2: getCommercialHookLabel(product),
    customLabel3: getStockHealthLabel(isAvailable, inventory),
    customLabel4,
    customNumber0: Math.round(product.price),
    customNumber1: Math.max(0, Math.floor(inventory)),
    customNumber2: getCommercialScore(product),
    customNumber3: tonesCount,
  };
}

function buildFeedItems(
  products: ProductWithRelations[],
  categories: Category[],
  options: MetaFeedOptions
): FeedItemRecord[] {
  const cleanSiteUrl = options.siteUrl.replace(/\/+$/, '');
  const mode: MetaFeedMode = options.mode === 'products' ? 'products' : 'variants';
  const categoryNameMap = new Map(categories.map((c) => [c.slug, c.name]));

  const records: FeedItemRecord[] = [];

  for (const product of products) {
    const categoryName = categoryNameMap.get(product.category) || product.category || 'Maquillaje';
    const galleryUrls = collectProductGalleryUrls(product, cleanSiteUrl);
    const productTones = product.tones || [];
    const hasTones = productTones.length > 0;

    if (mode === 'variants' && hasTones) {
      for (const tone of productTones) {
        const isAvailable = Boolean(product.inStock) && Boolean(tone.inStock) && tone.stock > 0;
        const inventory =
          Boolean(product.inStock) && Boolean(tone.inStock)
            ? Math.max(0, Math.floor(tone.stock))
            : 0;

        records.push(
          createFeedRecord({
            product,
            categoryName,
            tone,
            siteUrl: cleanSiteUrl,
            galleryUrls,
            isAvailable,
            inventory,
            customLabel4: 'multi_tono',
          })
        );
      }
    } else {
      const effectiveStock = hasTones
        ? productTones.reduce(
            (sum, t) => sum + (t.inStock ? Math.max(0, Math.floor(t.stock)) : 0),
            0
          )
        : Math.max(0, Math.floor(product.stock));
      const isAvailable = Boolean(product.inStock) && effectiveStock > 0;
      const inventory = product.inStock ? effectiveStock : 0;

      records.push(
        createFeedRecord({
          product,
          categoryName,
          tone: null,
          siteUrl: cleanSiteUrl,
          galleryUrls,
          isAvailable,
          inventory,
          customLabel4: hasTones ? 'multi_tono' : 'tono_unico',
        })
      );
    }
  }

  return records;
}

function renderXmlTagList(tagName: string, values: string[]): string[] {
  return values.map((val) => `      <g:${tagName}>${escapeXml(val)}</g:${tagName}>`);
}

function renderFeedItemXml(item: FeedItemRecord): string {
  const safeInventory = Math.max(0, Math.floor(item.inventory));
  const lines = [
    '    <item>',
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    `      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>`,
    `      <g:title>${escapeXml(truncateText(item.title, 150))}</g:title>`,
    `      <g:description>${escapeXml(truncateText(item.description, 5000))}</g:description>`,
    `      <g:rich_text_description>${escapeXml(truncateText(item.richTextDescription, 5000))}</g:rich_text_description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
    ...renderXmlTagList('additional_image_link', item.additionalImageLinks.slice(0, 10)),
    `      <g:availability>${item.availability}</g:availability>`,
    `      <g:inventory>${safeInventory}</g:inventory>`,
    `      <g:quantity_to_sell_on_facebook>${safeInventory}</g:quantity_to_sell_on_facebook>`,
    '      <g:condition>new</g:condition>',
    `      <g:price>${item.price} ${CONFIG.currency.code}</g:price>`,
    `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
    `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>`,
    ...(item.color ? [`      <g:color>${escapeXml(item.color)}</g:color>`] : []),
    ...(item.size ? [`      <g:size>${escapeXml(item.size)}</g:size>`] : []),
    ...(item.material ? [`      <g:material>${escapeXml(item.material)}</g:material>`] : []),
    ...(item.capacity ? [`      <g:capacity>${escapeXml(item.capacity)}</g:capacity>`] : []),
    `      <g:google_product_category>${escapeXml(item.googleProductCategory)}</g:google_product_category>`,
    `      <g:fb_product_category>${escapeXml(item.fbProductCategory)}</g:fb_product_category>`,
    `      <g:product_type>${escapeXml(item.productType)}</g:product_type>`,
    `      <g:gender>${item.gender}</g:gender>`,
    `      <g:age_group>${item.ageGroup}</g:age_group>`,
    `      <g:shipping_weight>${escapeXml(item.shippingWeight)}</g:shipping_weight>`,
    ...(item.productForm ? [`      <g:product_form>${escapeXml(item.productForm)}</g:product_form>`] : []),
    ...(item.skinType ? [`      <g:skin_type>${escapeXml(item.skinType)}</g:skin_type>`] : []),
    ...(item.spfValue ? [`      <g:spf_value>${escapeXml(item.spfValue)}</g:spf_value>`] : []),
    ...renderXmlTagList('body_part', item.bodyParts),
    ...renderXmlTagList('ingredients', item.ingredients),
    ...renderXmlTagList('scent', item.scents),
    ...renderXmlTagList('skin_care_concern', item.skinCareConcerns),
    ...renderXmlTagList('instructions', item.instructions),
    ...renderXmlTagList('standard_features', item.standardFeatures),
    ...renderXmlTagList('additional_features', item.additionalFeatures),
    ...renderXmlTagList('keywords', item.keywords),
    ...renderXmlTagList('product_tags', item.productTags),
    `      <g:custom_label_0>${escapeXml(item.customLabel0)}</g:custom_label_0>`,
    `      <g:custom_label_1>${escapeXml(item.customLabel1)}</g:custom_label_1>`,
    `      <g:custom_label_2>${escapeXml(item.customLabel2)}</g:custom_label_2>`,
    `      <g:custom_label_3>${escapeXml(item.customLabel3)}</g:custom_label_3>`,
    `      <g:custom_label_4>${escapeXml(item.customLabel4)}</g:custom_label_4>`,
    `      <g:custom_number_0>${item.customNumber0}</g:custom_number_0>`,
    `      <g:custom_number_1>${item.customNumber1}</g:custom_number_1>`,
    `      <g:custom_number_2>${item.customNumber2}</g:custom_number_2>`,
    `      <g:custom_number_3>${item.customNumber3}</g:custom_number_3>`,
    '    </item>',
  ];

  return lines.join('\n');
}

/**
 * Genera el feed XML RSS 2.0 compatible con Meta Commerce Manager y Advantage+ Catalog Ads.
 */
export function buildMetaCatalogXml(
  products: ProductWithRelations[],
  categories: Category[],
  options: MetaFeedOptions
): string {
  const cleanSiteUrl = options.siteUrl.replace(/\/+$/, '');
  const records = buildFeedItems(products, categories, options);
  const renderedItems = records.map(renderFeedItemXml);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(CONFIG.brandName)} - Catálogo de Maquillaje</title>`,
    `    <link>${escapeXml(`${cleanSiteUrl}/catalogo`)}</link>`,
    '    <description>Catálogo oficial sincronizado para Meta Commerce Manager y Advantage+ Catalog Ads.</description>',
    ...(renderedItems.length > 0 ? [renderedItems.join('\n')] : []),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

/**
 * Genera el feed CSV RFC 4180 alineado con la plantilla oficial de Meta Commerce Manager.
 */
export function buildMetaCatalogCsv(
  products: ProductWithRelations[],
  categories: Category[],
  options: MetaFeedOptions
): string {
  const records = buildFeedItems(products, categories, options);
  const rows: string[] = [CSV_COLUMNS.map(escapeCsvCell).join(',')];

  for (const item of records) {
    const rowMap: Record<(typeof CSV_COLUMNS)[number], string | number | undefined> = {
      id: item.id,
      title: truncateText(item.title, 200),
      description: truncateText(item.description, 9999),
      availability: item.availability,
      condition: 'new',
      link: item.link,
      image_link: item.imageLink,
      brand: item.brand,
      price: `${item.price} ${CONFIG.currency.code}`,
      google_product_category: item.googleProductCategory,
      fb_product_category: item.fbProductCategory,
      quantity_to_sell_on_facebook: item.inventory,
      sale_price: '',
      sale_price_effective_date: '',
      item_group_id: item.itemGroupId,
      gender: item.gender,
      color: item.color || '',
      size: item.size || '',
      age_group: item.ageGroup,
      material: item.material || '',
      pattern: '',
      shipping: '',
      shipping_weight: item.shippingWeight,
      offer_disclaimer: '',
      offer_disclaimer_url: '',
      'video[0].url': '',
      'video[0].tag[0]': '',
      gtin: '',
      'product_tags[0]': item.productTags[0] || '',
      'product_tags[1]': item.productTags[1] || '',
      capacity: item.capacity || '',
      'ingredients[0]': item.ingredients.join(', '),
      'scent[0]': item.scents[0] || '',
      'skin_care_concern[0]': item.skinCareConcerns[0] || '',
      'health_concern[0]': '',
      'body_part[0]': item.bodyParts[0] || '',
      'body_part[1]': item.bodyParts[1] || '',
      skin_type: item.skinType || '',
      product_form: item.productForm || '',
      'inactive_ingredients[0]': '',
      'instructions[0]': item.instructions[0] || '',
      'instructions[1]': item.instructions[1] || '',
      'instructions[2]': item.instructions[2] || '',
      'stop_use_indications[0]': '',
      spf_value: item.spfValue || '',
      batteries_required: '',
      is_powered: '',
      power_type: '',
      result_time: '',
      'standard_features[0]': item.standardFeatures[0] || '',
      'additional_features[0]': item.additionalFeatures[0] || '',
      'keywords[0]': item.keywords.join(', '),
      'hair_type[0]': '',
      skin_tone: '',
      wig_cap_type: '',
      'care_instructions[0]': '',
      rich_text_description: item.richTextDescription,
      additional_image_link: item.additionalImageLinks.slice(0, 10).join(','),
      mpn: item.mpn,
      product_type: item.productType,
      custom_label_0: item.customLabel0,
      custom_label_1: item.customLabel1,
      custom_label_2: item.customLabel2,
      custom_label_3: item.customLabel3,
      custom_label_4: item.customLabel4,
      custom_number_0: item.customNumber0,
      custom_number_1: item.customNumber1,
      custom_number_2: item.customNumber2,
      custom_number_3: item.customNumber3,
    };

    rows.push(CSV_COLUMNS.map((col) => escapeCsvCell(rowMap[col])).join(','));
  }

  return `${rows.join('\n')}\n`;
}
