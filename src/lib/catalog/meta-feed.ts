import { CONFIG } from '../../config';
import type { Category, ProductWithRelations } from '../../db/schema';

export type MetaFeedMode = 'variants' | 'products';

export interface MetaFeedOptions {
  siteUrl: string;
  mode?: MetaFeedMode;
}

export interface MetaFeedStats {
  totalProducts: number;
  totalFeedItems: number;
  inStockItems: number;
  outOfStockItems: number;
  totalTones: number;
}

interface FeedItemInput {
  id: string;
  itemGroupId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: 'in stock' | 'out of stock';
  inventory: number;
  price: number;
  color?: string;
  googleProductCategory: string;
  productType: string;
  customLabel0: string;
  customLabel1: string;
  customLabel2: string;
  customLabel3: string;
  customLabel4: string;
}

const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  rubor: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Blushes & Bronzers',
  labiales: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Lip Makeup > Lipsticks',
  cejas: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eyebrow Enhancers',
  pestanas: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Mascara',
  correctores: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Concealers',
  rostro: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup > Concealers',
};

const DEFAULT_GOOGLE_CATEGORY = 'Health & Beauty > Personal Care > Cosmetics > Makeup';

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
  const key = categorySlug.toLowerCase().trim();
  return GOOGLE_CATEGORY_MAP[key] || DEFAULT_GOOGLE_CATEGORY;
}

/**
 * Calcula métricas de sincronización del catálogo para el panel de administración.
 */
export function computeMetaFeedStats(products: ProductWithRelations[]): MetaFeedStats {
  let totalFeedItems = 0;
  let inStockItems = 0;
  let outOfStockItems = 0;
  let totalTones = 0;

  for (const product of products) {
    const productTones = product.tones || [];
    totalTones += productTones.length;

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
    const abs = toAbsoluteUrl(raw, siteUrl);
    if (!seen.has(abs)) {
      seen.add(abs);
      resolved.push(abs);
    }
  }
  return resolved;
}

function renderFeedItem(item: FeedItemInput): string {
  const additionalImagesXml = item.additionalImageLinks
    .slice(0, 10)
    .map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('\n');

  const lines = [
    '    <item>',
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    `      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>`,
    `      <g:title>${escapeXml(truncateText(item.title, 150))}</g:title>`,
    `      <g:description>${escapeXml(truncateText(item.description, 5000))}</g:description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
    ...(additionalImagesXml ? [additionalImagesXml] : []),
    `      <g:availability>${item.availability}</g:availability>`,
    `      <g:inventory>${Math.max(0, Math.floor(item.inventory))}</g:inventory>`,
    '      <g:condition>new</g:condition>',
    `      <g:price>${Math.round(item.price)} ${CONFIG.currency.code}</g:price>`,
    `      <g:brand>${escapeXml(CONFIG.brandName)}</g:brand>`,
    ...(item.color ? [`      <g:color>${escapeXml(item.color)}</g:color>`] : []),
    `      <g:google_product_category>${escapeXml(item.googleProductCategory)}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(item.productType)}</g:product_type>`,
    '      <g:gender>female</g:gender>',
    '      <g:age_group>adult</g:age_group>',
    `      <g:custom_label_0>${escapeXml(item.customLabel0)}</g:custom_label_0>`,
    `      <g:custom_label_1>${escapeXml(item.customLabel1)}</g:custom_label_1>`,
    `      <g:custom_label_2>${escapeXml(item.customLabel2)}</g:custom_label_2>`,
    `      <g:custom_label_3>${escapeXml(item.customLabel3)}</g:custom_label_3>`,
    `      <g:custom_label_4>${escapeXml(item.customLabel4)}</g:custom_label_4>`,
    '    </item>',
  ];

  return lines.join('\n');
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

/**
 * Genera el feed XML RSS 2.0 compatible con Meta Commerce Manager y Advantage+ Catalog Ads.
 */
export function buildMetaCatalogXml(
  products: ProductWithRelations[],
  categories: Category[],
  options: MetaFeedOptions
): string {
  const cleanSiteUrl = options.siteUrl.replace(/\/+$/, '');
  const mode: MetaFeedMode = options.mode === 'products' ? 'products' : 'variants';
  const categoryNameMap = new Map(categories.map((c) => [c.slug, c.name]));

  const renderedItems: string[] = [];

  for (const product of products) {
    const categoryName = categoryNameMap.get(product.category) || product.category || 'Maquillaje';
    const googleCategory = getGoogleProductCategory(product.category);
    const productType = `Maquillaje > ${categoryName}`;
    const baseDescription =
      (product.description || '').trim() ||
      `${product.name} - ${categoryName} de ${CONFIG.brandName} en ${CONFIG.defaultCity}.`;
    const priceTier = getPriceTierLabel(product.price);
    const commercialHook = getCommercialHookLabel(product);
    const galleryUrls = collectProductGalleryUrls(product, cleanSiteUrl);
    const fallbackMainImage = galleryUrls[0] || toAbsoluteUrl(product.mainImage, cleanSiteUrl);
    const productTones = product.tones || [];
    const hasTones = productTones.length > 0;

    if (mode === 'variants' && hasTones) {
      for (const tone of productTones) {
        const isAvailable = Boolean(product.inStock) && Boolean(tone.inStock) && tone.stock > 0;
        const inventory =
          Boolean(product.inStock) && Boolean(tone.inStock)
            ? Math.max(0, Math.floor(tone.stock))
            : 0;
        const primaryImg = toAbsoluteUrl(
          tone.image || product.productImages?.[0]?.url || product.mainImage,
          cleanSiteUrl
        );
        const additionalImgs = galleryUrls.filter((url) => url !== primaryImg);

        renderedItems.push(
          renderFeedItem({
            id: tone.id,
            itemGroupId: product.id,
            title: `${product.name} - ${tone.name}`,
            description: `Tono ${tone.name}. ${baseDescription}`,
            link: buildDeepLink(cleanSiteUrl, product.id, tone.id),
            imageLink: primaryImg,
            additionalImageLinks: additionalImgs,
            availability: isAvailable ? 'in stock' : 'out of stock',
            inventory,
            price: product.price,
            color: tone.name,
            googleProductCategory: googleCategory,
            productType,
            customLabel0: product.category,
            customLabel1: priceTier,
            customLabel2: commercialHook,
            customLabel3: getStockHealthLabel(
              Boolean(product.inStock && tone.inStock),
              tone.stock
            ),
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
      const primaryImg = toAbsoluteUrl(
        product.productImages?.[0]?.url || product.mainImage,
        cleanSiteUrl
      );
      const additionalImgs = galleryUrls.filter((url) => url !== primaryImg);

      renderedItems.push(
        renderFeedItem({
          id: product.id,
          itemGroupId: product.id,
          title: product.name,
          description: baseDescription,
          link: buildDeepLink(cleanSiteUrl, product.id),
          imageLink: primaryImg || fallbackMainImage,
          additionalImageLinks: additionalImgs,
          availability: isAvailable ? 'in stock' : 'out of stock',
          inventory,
          price: product.price,
          googleProductCategory: googleCategory,
          productType,
          customLabel0: product.category,
          customLabel1: priceTier,
          customLabel2: commercialHook,
          customLabel3: getStockHealthLabel(Boolean(product.inStock), effectiveStock),
          customLabel4: hasTones ? 'multi_tono' : 'tono_unico',
        })
      );
    }
  }

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
