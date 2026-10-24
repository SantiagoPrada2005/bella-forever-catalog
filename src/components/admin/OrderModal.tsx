import { useState, useEffect, useMemo } from 'react';
import type { OrderWithItems, ProductWithRelations } from '../../db/schema';
import { createManualAdminOrder, updateOrder } from '../../lib/api-client';
import { CONFIG } from '../../config';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  orderToEdit?: OrderWithItems | null;
  products: ProductWithRelations[];
}

interface FormOrderItem {
  key: string;
  productId: string;
  productName: string;
  toneId: string | null;
  toneName: string | null;
  imageUrl: string | null;
  price: number;
  catalogPrice: number;
  quantity: number;
  maxStock: number;
}

const ORDER_STATUS_OPTIONS: Array<{
  id: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated';
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  description: string;
}> = [
  {
    id: 'pending',
    label: 'Pendiente ⏳',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: '#f59e0b',
    badgeColor: '#f59e0b',
    description: 'Pedido recibido, pendiente de confirmación',
  },
  {
    id: 'separated',
    label: 'Separado 📦',
    badgeBg: 'rgba(139, 92, 246, 0.2)',
    badgeBorder: '#a78bfa',
    badgeColor: '#c4b5fd',
    description: 'Entregado o apartado con pago pendiente / abonos',
  },
  {
    id: 'confirmed',
    label: 'Confirmado ✅',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: '#3b82f6',
    badgeColor: '#60a5fa',
    description: 'Pago acordado/verificado, listo para despacho',
  },
  {
    id: 'shipped',
    label: 'En camino 🚚',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: '#a855f7',
    badgeColor: '#c084fc',
    description: 'En ruta de entrega con mensajero/transportadora',
  },
  {
    id: 'delivered',
    label: 'Entregado 🎉',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: '#10b981',
    badgeColor: '#34d399',
    description: 'Entregado a conformidad y pagado en su totalidad',
  },
  {
    id: 'cancelled',
    label: 'Cancelado ❌',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: '#ef4444',
    badgeColor: '#f87171',
    description: 'Cancelado; las unidades se restauran al inventario',
  },
];

