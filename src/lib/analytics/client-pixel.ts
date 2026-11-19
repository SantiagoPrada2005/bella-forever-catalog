import { CONFIG } from '../../config';
import type { AnalyticsCustomer, AnalyticsEvent, AnalyticsProduct } from './types';

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      callMethod?: (...args: unknown[]) => void;
    };
    _fbq?: unknown;
  }
}

let lastAdvancedMatchingSignature = '';

function resolveCatalogContentId(product: Pick<AnalyticsProduct, 'id' | 'toneId'>): string {
  return product.toneId || product.id;
}

function normalizeTextToken(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return cleaned || undefined;
}

function normalizeColombiaPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }
  return digits.length >= 7 ? digits : undefined;
}

function buildSingleProductPayload(product: AnalyticsProduct, quantity = 1) {
  const contentId = resolveCatalogContentId(product);
  const contentName = product.tone ? `${product.name} - ${product.tone}` : product.name;

  return {
    content_name: contentName,
    content_category: product.category,
    content_ids: [contentId],
    contents: [
      {
        id: contentId,
        quantity,
        item_price: product.price,
      },
    ],
    content_type: 'product',
    item_group_id: product.id,
    value: product.price * quantity,
    currency: 'COP',
  };
}

function buildCartItemsPayload(items: AnalyticsProduct[]) {
  const uniqueCategories = Array.from(
    new Set(items.map((item) => item.category).filter((cat) => Boolean(cat && cat.trim())))
  );

  return {
    content_ids: items.map((item) => resolveCatalogContentId(item)),
    contents: items.map((item) => ({
      id: resolveCatalogContentId(item),
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
    content_type: 'product',
    content_category: uniqueCategories.join(', ') || 'maquillaje',
    num_items: items.reduce((acc, item) => acc + (item.quantity || 1), 0),
  };
}

/**
 * Envía señales de Advanced Matching normalizadas al Pixel de Meta en el cliente.
 * Meta `fbevents.js` aplica hash SHA-256 automáticamente antes de transmitir.
 */
export function applyMetaAdvancedMatching(customer?: AnalyticsCustomer | null): void {
  if (typeof window === 'undefined' || !customer) return;
  const fbq = window.fbq;
  const pixelId = CONFIG.metaPixelId;
  if (!fbq || typeof fbq !== 'function' || !pixelId) return;

  const userData: Record<string, string> = {};

  const normalizedEmail = normalizeTextToken(customer.email);
  if (normalizedEmail && normalizedEmail.includes('@')) {
    userData.em = normalizedEmail;
  }

  const normalizedPhone = normalizeColombiaPhone(customer.phone);
  if (normalizedPhone) {
    userData.ph = normalizedPhone;
  }

  const normalizedName = normalizeTextToken(customer.name);
  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);
    if (parts[0]) {
      userData.fn = parts[0];
    }
    if (parts.length > 1) {
      userData.ln = parts.slice(1).join('');
    }
  }

  const normalizedCity = normalizeTextToken(customer.city);
  if (normalizedCity) {
    userData.ct = normalizedCity.replace(/\s+/g, '');
  }

  if (Object.keys(userData).length === 0) return;
  userData.country = 'co';

  const signature = JSON.stringify(userData);
  if (signature === lastAdvancedMatchingSignature) return;

  lastAdvancedMatchingSignature = signature;
  fbq('init', pixelId, userData);
}

/**
 * Traduce y despacha un evento de dominio hacia el Pixel de Meta en el navegador.
 */
export function dispatchClientPixelEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const fbq = window.fbq;
  if (!fbq || typeof fbq !== 'function') return;

  switch (event.name) {
    case 'page_view':
      if (event.skipPixel) return;
      fbq('track', 'PageView');
      break;

    case 'view_item':
      fbq('track', 'ViewContent', buildSingleProductPayload(event.product, 1));
      break;

    case 'add_to_cart':
      fbq(
        'track',
        'AddToCart',
        buildSingleProductPayload(event.product, event.product.quantity || 1)
      );
      break;

    case 'initiate_checkout':
      fbq('track', 'InitiateCheckout', {
        ...buildCartItemsPayload(event.items),
        value: event.total,
        currency: 'COP',
        customer_type: event.customerType || 'new',
      });
      break;

    case 'purchase':
      if (event.customer) {
        applyMetaAdvancedMatching(event.customer);
      }
      fbq(
        'track',
        'Purchase',
        {
          ...buildCartItemsPayload(event.items),
          value: event.total,
          currency: 'COP',
          customer_type: event.customerType || 'new',
          delivery_city: event.customer?.city || CONFIG.defaultCity,
        },
        { eventID: event.orderId }
      );
      break;

    case 'contact_whatsapp':
      fbq('trackCustom', 'ContactWhatsApp', {
        source: event.source,
        product: event.product?.name || event.productName || 'general',
        content_category: event.product?.category,
      });
      if (event.product) {
        fbq('track', 'Lead', {
          ...buildSingleProductPayload(event.product, 1),
          source: event.source,
        });
      }
      break;

    case 'view_category':
      fbq('trackCustom', 'ViewCategory', {
        content_category: event.category,
        category_name: event.categoryLabel || event.category,
        content_ids: event.productIds.slice(0, 20),
        content_type: 'product',
      });
      break;

    case 'search':
      fbq('track', 'Search', {
        search_string: event.query,
        content_category: event.category || 'todos',
        content_ids: event.productIds.slice(0, 20),
        content_type: 'product',
        num_results: event.resultsCount,
      });
      break;
  }
}
