import { useEffect, useState, type SubmitEvent } from 'react';
import Header from '../Header';
import { 
  getProducts, 
  deleteProduct, 
  toggleProductStock, 
  updateProductStockQuantity,
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getOrders,
  updateOrderStatus
} from '../../lib/api-client';
import { CONFIG } from '../../config';
import type { ProductWithRelations, Category, OrderWithItems } from '../../db/schema';

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro y modal de pedidos
  const [orderFilter, setOrderFilter] = useState<string>('todos');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Edición rápida de stock en productos
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  // State for category management
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [prods, cats, ords] = await Promise.all([
          getProducts(),
          getCategories(),
          getOrders(),
        ]);
        if (isMounted) {
          setProducts(prods);
          setCategories(cats);
          setOrders(ords);
        }
      } catch (err: unknown) {
        console.error("Error al cargar datos iniciales", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: unknown) {
      console.error("Error al obtener productos", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      console.error("Error al obtener categorías", err);
    }
  };

  const fetchOrdersList = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err: unknown) {
      console.error("Error al obtener pedidos", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      setLoading(true);
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (err: unknown) {
        console.error("Error al eliminar producto", err);
        alert("Error al eliminar el producto");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStock = async (id: string, currentStock: boolean) => {
    try {
      const nextStock = !currentStock;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: nextStock } : p));
      await toggleProductStock(id, nextStock);
    } catch (err: unknown) {
      console.error("Error al actualizar stock", err);
      alert("Error al actualizar el stock");
      fetchProducts();
    }
  };

  const handleSaveStockQuantity = async (id: string) => {
    try {
      const safeVal = Math.max(0, editingStockVal);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: safeVal, inStock: safeVal > 0 } : p));
      setEditingStockId(null);
      await updateProductStockQuantity(id, safeVal);
    } catch (err: unknown) {
      console.error("Error al actualizar cantidad de stock", err);
      alert("Error al actualizar cantidad de stock");
      fetchProducts();
    }
  };

  const handleOrderStatusChange = async (
    orderId: string, 
    newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    let restock = false;
    if (newStatus === 'cancelled') {
      restock = confirm("¿Deseas reingresar y restaurar automáticamente las unidades de este pedido al inventario?");
    }

    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, restock);
      await Promise.all([fetchOrdersList(), fetchProducts()]);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: unknown) {
      console.error("Error al actualizar estado del pedido", err);
      alert("Error al actualizar el estado del pedido");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateCategory = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSubmitting(true);
    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      await fetchCategories();
    } catch (err: unknown) {
      console.error(err);
      alert("Error al crear la categoría");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;
    setCatSubmitting(true);
    try {
      await updateCategory(editingCat.id, editingCat.name.trim());
      setEditingCat(null);
      await fetchCategories();
      await fetchProducts();
    } catch (err: unknown) {
      console.error(err);
      alert("Error al actualizar la categoría");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (cat.id === 'sin-categoria') {
      alert("No se puede eliminar la categoría por defecto");
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Los productos asociados pasarán a "Sin categoría".`)) {
      try {
        await deleteCategory(cat.id);
        await fetchCategories();
        await fetchProducts();
      } catch (err: unknown) {
        console.error(err);
        alert("Error al eliminar la categoría");
      }
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    }).format(value);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Métricas de pedidos
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const activeOrdersCount = orders.filter(o => ['confirmed', 'shipped'].includes(o.status)).length;
  const totalSalesRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const filteredOrders = orderFilter === 'todos'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b' };
      case 'confirmed':
        return { label: 'Confirmado', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', color: '#60a5fa' };
      case 'shipped':
        return { label: 'En camino', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', color: '#c084fc' };
      case 'delivered':
        return { label: 'Entregado', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#34d399' };
      case 'cancelled':
        return { label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#f87171' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', border: '#888', color: '#ccc' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '90px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header />

      <main style={{ flex: '1 0 auto', padding: '20px 24px', maxWidth: '1240px', width: '100%', margin: '0 auto' }}>
        {/* Cabecera del panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: '300', color: 'var(--color-white)', margin: 0 }}>
              Panel de Administración
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px', margin: '4px 0 0 0' }}>
              Gestión centralizada de pedidos, inventario y catálogo.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/admin/nuevo" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-gold)',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-gold)',
                transition: 'all 0.3s ease',
              }}>
                + NUEVO PRODUCTO
              </button>
            </a>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(215, 176, 106, 0.2)', paddingBottom: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{
              background: activeTab === 'orders' ? 'rgba(215, 176, 106, 0.12)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '2px solid var(--color-gold)' : '2px solid transparent',
              color: activeTab === 'orders' ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontSize: '1.05rem',
              fontWeight: '600',
              padding: '10px 18px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>🛍️ Pedidos ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span style={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontSize: '0.72rem',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 7px',
              }}>
                {pendingOrdersCount} nuevos
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            style={{
              background: activeTab === 'products' ? 'rgba(215, 176, 106, 0.12)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'products' ? '2px solid var(--color-gold)' : '2px solid transparent',
              color: activeTab === 'products' ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontSize: '1.05rem',
              fontWeight: '600',
              padding: '10px 18px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s',
            }}
          >
            💄 Productos ({products.length})
          </button>

          <button 
            onClick={() => setActiveTab('categories')}
            style={{
              background: activeTab === 'categories' ? 'rgba(215, 176, 106, 0.12)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'categories' ? '2px solid var(--color-gold)' : '2px solid transparent',
              color: activeTab === 'categories' ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontSize: '1.05rem',
              fontWeight: '600',
              padding: '10px 18px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s',
            }}
          >
            🏷️ Categorías ({categories.length})
          </button>
        </div>

        {/* TAB 1: GESTIÓN DE PEDIDOS */}
        {activeTab === 'orders' && (
          <div>
            {/* Tarjetas de Métricas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                backgroundColor: 'var(--color-panel-dark)',
                border: '1px solid rgba(215, 176, 106, 0.2)',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-premium)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Total Pedidos
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#fff', margin: '6px 0 0 0', fontWeight: '400' }}>
                  {orders.length}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-panel-dark)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-premium)',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Pendientes de Atención
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#f59e0b', margin: '6px 0 0 0', fontWeight: '400' }}>
                  {pendingOrdersCount}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-panel-dark)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-premium)',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  En Trámite / Camino
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#60a5fa', margin: '6px 0 0 0', fontWeight: '400' }}>
                  {activeOrdersCount}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-panel-dark)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-premium)',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Ventas Registradas
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', color: 'var(--color-gold)', margin: '6px 0 0 0', fontWeight: '600' }}>
                  {formatPrice(totalSalesRevenue)}
                </p>
              </div>
            </div>

            {/* Filtros de estado */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginRight: '6px' }}>Filtrar:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'confirmed', label: 'Confirmados' },
                { id: 'shipped', label: 'En camino' },
                { id: 'delivered', label: 'Entregados' },
                { id: 'cancelled', label: 'Cancelados' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  style={{
                    backgroundColor: orderFilter === f.id ? 'var(--color-gold)' : 'rgba(255,255,255,0.05)',
                    color: orderFilter === f.id ? '#000' : 'var(--color-text-light)',
                    border: '1px solid rgba(215, 176, 106, 0.2)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: orderFilter === f.id ? '700' : '500',
                    transition: 'all 0.2s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tabla de Pedidos */}
            {loading && orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                Cargando pedidos...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: 'var(--border-glass)', borderRadius: '16px', background: 'rgba(18, 9, 11, 0.4)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', margin: 0 }}>
                  No hay pedidos registrados con el filtro actual.
                </p>
              </div>
            ) : (
              <div style={{
                overflowX: 'auto',
                background: 'var(--color-panel-dark)',
                border: 'var(--border-glass)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-premium)',
                padding: '10px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-glass)', color: 'var(--color-gold)' }}>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Pedido</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Fecha</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Cliente & Entrega</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Items</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Total</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500' }}>Estado</th>
                      <th style={{ padding: '14px 12px', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      const isUpdating = updatingOrderId === order.id;
                      const cleanPhone = order.customerPhone.replace(/\D/g, '');
                      const waContactUrl = `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent(
                        `Hola ${order.customerName}, te escribimos de ${CONFIG.brandName} sobre tu pedido #${order.orderNumber}.`
                      )}`;

                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(215, 176, 106, 0.05)' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: 'var(--color-gold)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            #{order.orderNumber}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                            {formatDate(order.createdAt)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{order.customerName}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>📱 {order.customerPhone}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>📍 {order.customerAddress}, {order.customerCity}</div>
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.85rem', color: '#fff' }}>
                            <span>{(order.items || []).reduce((acc, i) => acc + i.quantity, 0)} un.</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>
                              ({(order.items || []).length} prod.)
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '700', color: 'var(--color-gold)', fontSize: '0.95rem' }}>
                            {formatPrice(order.total)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <select
                              value={order.status}
                              disabled={isUpdating}
                              onChange={(e) => handleOrderStatusChange(order.id, e.target.value as any)}
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                borderRadius: '20px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="pending" style={{ backgroundColor: 'var(--color-panel-dark)', color: '#f59e0b' }}>Pendiente</option>
                              <option value="confirmed" style={{ backgroundColor: 'var(--color-panel-dark)', color: '#60a5fa' }}>Confirmado</option>
                              <option value="shipped" style={{ backgroundColor: 'var(--color-panel-dark)', color: '#c084fc' }}>En camino</option>
                              <option value="delivered" style={{ backgroundColor: 'var(--color-panel-dark)', color: '#34d399' }}>Entregado</option>
                              <option value="cancelled" style={{ backgroundColor: 'var(--color-panel-dark)', color: '#f87171' }}>Cancelado</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              <a href={waContactUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                <button
                                  title="Escribir al cliente por WhatsApp"
                                  style={{
                                    backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                    border: '1px solid rgba(37, 211, 102, 0.4)',
                                    color: '#25D366',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                  }}
                                >
                                  WhatsApp 📱
                                </button>
                              </a>

                              <button
                                onClick={() => setSelectedOrder(order)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(215, 176, 106, 0.3)',
                                  color: 'var(--color-gold)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                }}
                              >
                                Detalle 👁️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GESTIÓN DE PRODUCTOS E INVENTARIO */}
        {activeTab === 'products' && (
          <>
            {loading && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                Cargando catálogo...
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: 'var(--border-glass)', borderRadius: '16px', background: 'rgba(18, 9, 11, 0.4)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '20px' }}>No hay productos en el catálogo.</p>
                <a href="/admin/nuevo">
                  <button style={{ background: 'none', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                    Crear tu primer producto
                  </button>
                </a>
              </div>
            ) : (
              <div style={{
                overflowX: 'auto',
                background: 'var(--color-panel-dark)',
                border: 'var(--border-glass)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-premium)',
                padding: '10px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-glass)', color: 'var(--color-gold)' }}>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Imagen</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Nombre & Tonos</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Categoría</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Precio</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Inventario (Stock)</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500' }}>Disponibilidad</th>
                      <th style={{ padding: '16px 12px', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const hasTones = Boolean(product.tones && product.tones.length > 0);
                      const isStockEditing = editingStockId === product.id;

                      return (
                        <tr key={product.id} style={{ borderBottom: '1px solid rgba(215, 176, 106, 0.05)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px' }}>
                            <img 
                               src={product.mainImage} 
                               alt={product.name} 
                               style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.1)' }} 
                            />
                          </td>
                          <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                            {product.name}
                            {hasTones && (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                {product.tones.map(t => (
                                  <span 
                                    key={t.id} 
                                    title={`${t.name} (Stock: ${t.stock})`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      backgroundColor: 'rgba(0,0,0,0.3)',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontSize: '0.72rem',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                  >
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.hex, display: 'inline-block' }} />
                                    <span>{t.name} ({t.stock})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                            {product.category}
                          </td>
                          <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>
                            {formatPrice(product.price)}
                          </td>
                          
                          {/* Columna de Inventario con Edición Rápida */}
                          <td style={{ padding: '12px' }}>
                            {hasTones ? (
                              <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '600' }}>
                                  {product.tones.reduce((sum, t) => sum + t.stock, 0)} un.
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                  (en {product.tones.length} tonos)
                                </span>
                              </div>
                            ) : isStockEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingStockVal}
                                  onChange={(e) => setEditingStockVal(parseInt(e.target.value, 10) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveStockQuantity(product.id);
                                    if (e.key === 'Escape') setEditingStockId(null);
                                  }}
                                  autoFocus
                                  style={{
                                    width: '60px',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-gold)',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveStockQuantity(product.id)}
                                  style={{ background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700' }}
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  color: product.stock === 0 ? '#ef4444' : product.stock <= 3 ? '#f59e0b' : '#10b981',
                                }}>
                                  {product.stock} un.
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingStockId(product.id);
                                    setEditingStockVal(product.stock);
                                  }}
                                  title="Editar stock rápido"
                                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Toggle de Disponibilidad */}
                          <td style={{ padding: '12px' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={product.inStock} 
                                onChange={() => handleToggleStock(product.id, product.inStock)}
                                style={{ accentColor: 'var(--color-gold)' }}
                              />
                              <span style={{ fontSize: '0.85rem', color: product.inStock ? '#4BB543' : '#ff3333', fontWeight: '500' }}>
                                {product.inStock ? 'Visible' : 'Oculto / Agotado'}
                              </span>
                            </label>
                          </td>

                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <a href={`/admin/editar/${product.id}`} style={{ textDecoration: 'none' }}>
                                <button style={{
                                  background: 'none',
                                  border: '1px solid rgba(215, 176, 106, 0.4)',
                                  color: 'var(--color-gold)',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}>
                                  Editar
                                </button>
                              </a>
                              
                              <button 
                                onClick={() => handleDelete(product.id, product.name)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(255, 51, 51, 0.4)',
                                  color: '#ff5555',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB 3: CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--color-panel-dark)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
              <input 
                type="text" 
                placeholder="Nombre de la nueva categoría (ej. Iluminadores)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={catSubmitting}
                style={{
                  flex: '1',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
              <button 
                type="submit"
                disabled={catSubmitting || !newCatName.trim()}
                style={{
                  backgroundColor: 'var(--color-burgundy)',
                  color: 'var(--color-white)',
                  border: '1px solid var(--color-gold)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: catSubmitting || !newCatName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: catSubmitting || !newCatName.trim() ? 0.6 : 1,
                }}
              >
                + AGREGAR CATEGORÍA
              </button>
            </form>

            <div style={{
              overflowX: 'auto',
              background: 'var(--color-panel-dark)',
              border: 'var(--border-glass)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-premium)',
              padding: '10px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: 'var(--border-glass)', color: 'var(--color-gold)' }}>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Nombre</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Slug</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Productos</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const prodCount = products.filter(p => p.category === cat.slug).length;
                    const isEditing = editingCat?.id === cat.id;

                    return (
                      <tr key={cat.id} style={{ borderBottom: '1px solid rgba(215, 176, 106, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                          {isEditing ? (
                            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                value={editingCat.name} 
                                onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid var(--color-gold)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  color: '#fff',
                                }}
                              />
                              <button type="submit" style={{ background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                Guardar
                              </button>
                              <button type="button" onClick={() => setEditingCat(null)} style={{ background: 'none', border: '1px solid #666', color: '#ccc', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </form>
                          ) : (
                            cat.name
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {cat.slug}
                        </td>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          {prodCount}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {cat.id === 'sin-categoria' ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sistema</span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              {!isEditing && (
                                <button 
                                  onClick={() => setEditingCat({ id: cat.id, name: cat.name })}
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(215, 176, 106, 0.4)',
                                    color: 'var(--color-gold)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Editar
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteCategory(cat)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(255, 51, 51, 0.4)',
                                  color: '#ff5555',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DE DETALLE DE PEDIDO */}
        {selectedOrder && (
          <div 
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--color-panel-dark)',
                border: '1px solid var(--color-gold)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-premium)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(215,176,106,0.2)', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Detalle del Pedido
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#fff', margin: '4px 0 0 0' }}>
                    #{selectedOrder.orderNumber}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Registrado el {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '1.4rem', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </div>

              {/* Datos de Entrega */}
              <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem' }}>
                <p style={{ margin: '0 0 6px 0', color: '#fff', fontWeight: '600' }}>
                  👤 {selectedOrder.customerName}
                </p>
                <p style={{ margin: '0 0 6px 0', color: 'var(--color-text-muted)' }}>
                  📱 Teléfono: <strong style={{ color: '#fff' }}>{selectedOrder.customerPhone}</strong>
                </p>
                <p style={{ margin: '0 0 6px 0', color: 'var(--color-text-muted)' }}>
                  📍 Dirección: <strong style={{ color: '#fff' }}>{selectedOrder.customerAddress}, {selectedOrder.customerCity}</strong>
                </p>
                {selectedOrder.customerNotes && (
                  <p style={{ margin: '6px 0 0 0', color: 'var(--color-gold)', fontStyle: 'italic' }}>
                    📝 Nota del cliente: {selectedOrder.customerNotes}
                  </p>
                )}
              </div>

              {/* Items del Pedido */}
              <h4 style={{ color: 'var(--color-gold)', fontSize: '1rem', marginBottom: '10px' }}>
                Productos Ordenados
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                    )}
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>{item.productName}</p>
                      {item.toneName && (
                        <p style={{ margin: '2px 0 0 0', color: 'var(--color-gold)', fontSize: '0.78rem' }}>💄 Tono: {item.toneName}</p>
                      )}
                      <p style={{ margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--color-gold)', fontSize: '0.95rem' }}>
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total y Acciones del Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(215,176,106,0.2)', paddingTop: '14px', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#fff' }}>Total del Pedido:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-gold)' }}>{formatPrice(selectedOrder.total)}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleOrderStatusChange(selectedOrder.id, 'cancelled')}
                    style={{
                      background: 'none',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                    }}
                  >
                    Cancelar Pedido
                  </button>
                )}

                <a 
                  href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hola ${selectedOrder.customerName}, te contactamos de ${CONFIG.brandName} respecto a tu pedido #${selectedOrder.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    style={{
                      backgroundColor: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                    }}
                  >
                    Abrir WhatsApp 📱
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