export default function OrderModal({
  isOpen,
  onClose,
  onSaved,
  orderToEdit,
  products,
}: OrderModalProps) {
  const isEditing = Boolean(orderToEdit);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState(CONFIG.defaultCity || 'Cali');
  const [customerNotes, setCustomerNotes] = useState('');
  const [status, setStatus] = useState<
    'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'separated'
  >('pending');
  const [items, setItems] = useState<FormOrderItem[]>([]);

  // Product Picker State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedToneId, setSelectedToneId] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(1);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  // Status & submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate data when editing or opening
  useEffect(() => {
    if (orderToEdit) {
      setCustomerName(orderToEdit.customerName || '');
      setCustomerPhone(orderToEdit.customerPhone || '');
      setCustomerEmail(orderToEdit.customerEmail || '');
      setCustomerAddress(orderToEdit.customerAddress || '');
      setCustomerCity(orderToEdit.customerCity || CONFIG.defaultCity || 'Cali');
      setCustomerNotes(orderToEdit.customerNotes || '');
      setStatus(orderToEdit.status as any);

      // Map existing order items
      const mappedItems: FormOrderItem[] = (orderToEdit.items || []).map((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const tone = prod?.tones?.find((t) => t.id === it.toneId);
        const availableStock = tone ? tone.stock : (prod?.stock ?? 10);

        return {
          key: `${it.productId}_${it.toneId || 'notone'}_${Math.random()}`,
          productId: it.productId,
          productName: it.productName,
          toneId: it.toneId || null,
          toneName: it.toneName || null,
          imageUrl: it.imageUrl || prod?.mainImage || null,
          price: it.price,
          catalogPrice: prod?.price ?? it.price,
          quantity: it.quantity,
          maxStock: availableStock + (orderToEdit.status !== 'cancelled' ? it.quantity : 0),
        };
      });

      setItems(mappedItems);
    } else {
      // New Order defaults
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerCity(CONFIG.defaultCity || 'Cali');
      setCustomerNotes('');
      setStatus('pending');
      setItems([]);
    }
    setErrorMessage(null);
  }, [orderToEdit, products]);

  // Selected Product helper
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Available tones for selected product
  const availableTones = useMemo(() => {
    return selectedProduct?.tones || [];
  }, [selectedProduct]);

  // Stock for current selection in picker
  const currentSelectionStock = useMemo(() => {
    if (!selectedProduct) return 0;
    if (availableTones.length > 0) {
      const tone = availableTones.find((t) => t.id === selectedToneId);
      return tone ? tone.stock : 0;
    }
    return selectedProduct.stock;
  }, [selectedProduct, availableTones, selectedToneId]);

  // Set default tone and price when product changes
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.tones && selectedProduct.tones.length > 0) {
        setSelectedToneId(selectedProduct.tones[0].id);
      } else {
        setSelectedToneId('');
      }
      setCustomPriceInput(selectedProduct.price.toString());
      setAddQty(1);
    } else {
      setSelectedToneId('');
      setCustomPriceInput('');
    }
  }, [selectedProduct]);

  // Filtered products list for search
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tones || []).some((t) => t.name.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    }).format(val);
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;

    let toneName: string | null = null;
    let imageUrl = selectedProduct.mainImage;
    let toneId: string | null = null;

    if (availableTones.length > 0) {
      const tone = availableTones.find((t) => t.id === selectedToneId);
      if (!tone) {
        setErrorMessage('Por favor selecciona un tono');
        return;
      }
      toneName = tone.name;
      toneId = tone.id;
      if (tone.image) imageUrl = tone.image;
    }

    const price = parseFloat(customPriceInput);
    if (isNaN(price) || price < 0) {
      setErrorMessage('Ingresa un precio unitario válido');
      return;
    }

    const qty = Math.max(1, Math.floor(addQty));

    // Check if already in items list
    const existingIndex = items.findIndex(
      (it) => it.productId === selectedProduct.id && it.toneId === toneId
    );

    if (existingIndex >= 0) {
      // Update quantity
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: it.quantity + qty, price }
            : it
        )
      );
    } else {
      const newItem: FormOrderItem = {
        key: `${selectedProduct.id}_${toneId || 'notone'}_${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        toneId,
        toneName,
        imageUrl,
        price,
        catalogPrice: selectedProduct.price,
        quantity: qty,
        maxStock: currentSelectionStock,
      };
      setItems((prev) => [...prev, newItem]);
    }

    // Reset picker
    setSelectedProductId('');
    setSearchQuery('');
    setErrorMessage(null);
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it, idx) => {
          if (idx !== index) return it;
          const nextQty = it.quantity + delta;
          if (nextQty <= 0) return null;
          return { ...it, quantity: nextQty };
        })
        .filter(Boolean) as FormOrderItem[]
    );
  };

  const handleUpdateItemPrice = (index: number, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    if (!isNaN(val) && val >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, price: val } : it))
      );
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const orderTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [items]);

  const totalUnits = useMemo(() => {
    return items.reduce((acc, it) => acc + it.quantity, 0);
  }, [items]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!customerName.trim()) {
      setErrorMessage('El nombre del cliente es obligatorio');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('El teléfono del cliente es obligatorio');
      return;
    }
    if (!customerAddress.trim()) {
      setErrorMessage('La dirección de entrega es obligatoria');
      return;
    }
    if (!customerCity.trim()) {
      setErrorMessage('La ciudad de entrega es obligatoria');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Debes agregar al menos un producto al pedido');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && orderToEdit) {
        await updateOrder(orderToEdit.id, {
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || null,
            address: customerAddress.trim(),
            city: customerCity.trim(),
            notes: customerNotes.trim() || null,
          },
          status,
          items: items.map((it) => ({
            productId: it.productId,
            toneId: it.toneId,
            quantity: it.quantity,
            price: it.price,
          })),
        });
      } else {
        await createManualAdminOrder({
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            address: customerAddress.trim(),
            city: customerCity.trim(),
            notes: customerNotes.trim() || undefined,
          },
          status,
          items: items.map((it) => ({
            productId: it.productId,
            toneId: it.toneId,
            quantity: it.quantity,
            price: it.price,
          })),
        });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el pedido';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 3200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          border: '1px solid var(--color-gold)',
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-premium)',
          position: 'relative',
        }}
        className="admin-order-modal-dialog"
      >
        {/* Sticky Header Mobile-First */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(215, 176, 106, 0.2)',
            backgroundColor: 'var(--color-panel-dark)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-gold)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                {isEditing ? 'Modificar Pedido' : 'Nuevo Pedido Manual'}
              </span>
              {isEditing && orderToEdit && (
                <span
                  style={{
                    backgroundColor: 'rgba(215, 176, 106, 0.15)',
                    color: 'var(--color-gold)',
                    fontFamily: 'monospace',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                  }}
                >
                  #{orderToEdit.orderNumber}
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                color: '#fff',
                margin: '2px 0 0 0',
                fontWeight: '400',
              }}
            >
              {isEditing ? `Editar #${orderToEdit?.orderNumber}` : 'Registrar Pedido'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{errorMessage}</span>
            </div>
          )}

          {/* SECCIÓN 1: ESTADO DEL PEDIDO */}
          <div
            style={{
              backgroundColor: 'var(--color-panel-dark)',
              border: '1px solid rgba(215, 176, 106, 0.16)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--color-gold)',
                fontWeight: '700',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}
            >
              Estado del Pedido *
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              {ORDER_STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    style={{
                      backgroundColor: isSelected ? opt.badgeBg : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isSelected ? opt.badgeBorder : 'rgba(255, 255, 255, 0.1)'}`,
                      color: isSelected ? opt.badgeColor : 'var(--color-text-muted)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>{opt.label}</div>
                  </button>
                );
              })}
            </div>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              ℹ️ {ORDER_STATUS_OPTIONS.find((o) => o.id === status)?.description}
            </p>
          </div>

          {/* SECCIÓN 2: DATOS DEL CLIENTE */}
          <div
            style={{
              backgroundColor: 'var(--color-panel-dark)',
              border: '1px solid rgba(215, 176, 106, 0.16)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-gold)',
                fontWeight: '700',
                textTransform: 'uppercase',
                margin: '0 0 12px 0',
                letterSpacing: '0.5px',
              }}
            >
              1. Datos de Entrega y Cliente
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px', // Previene zoom en iOS
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="Ej: 300 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cali, Palmira, Medellín..."
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carrera 1 # 2 - 34, Apto 501"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Email (opcional)
                </label>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="cliente@ejemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Notas de Entrega (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Dejar en portería, envolver para regalo..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SELECTOR DE PRODUCTOS */}
          <div
            style={{
              backgroundColor: 'var(--color-panel-dark)',
              border: '1px solid rgba(215, 176, 106, 0.16)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-gold)',
                fontWeight: '700',
                textTransform: 'uppercase',
                margin: '0 0 10px 0',
                letterSpacing: '0.5px',
              }}
            >
              2. Agregar Productos al Pedido
            </h3>

            {/* Buscador de catálogo */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Dropdown de producto */}
            <div style={{ marginBottom: '10px' }}>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(215, 176, 106, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ backgroundColor: '#16090c', color: '#888' }}>
                  -- Selecciona un producto ({filteredCatalog.length} disponibles) --
                </option>
                {filteredCatalog.map((p) => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: '#16090c', color: '#fff' }}>
                    {p.name} - {formatPrice(p.price)} (Stock total: {p.tones?.length ? p.tones.reduce((s, t) => s + t.stock, 0) : p.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Detalle del producto seleccionado para agregar */}
            {selectedProduct && (
              <div
                style={{
                  backgroundColor: 'rgba(215, 176, 106, 0.05)',
                  border: '1px solid rgba(215, 176, 106, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '10px',
                }}
              >
                {/* Selector de tonos si aplica */}
                {availableTones.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-gold)', marginBottom: '6px', fontWeight: '600' }}>
                      Selecciona el Tono:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {availableTones.map((t) => {
                        const isToneSelected = selectedToneId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedToneId(t.id)}
                            style={{
                              backgroundColor: isToneSelected ? 'rgba(215, 176, 106, 0.25)' : 'rgba(0,0,0,0.4)',
                              border: `1.5px solid ${isToneSelected ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)'}`,
                              color: isToneSelected ? 'var(--color-gold)' : '#fff',
                              borderRadius: '20px',
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: t.hex,
                                display: 'inline-block',
                                border: '1px solid rgba(255,255,255,0.3)',
                              }}
                            />
                            <span>{t.name}</span>
                            <span style={{ color: t.stock > 0 ? '#34d399' : '#f87171', fontSize: '0.72rem', fontWeight: '700' }}>
                              ({t.stock})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cantidad y Precio unitario */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Cantidad
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(215, 176, 106, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={addQty}
                        onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{
                          width: '50px',
                          height: '38px',
                          textAlign: 'center',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(215, 176, 106, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setAddQty((q) => q + 1)}
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(215, 176, 106, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Precio Unitario ($)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(215, 176, 106, 0.3)',
                        borderRadius: '6px',
                        padding: '0 10px',
                        color: 'var(--color-gold)',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      height: '38px',
                      backgroundColor: 'var(--color-gold)',
                      color: '#000',
                      border: 'none',
                      padding: '0 16px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-gold)',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 4: LISTA DE PRODUCTOS SELECCIONADOS */}
          <div
            style={{
              backgroundColor: 'var(--color-panel-dark)',
              border: '1px solid rgba(215, 176, 106, 0.16)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-gold)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}
              >
                3. Items en este Pedido ({items.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {totalUnits} unidades en total
              </span>
            </div>

            {items.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '28px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(215, 176, 106, 0.2)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No has agregado productos a este pedido. Usa el selector arriba para añadir prendas o cosméticos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(215, 176, 106, 0.12)',
                      borderRadius: '10px',
                      padding: '10px',
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        style={{
                          width: '46px',
                          height: '46px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid rgba(215, 176, 106, 0.2)',
                        }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: '600', color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.productName}
                      </p>
                      {item.toneName && (
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'var(--color-gold)' }}>
                          💄 Tono: {item.toneName}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Precio:</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={item.price}
                          onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                          style={{
                            width: '74px',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(215, 176, 106, 0.2)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            color: 'var(--color-gold)',
                            fontSize: '0.76rem',
                            fontWeight: '700',
                          }}
                        />
                      </div>
                    </div>

                    {/* Stepper Cantidad Táctil */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, -1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(215, 176, 106, 0.25)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '1rem',
                          cursor: 'pointer',
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(215, 176, 106, 0.25)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '1rem',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--color-gold)', fontSize: '0.9rem', display: 'block' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Eliminar producto"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          marginTop: '2px',
                          padding: '2px 4px',
                        }}
                      >
                        Eliminar ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Mobile-First Footer with Total & CTA */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(215, 176, 106, 0.2)',
            backgroundColor: 'var(--color-panel-dark)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total ({totalUnits} un.):
            </span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: '700', color: 'var(--color-gold)', lineHeight: 1.1 }}>
              {formatPrice(orderTotal)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                color: 'var(--color-text-muted)',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--color-burgundy)',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-white)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-gold)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
