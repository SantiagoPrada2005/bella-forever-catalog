/**
 * Observador nativo de Core Web Vitals (LCP, INP, CLS) con CERO librerías externas
 * y cero sobrecarga en el hilo principal.
 */
export function initPerformanceTelemetry(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Solo registrar en desarrollo o cuando se active la bandera de depuración
  if (!import.meta.env.DEV && !window.location.search.includes('debug_perf=true')) {
    return;
  }

  try {
    // 1. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const value = Math.round(lastEntry.startTime);
        const rating = value <= 2500 ? '🟢 Buena' : value <= 4000 ? '🟡 Mejorable' : '🔴 Pobre';
        console.log(`[Web Vitals] ⚡ LCP: ${value}ms (${rating})`, lastEntry);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput && layoutShift.value) {
          clsValue += layoutShift.value;
        }
      }
      const rating = clsValue <= 0.1 ? '🟢 Bueno' : clsValue <= 0.25 ? '🟡 Mejorable' : '🔴 Pobre';
      console.log(`[Web Vitals] 📐 CLS: ${clsValue.toFixed(4)} (${rating})`);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // 3. Interaction to Next Paint (INP / Event Timing)
    if (PerformanceObserver.supportedEntryTypes?.includes('event')) {
      const inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const eventEntry = entry as PerformanceEntry & { duration?: number; interactionId?: number };
          if (eventEntry.duration && eventEntry.duration > 40 && eventEntry.interactionId) {
            const value = Math.round(eventEntry.duration);
            const rating = value <= 200 ? '🟢 Rápido' : value <= 500 ? '🟡 Aceptable' : '🔴 Lento';
            console.log(`[Web Vitals] 👆 INP: ${value}ms [${eventEntry.name}] (${rating})`);
          }
        }
      });
      inpObserver.observe({
        type: 'event',
        buffered: true,
        durationThreshold: 40,
      } as unknown as PerformanceObserverInit);
    }
  } catch {
    // Los navegadores que no soporten algún tipo específico de observer fallan silenciosamente
  }
}
