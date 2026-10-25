import type { AnalyticsEvent } from './types';

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

/**
 * Traduce y despacha un evento de dominio hacia el Pixel de Meta en el navegador.
 */
export function dispatchClientPixelEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const fbq = window.fbq;
  if (!fbq || typeof fbq !== 'function') return;

  switch (event.name) {
    case 'page_view':
      fbq('track', 'PageView');
      break;

    case 'view_item':
      fbq('track', 'ViewContent', {
        content_name: event.product.name,
        content_category: event.product.category,
        content_ids: [event.product.id],
        content_type: 'product',
        value: event.product.price,
        currency: 'COP',
      });
      break;

    case 'add_to_cart':
      fbq('track', 'AddToCart', {
        content_name: event.product.name,
        content_category: event.product.category,
        content_ids: [event.product.id],
        content_type: 'product',
        value: event.product.price * (event.product.quantity || 1),
        currency: 'COP',
      });
      break;

    case 'initiate_checkout':
      fbq('track', 'InitiateCheckout', {
        content_ids: event.items.map((i) => i.id),
        contents: event.items.map((i) => ({
          id: i.id,
          quantity: i.quantity || 1,
          item_price: i.price,
        })),
        num_items: event.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: event.total,
        currency: 'COP',
      });
      break;

    case 'purchase':
      fbq(
        'track',
        'Purchase',
        {
          content_ids: event.items.map((i) => i.id),
          contents: event.items.map((i) => ({
            id: i.id,
            quantity: i.quantity || 1,
            item_price: i.price,
          })),
          num_items: event.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
          value: event.total,
          currency: 'COP',
        },
        { eventID: event.orderId }
      );
      break;

    case 'contact_whatsapp':
      fbq('trackCustom', 'ContactWhatsApp', {
        source: event.source,
        product: event.productName || 'general',
      });
      break;
  }
}
