import { useState, useEffect, useMemo } from 'react';
import type { OrderWithItems, ProductWithRelations } from '../../db/schema';
import { createManualAdminOrder, updateOrder } from '../../lib/api-client';
import { CONFIG } from '../../config';
import { formatCop, parseCop } from '../../utils/currency';
import ProductSearchCombobox from './ProductSearchCombobox';
import ProductPickerModal from './ProductPickerModal';
import ProductConfigCard, { type ConfiguredProductItem } from './ProductConfigCard';

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

  // Visual Product Selector State
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<ProductWithRelations | null>(null);

  // Multistep Flow State (1: Productos, 2: Cliente, 3: Estado y Confirmar)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Status & submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate data when editing or opening
  useEffect(() => {
    setCurrentStep(1);
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

  const formatPrice = formatCop;

  const handleAddConfiguredItem = (item: ConfiguredProductItem) => {
    const existingIndex = items.findIndex(
      (it) => it.productId === item.productId && it.toneId === item.toneId
    );

    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: it.quantity + item.quantity, price: item.price }
            : it
        )
      );
    } else {
      const newItem: FormOrderItem = {
        key: `${item.productId}_${item.toneId || 'notone'}_${Date.now()}`,
        productId: item.productId,
        productName: item.productName,
        toneId: item.toneId,
        toneName: item.toneName,
        imageUrl: item.imageUrl,
        price: item.price,
        catalogPrice: item.catalogPrice,
        quantity: item.quantity,
        maxStock: item.maxStock,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setSelectedProductForConfig(null);
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
    const val = parseCop(newPriceStr);
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, price: val } : it))
    );
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

  // Multistep Navigation Handlers
  const handleNextFromStep1 = () => {
    if (items.length === 0) {
      setErrorMessage('Por favor agrega al menos un producto al pedido');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
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
    setErrorMessage(null);
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations with auto-switch to problematic step
    if (items.length === 0) {
      setErrorMessage('Debes agregar al menos un producto al pedido');
      setCurrentStep(1);
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !customerCity.trim()) {
      if (!customerName.trim()) setErrorMessage('El nombre del cliente es obligatorio');
      else if (!customerPhone.trim()) setErrorMessage('El teléfono del cliente es obligatorio');
      else if (!customerAddress.trim()) setErrorMessage('La dirección de entrega es obligatoria');
      else setErrorMessage('La ciudad de entrega es obligatoria');
      setCurrentStep(2);
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
    <>
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

        {/* Step Navigation Bar (Multistep) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(215, 176, 106, 0.2)',
            backgroundColor: 'var(--color-panel-dark)',
            padding: '2px 8px',
            position: 'sticky',
            top: '73px',
            zIndex: 9,
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderBottom: currentStep === 1 ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: currentStep === 1 ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontWeight: currentStep === 1 ? '700' : '500',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span>💄</span>
            <span>1. Productos</span>
            <span
              style={{
                backgroundColor: currentStep === 1 ? 'rgba(215, 176, 106, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: currentStep === 1 ? 'var(--color-gold)' : 'inherit',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: '700',
              }}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderBottom: currentStep === 2 ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: currentStep === 2 ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontWeight: currentStep === 2 ? '700' : '500',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span>👤</span>
            <span>2. Cliente</span>
            {customerName.trim() && customerPhone.trim() && customerAddress.trim() && customerCity.trim() ? (
              <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: '700' }}>✓</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              borderBottom: currentStep === 3 ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: currentStep === 3 ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontWeight: currentStep === 3 ? '700' : '500',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span>📦</span>
            <span>3. Estado</span>
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

          {/* PASO 1: PRODUCTOS */}
          {currentStep === 1 && (
            <div className="admin-multistep-step">
              {/* Bloque: Agregar Productos */}
              <div
                style={{
                  backgroundColor: 'var(--color-panel-dark)',
                  border: '1px solid rgba(215, 176, 106, 0.22)',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
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
                    1. Seleccionar Productos
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                    {products.length} disponibles
                  </span>
                </div>

                <ProductSearchCombobox
                  products={products}
                  onSelectProduct={(p) => setSelectedProductForConfig(p)}
                  onOpenCatalogPicker={() => setIsCatalogPickerOpen(true)}
                />

                {selectedProductForConfig && (
                  <ProductConfigCard
                    key={selectedProductForConfig.id}
                    product={selectedProductForConfig}
                    onAdd={handleAddConfiguredItem}
                    onCancel={() => setSelectedProductForConfig(null)}
                  />
                )}
              </div>

              {/* Bloque: Items en este Pedido */}
              <div
                style={{
                  backgroundColor: 'var(--color-panel-dark)',
                  border: '1px solid rgba(215, 176, 106, 0.16)',
                  borderRadius: '12px',
                  padding: '14px',
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
                    Productos en este Pedido ({items.length})
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {totalUnits} unidades en total
                  </span>
                </div>

                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(215, 176, 106, 0.2)',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🛍️</span>
                    No has agregado productos a este pedido. Usa el buscador arriba o toca <strong>Explorar Catálogo</strong> para añadir prendas o cosméticos con foto.
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
                          border: '1px solid rgba(215, 176, 106, 0.14)',
                          borderRadius: '10px',
                          padding: '10px',
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{
                              width: '52px',
                              height: '52px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid rgba(215, 176, 106, 0.25)',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(215, 176, 106, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              flexShrink: 0,
                            }}
                          >
                            💄
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: '600', color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.productName}
                          </p>
                          {item.toneName && (
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'var(--color-gold)' }}>
                              💄 Tono: <strong>{item.toneName}</strong>
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Precio:</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={item.price}
                              onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                              style={{
                                width: '84px',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(215, 176, 106, 0.25)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                color: 'var(--color-gold)',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                              }}
                            />
                          </div>
                        </div>

                        {/* Stepper Cantidad Táctil (≥ 36px en móvil) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, -1)}
                            aria-label="Restar una unidad"
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(215, 176, 106, 0.25)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '1.1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                            aria-label="Sumar una unidad"
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(215, 176, 106, 0.25)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '1.1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                              padding: '4px 6px',
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
          )}

          {/* PASO 2: DATOS DEL CLIENTE */}
          {currentStep === 2 && (
            <div className="admin-multistep-step">
              <div
                style={{
                  backgroundColor: 'var(--color-panel-dark)',
                  border: '1px solid rgba(215, 176, 106, 0.16)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-gold)',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      margin: 0,
                      letterSpacing: '0.5px',
                    }}
                  >
                    2. Datos de Entrega y Cliente
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                    * Campos obligatorios
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>
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
                        fontSize: '16px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>
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
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>
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
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>
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
            </div>
          )}

          {/* PASO 3: ESTADO Y RESUMEN FINAL */}
          {currentStep === 3 && (
            <div className="admin-multistep-step">
              {/* Selector de Estado */}
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
                          minHeight: '44px',
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

              {/* Resumen del Cliente */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(215, 176, 106, 0.16)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-gold)', textTransform: 'uppercase', fontWeight: '700' }}>
                    👤 Cliente y Entrega
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#fff', lineHeight: 1.4 }}>
                  <div><strong>{customerName || '(Sin nombre)'}</strong> • {customerPhone || '(Sin teléfono)'}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                    📍 {customerAddress || '(Sin dirección)'}, {customerCity}
                  </div>
                  {customerNotes && (
                    <div style={{ color: 'var(--color-gold)', fontSize: '0.76rem', marginTop: '4px', fontStyle: 'italic' }}>
                      📝 Nota: {customerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen de Productos */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(215, 176, 106, 0.16)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-gold)', textTransform: 'uppercase', fontWeight: '700' }}>
                    💄 Productos ({items.length} items • {totalUnits} unidades)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((it) => (
                    <div
                      key={it.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        {it.imageUrl && (
                          <img
                            src={it.imageUrl}
                            alt={it.productName}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <span style={{ color: '#fff', fontWeight: '600', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {it.productName}
                          </span>
                          {it.toneName && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)' }}>
                              Tono: {it.toneName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {it.quantity} × {formatPrice(it.price)} =
                        </span>{' '}
                        <strong style={{ color: 'var(--color-gold)' }}>
                          {formatPrice(it.quantity * it.price)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile-First Footer with Step Navigation */}
        <div
          style={{
            padding: '12px 18px',
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
          {/* Left Side: Summary or Back button */}
          <div>
            {currentStep === 1 ? (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Total ({totalUnits} un.):
                </span>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-gold)', lineHeight: 1.1 }}>
                  {formatPrice(orderTotal)}
                </div>
              </div>
            ) : currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  color: 'var(--color-text-muted)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  minHeight: '44px',
                }}
              >
                ← Productos
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  color: 'var(--color-text-muted)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  minHeight: '44px',
                }}
              >
                ← Cliente
              </button>
            )}
          </div>

          {/* Right Side: Step Advancement or Submit */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(215, 176, 106, 0.3)',
                    color: 'var(--color-text-muted)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    minHeight: '44px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  style={{
                    backgroundColor: 'var(--color-burgundy)',
                    border: '1px solid var(--color-gold)',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-gold)',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Cliente</span>
                  <span>→</span>
                </button>
              </>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                style={{
                  backgroundColor: 'var(--color-burgundy)',
                  border: '1px solid var(--color-gold)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-gold)',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Estado y Total</span>
                <span>→</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--color-burgundy)',
                  border: '1px solid var(--color-gold)',
                  color: 'var(--color-white)',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-gold)',
                  opacity: isSubmitting ? 0.7 : 1,
                  minHeight: '44px',
                }}
              >
                {isSubmitting
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar Cambios'
                  : `Crear Pedido (${formatPrice(orderTotal)})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Drawer táctil de Catálogo Visual - SIBLING fuera del contenedor con backdrop-filter */}
    <ProductPickerModal
      isOpen={isCatalogPickerOpen}
      onClose={() => setIsCatalogPickerOpen(false)}
      products={products}
      onAddProduct={handleAddConfiguredItem}
    />
  </>
);
}
