import type { AnalyticsEvent } from './types';

/**
 * Obtiene o inicializa un ID de sesión anónimo en sessionStorage
 * para agrupar métricas de visitantes únicos sin cookies invasivas.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem('bella_sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('bella_sid', sid);
    }
    return sid;
  } catch {
    return 's_anon';
  }
}

/**
 * Despacha el evento a la base de datos D1 a través de un beacon no bloqueante.
 * No satura el hilo principal ni interfiere con las animaciones o la navegación.
 */
export function dispatchDatabaseAnalytics(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Ignorar navegación dentro del panel de administración
  if (window.location.pathname.startsWith('/admin')) return;

  const sessionId = getSessionId();
  const currentPath = window.location.pathname;

  let payload: Record<string, unknown> = {
    eventName: event.name,
    path: currentPath,
    sessionId,
  };

  switch (event.name) {
    case 'page_view':
      payload = {
        ...payload,
        path: event.path || currentPath,
      };
      break;

    case 'view_item':
      payload = {
        ...payload,
        productId: event.product.id,
        productName: event.product.name,
        category: event.product.category,
        value: event.product.price,
      };
      break;

    case 'add_to_cart':
      payload = {
        ...payload,
        productId: event.product.id,
        productName: event.product.name,
        category: event.product.category,
        value: event.product.price * (event.product.quantity || 1),
      };
      break;

    case 'initiate_checkout':
      payload = {
        ...payload,
        value: event.total,
      };
      break;

    case 'purchase':
      payload = {
        ...payload,
        value: event.total,
      };
      break;

    case 'contact_whatsapp':
      payload = {
        ...payload,
        source: event.source,
        productName: event.productName || null,
      };
      break;
  }

  try {
    const jsonStr = JSON.stringify(payload);

    // Prioridad 1: navigator.sendBeacon (asíncrono en segundo plano del navegador)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/event', blob);
      return;
    }

    // Prioridad 2: fetch con keepalive para no bloquear cierre de pestaña o redirección a WhatsApp
    if (typeof fetch === 'function') {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Falla silenciosa sin interrumpir la experiencia del usuario
  }
}
