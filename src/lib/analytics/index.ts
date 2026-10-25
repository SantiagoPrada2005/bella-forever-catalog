import type { AnalyticsEvent } from './types';
import { dispatchClientPixelEvent } from './client-pixel';
import { dispatchDatabaseAnalytics } from './db-tracker';

/**
 * Fachada principal de analítica. Despacha eventos a proveedores activos (Meta Pixel, Base de Datos D1, etc.)
 * sin exponer detalles de implementación ni librerías de terceros a la UI.
 */
export function trackEvent(event: AnalyticsEvent): void {
  try {
    // 1. Enviar al Pixel del cliente
    dispatchClientPixelEvent(event);

    // 2. Persistir evento en la base de datos D1 (vía Beacon en segundo plano)
    dispatchDatabaseAnalytics(event);

    // 3. Registro transparente en desarrollo para validación
    if (import.meta.env.DEV) {
      console.log(`[Analytics] 📊 Evento emitido: ${event.name}`, event);
    }
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Error despachando evento:', err);
    }
  }
}

export * from './types';
