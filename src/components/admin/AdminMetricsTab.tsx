import { useState, useMemo, useEffect } from 'react';
import type { OrderWithItems, ProductWithRelations, Category } from '../../db/schema';
import type { AnalyticsSummary } from '../../lib/services';
import { getDbAnalyticsMetrics } from '../../lib/api-client';
import { formatCop } from '../../utils/currency';
import { CONFIG } from '../../config';

export interface AdminMetricsTabProps {
  orders: OrderWithItems[];
  products: ProductWithRelations[];
  categories: Category[];
}

type PeriodFilter = 'all' | 'today' | '7days' | '30days';

export default function AdminMetricsTab({
  orders,
  products,
  categories,
}: AdminMetricsTabProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [refTime] = useState(() => Date.now());

  // Métricas almacenadas en la base de datos Cloudflare D1
  const [dbSummary, setDbSummary] = useState<AnalyticsSummary | null>(null);
  const [loadingDbMetrics, setLoadingDbMetrics] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getDbAnalyticsMetrics(period)
      .then((data) => {
        if (isMounted) {
          setDbSummary(data);
          setLoadingDbMetrics(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Error al cargar métricas de base de datos:', err);
        if (isMounted) setLoadingDbMetrics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period]);

  // 1. Filtrar órdenes por el rango de tiempo seleccionado
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;

    const now = new Date(refTime);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      if (period === 'today') {
        return orderDate >= startOfToday;
      }
      if (period === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      if (period === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [orders, period, refTime]);

  // 2. Cálculos Financieros y de Pedidos desde las órdenes
  const orderMetrics = useMemo(() => {
    let totalGrossSales = 0;
    let totalCollectedPayments = 0;
    let totalReceivables = 0;
    let activeOrdersCount = 0;
    let totalUnitsSold = 0;

    const statusCounts: Record<string, { count: number; total: number }> = {
      pending: { count: 0, total: 0 },
      separated: { count: 0, total: 0 },
      confirmed: { count: 0, total: 0 },
      shipped: { count: 0, total: 0 },
      delivered: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    };

    const productSalesMap = new Map<
      string,
      {
        name: string;
        units: number;
        revenue: number;
        image?: string;
      }
    >();

    const productMap = new Map(products.map((p) => [p.id, p]));

    filteredOrders.forEach((order) => {
      const st = order.status || 'pending';
      if (statusCounts[st]) {
        statusCounts[st].count += 1;
        statusCounts[st].total += order.total;
      }

      if (st !== 'cancelled') {
        totalGrossSales += order.total;
        activeOrdersCount += 1;

        const payments = order.payments || [];
        const paidInOrder = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        totalCollectedPayments += paidInOrder;

        if (st === 'separated') {
          const balance = Math.max(0, order.total - paidInOrder);
          totalReceivables += balance;
        }

        (order.items || []).forEach((item) => {
          totalUnitsSold += item.quantity;
          const current = productSalesMap.get(item.productId) || {
            name: item.productName,
            units: 0,
            revenue: 0,
            image: productMap.get(item.productId)?.mainImage,
          };
          current.units += item.quantity;
          current.revenue += item.price * item.quantity;
          productSalesMap.set(item.productId, current);
        });
      }
    });

    const averageOrderValue = activeOrdersCount > 0 ? Math.round(totalGrossSales / activeOrdersCount) : 0;

    const topSoldProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 5);

    // Salud del inventario
    let inventoryTotalValuation = 0;
    let outOfStockCount = 0;
    const criticalStockProducts: Array<{ name: string; stock: number; category: string }> = [];

    products.forEach((p) => {
      const hasTones = p.tones && p.tones.length > 0;
      let effectiveStock = p.stock;

      if (hasTones) {
        effectiveStock = p.tones.reduce((sum, t) => sum + (t.stock || 0), 0);
      }

      inventoryTotalValuation += effectiveStock * p.price;

      if (effectiveStock === 0 || !p.inStock) {
        outOfStockCount += 1;
      } else if (effectiveStock <= 3) {
        criticalStockProducts.push({
          name: p.name,
          stock: effectiveStock,
          category: p.category,
        });
      }
    });

    return {
      totalGrossSales,
      totalCollectedPayments,
      totalReceivables,
      averageOrderValue,
      activeOrdersCount,
      totalOrdersCount: filteredOrders.length,
      totalUnitsSold,
      statusCounts,
      topSoldProducts,
      inventoryTotalValuation,
      outOfStockCount,
      criticalStockProducts,
    };
  }, [filteredOrders, products]);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente por Confirmar', color: '#f59e0b' },
    separated: { label: 'Separado (Apartado)', color: '#c4b5fd' },
    confirmed: { label: 'Confirmado para Despacho', color: '#60a5fa' },
    shipped: { label: 'En Camino / Enviado', color: '#38bdf8' },
    delivered: { label: 'Entregado / Completado', color: '#34d399' },
    cancelled: { label: 'Cancelado', color: '#f87171' },
  };

  const isMetaConfigured = Boolean(CONFIG.metaPixelId);

  // Cálculos del embudo de conversión
  const pageViews = dbSummary?.totalPageViews || 0;
  const productViews = dbSummary?.totalProductViews || 0;
  const cartAdds = dbSummary?.totalCartAdds || 0;
  const checkouts = dbSummary?.totalCheckouts || 0;
  const confirmedOrders = orderMetrics.activeOrdersCount;

  const funnelSteps = [
    { label: 'Visitas a la Web', count: pageViews, icon: '👁️', color: '#60a5fa' },
    { label: 'Fichas de Producto Vistas', count: productViews, icon: '🔍', color: '#c4b5fd' },
    { label: 'Agregados a la Bolsa', count: cartAdds, icon: '🛒', color: '#f59e0b' },
    { label: 'Bolsa / Checkout Abierto', count: checkouts, icon: '📋', color: '#fb923c' },
    { label: 'Pedidos Confirmados (DB)', count: confirmedOrders, icon: '💰', color: '#34d399' },
  ];

  const maxFunnelCount = Math.max(1, pageViews, productViews, cartAdds, checkouts, confirmedOrders);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Barra de Filtro de Período con Indicador D1 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--color-panel-dark)',
          border: '1px solid rgba(215, 176, 106, 0.25)',
          borderRadius: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                color: 'var(--color-gold)',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Métricas Almacenadas en Base de Datos (Cloudflare D1)
            </h2>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 7px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              D1 Database Sync
            </span>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Eventos de navegación, embudo en vivo y transacciones persistidas en tiempo real
          </p>
        </div>

        {/* Botones de Rango de Fecha */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'all', label: 'Todo el Histórico' },
              { id: 'today', label: 'Hoy' },
              { id: '7days', label: 'Últimos 7 días' },
              { id: '30days', label: 'Últimos 30 días' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              style={{
                backgroundColor: period === btn.id ? 'var(--color-gold)' : 'rgba(0, 0, 0, 0.4)',
                color: period === btn.id ? '#120709' : 'var(--color-text-muted)',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN 1: MÉTRICAS DE TRÁFICO Y EMBUDO DE CONVERSIÓN (DESDE D1) */}
      <div
        style={{
          backgroundColor: 'var(--color-panel-dark)',
          border: '1px solid rgba(215, 176, 106, 0.25)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-gold)', margin: 0, fontWeight: 500 }}>
              Embudo de Conversión en Vivo (Eventos D1)
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
              Seguimiento desde la primera visita hasta la confirmación del pedido
            </span>
          </div>
          {loadingDbMetrics && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontStyle: 'italic' }}>
              Actualizando métricas...
            </span>
          )}
        </div>

        {/* Tarjetas de Tráfico Rápido */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(215, 176, 106, 0.15)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Visitas Web</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 600, color: '#60a5fa' }}>{pageViews}</p>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(215, 176, 106, 0.15)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sesiones Únicas</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 600, color: '#c4b5fd' }}>{dbSummary?.uniqueSessions || 0}</p>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(215, 176, 106, 0.15)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Agregados al Carrito</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 600, color: '#f59e0b' }}>{cartAdds}</p>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(215, 176, 106, 0.15)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Clics en WhatsApp</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 600, color: '#34d399' }}>{dbSummary?.totalWhatsAppClicks || 0}</p>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(215, 176, 106, 0.15)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tasa de Conversión</span>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-gold)' }}>
              {dbSummary?.conversionRate || 0}%
            </p>
          </div>
        </div>

        {/* Visualización Gráfica del Embudo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {funnelSteps.map((step, idx) => {
            const widthPct = Math.max(4, Math.round((step.count / maxFunnelCount) * 100));
            const prevCount = idx > 0 ? funnelSteps[idx - 1]?.count || 0 : 0;
            const dropoffPct = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 100;

            return (
              <div
                key={step.label}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                    {step.icon} {step.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {idx > 0 && prevCount > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        ({dropoffPct}% del paso anterior)
                      </span>
                    )}
                    <span style={{ fontSize: '0.9rem', color: step.color, fontWeight: 700 }}>
                      {step.count}
                    </span>
                  </div>
                </div>

                {/* Barra horizontal animada */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      backgroundColor: step.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: TARJETAS KPI FINANCIERAS (EN COP) */}
      <div className="admin-metrics-grid">
        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.35)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-premium)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            💰 Ventas Totales
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--color-gold)', margin: '6px 0 0 0', fontWeight: '600' }}>
            {formatCop(orderMetrics.totalGrossSales)}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            En {orderMetrics.activeOrdersCount} pedidos activos
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-premium)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            💳 Dinero Cobrado
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#34d399', margin: '6px 0 0 0', fontWeight: '600' }}>
            {formatCop(orderMetrics.totalCollectedPayments)}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            Abonos y pagos verificados
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-premium)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            ⏳ Saldo por Cobrar
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#f59e0b', margin: '6px 0 0 0', fontWeight: '600' }}>
            {formatCop(orderMetrics.totalReceivables)}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            En pedidos separados pendientes
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.25)',
            borderRadius: '14px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-premium)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            🧾 Ticket Promedio
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#fff', margin: '6px 0 0 0', fontWeight: '400' }}>
            {formatCop(orderMetrics.averageOrderValue)}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            {orderMetrics.totalUnitsSold} unidades vendidas
          </span>
        </div>
      </div>

      {/* SECCIÓN 3: TOP PRODUCTOS VISTOS (D1) VS TOP PRODUCTOS VENDIDOS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Columna Izquierda: Más Visualizados en Catálogo (D1) */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-gold)', margin: '0 0 14px 0', fontWeight: 500 }}>
            Top Productos Más Visualizados (D1)
          </h3>

          {!dbSummary || dbSummary.topViewedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay vistas de producto registradas en este período.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dbSummary.topViewedProducts.map((p, idx) => {
                const maxViews = dbSummary.topViewedProducts[0]?.views || 1;
                const ratio = Math.round((p.views / maxViews) * 100);

                return (
                  <div
                    key={(p.productName || p.productId || '') + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(215, 176, 106, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: idx === 0 ? 'var(--color-gold)' : 'var(--color-text-muted)', width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.productName}
                      </p>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: '#c4b5fd' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#c4b5fd' }}>
                      {p.views} vistas
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Top Productos Más Vendidos */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-gold)', margin: '0 0 14px 0', fontWeight: 500 }}>
            Top Productos Más Vendidos
          </h3>

          {orderMetrics.topSoldProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay ventas registradas en el período seleccionado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orderMetrics.topSoldProducts.map((prod, idx) => {
                const maxUnits = orderMetrics.topSoldProducts[0]?.units || 1;
                const ratio = Math.round((prod.units / maxUnits) * 100);

                return (
                  <div
                    key={prod.name + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(215, 176, 106, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: idx === 0 ? 'var(--color-gold)' : 'var(--color-text-muted)', width: '20px' }}>
                      #{idx + 1}
                    </span>

                    {prod.image && (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#1b0e11' }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </p>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: 'var(--color-gold)' }} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                        {prod.units} un.
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {formatCop(prod.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 4: ESTADOS DE PEDIDOS & SALUD DE INVENTARIO */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Desglose de Pedidos */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.2)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-gold)', margin: '0 0 14px 0', fontWeight: 500 }}>
            Desglose por Estado de Pedidos
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(orderMetrics.statusCounts).map(([statusKey, val]) => {
              const meta = statusLabels[statusKey] || { label: statusKey, color: '#fff' };
              const pct = orderMetrics.totalOrdersCount > 0 ? Math.round((val.count / orderMetrics.totalOrdersCount) * 100) : 0;

              return (
                <div
                  key={statusKey}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: `1px solid ${meta.color}22`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: meta.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{meta.label}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.84rem', color: meta.color, fontWeight: 700 }}>{val.count}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>({pct}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Salud del Inventario & Meta Pixel */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1px solid rgba(215, 176, 106, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-gold)', margin: 0, fontWeight: 500 }}>
                Inventario & Pixel
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: isMetaConfigured ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                  color: isMetaConfigured ? '#34d399' : '#f59e0b',
                }}
              >
                {isMetaConfigured ? 'Pixel Activo' : 'Pixel Pendiente'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                border: '1px solid rgba(215, 176, 106, 0.15)',
                marginBottom: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Valor Total del Stock</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '1.25rem', color: '#fff', fontWeight: 600 }}>
                  {formatCop(orderMetrics.inventoryTotalValuation)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: orderMetrics.outOfStockCount > 0 ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>
                  Agotados: {orderMetrics.outOfStockCount}
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {categories.length} categorías
                </p>
              </div>
            </div>

            {orderMetrics.criticalStockProducts.length > 0 && (
              <div>
                <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  ⚠️ Productos con Stock Crítico (≤ 3 un.):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                  {orderMetrics.criticalStockProducts.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                      }}
                    >
                      <span style={{ color: '#fff' }}>{p.name}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{p.stock} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <a
              href="https://business.facebook.com/events_manager2"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                backgroundColor: 'rgba(215, 176, 106, 0.12)',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Abrir Meta Events Manager ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
