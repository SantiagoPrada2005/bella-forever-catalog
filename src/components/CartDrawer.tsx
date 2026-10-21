import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';
import { getCustomerCookie, setCustomerCookie, type CustomerData } from '../utils/cookie';
import { createOrder } from '../lib/api-client';
import type { OrderWithItems, ProductWithRelations } from '../db/schema';

export interface CartItem {
  key: string;
  productId: string;
  toneId?: string | null;
  productName: string;
  toneName?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartDrawerProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (key: string, delta: number) => void;
  onOrderCompleted: (order: OrderWithItems) => void;
  initialProducts?: ProductWithRelations[];
}

export default function CartDrawer({
  cart,
  onClose,
  onUpdateQuantity,
  onOrderCompleted,
  initialProducts = [],
}: CartDrawerProps) {
  const drawerOverlay = useRef<HTMLDivElement>(null);
  const drawerContent = useRef<HTMLDivElement>(null);

  // Estados de checkout y cliente
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    phone: '',
    address: '',
    city: CONFIG.defaultCity,
    email: '',
    notes: '',
  });
  const [hasSavedData, setHasSavedData] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderWithItems | null>(null);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string>('');

  // Cargar datos previos de la cookie al montar
  useEffect(() => {
    const saved = getCustomerCookie();
    if (saved && saved.name && saved.phone && saved.address) {
      setCustomer({
        name: saved.name,
        phone: saved.phone,
        address: saved.address,
        city: saved.city || CONFIG.defaultCity,
        email: saved.email || '',
        notes: saved.notes || '',
      });
      setHasSavedData(true);
      setIsEditingData(false);
    } else {
      setIsEditingData(true);
    }
  }, []);

  useGSAP(() => {
    if (!drawerOverlay.current || !drawerContent.current) return;
    const tl = gsap.timeline();
    tl.fromTo(drawerOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    tl.fromTo(drawerContent.current, { x: '100%' }, { x: '0%', duration: 0.45, ease: 'power3.out' }, '-=0.2');

    if (cart.length > 0) {
      tl.fromTo('.cart-item-anim',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.35, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }, { scope: drawerOverlay });

  const handleClose = () => {
    if (!drawerOverlay.current || !drawerContent.current) {
      onClose();
      return;
    }
    gsap.to(drawerContent.current, { x: '100%', duration: 0.28, ease: 'power3.in' });
    gsap.to(drawerOverlay.current, { opacity: 0, duration: 0.28, onComplete: onClose });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const formattedTotal = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision,
  }).format(cartTotal);

  const buildWhatsAppUrl = (order: OrderWithItems) => {
    const numberFormatter = new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    });

    let message = `¡Hola, ${CONFIG.brandName}! 💄✨\nAcabo de registrar el pedido *#${order.orderNumber}* desde el catálogo:\n\n🛍️ *Detalle de mi compra:*\n`;

    order.items.forEach((item) => {
      const itemTotal = numberFormatter.format(item.price * item.quantity);
      const toneStr = item.toneName ? ` (${item.toneName})` : '';
      message += `• ${item.quantity} x ${item.productName}${toneStr} — ${itemTotal}\n`;
    });

    message += `\n💰 *Total:* ${numberFormatter.format(order.total)}\n`;
    message += `📍 *Entrega a:* ${order.customerName}\n`;
    message += `📱 *Teléfono:* ${order.customerPhone}\n`;
    message += `🏠 *Dirección:* ${order.customerAddress}, ${order.customerCity}\n`;
    if (order.customerNotes) {
      message += `📝 *Notas:* ${order.customerNotes}\n`;
    }
    message += `\n¿Me confirmas disponibilidad y los datos para coordinar el pago y envío? ¡Muchas gracias! 💕`;

    // Adjuntar imágenes de referencia si están disponibles
    const allImageUrls: string[] = [];
    order.items.forEach((item) => {
      const prod = initialProducts.find(p => p.id === item.productId);
      if (prod && prod.mainImage) {
        allImageUrls.push(prod.mainImage);
      }
    });

    if (allImageUrls.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const formattedUrls = allImageUrls.slice(0, 3).map(url => url.startsWith('http') ? url : `${origin}${url}`);
      message += `\n\n🖼️ *Imágenes de referencia:*\n${formattedUrls.join('\n')}`;
    }

    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setErrorMessage('Por favor completa tu Nombre, Teléfono y Dirección de entrega.');
      setIsEditingData(true);
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('El carrito está vacío.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || undefined,
          address: customer.address.trim(),
          city: customer.city?.trim() || CONFIG.defaultCity,
          notes: customer.notes?.trim() || undefined,
        },
        items: cart.map(item => ({
          productId: item.productId,
          toneId: item.toneId || null,
          quantity: item.quantity,
        })),
      };

      const newOrder = await createOrder(orderPayload);

      // Persistir o actualizar datos en la cookie del dispositivo
      if (rememberDevice) {
        setCustomerCookie({
          ...customer,
          lastOrderId: newOrder.id,
          lastOrderNumber: newOrder.orderNumber,
        });
        setHasSavedData(true);
      }

      const waUrl = buildWhatsAppUrl(newOrder);
      setLastWhatsAppUrl(waUrl);
      setCompletedOrder(newOrder);

      // Limpiar carrito en el estado principal
      onOrderCompleted(newOrder);

      // Abrir WhatsApp en nueva pestaña
      window.open(waUrl, '_blank');
    } catch (err: unknown) {
      console.error('Error al procesar el pedido:', err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al procesar el pedido. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={drawerOverlay}
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 2000,
      }}
    >
      <div
        ref={drawerContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-panel-dark)',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
          borderLeft: 'var(--border-glass)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: 'var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: '400', color: 'var(--color-gold)', margin: 0 }}>
              {completedOrder ? '¡Pedido Confirmado!' : 'Tu Pedido'}
            </h3>
            {hasSavedData && !completedOrder && (
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                ✓ Datos de entrega guardados en este dispositivo
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar carrito de compras"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              cursor: 'pointer',
              color: 'var(--color-gold)',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px 24px' }} className="no-scrollbar">
          {/* VISTA DE ÉXITO TRAS COMPLETAR PEDIDO */}
          {completedOrder ? (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(215, 176, 106, 0.15)',
                border: '2px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                ✨
              </div>

              <div>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--color-burgundy)',
                  color: 'var(--color-gold)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  border: '1px solid var(--color-gold)',
                }}>
                  PEDIDO #{completedOrder.orderNumber}
                </span>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#fff', margin: '4px 0 8px 0', fontWeight: '300' }}>
                  ¡Gracias por tu compra!
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '340px', margin: '0 auto' }}>
                  Tu pedido ha sido registrado en nuestro sistema y descontado de inventario.
                </p>
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(215,176,106,0.2)',
                borderRadius: '12px',
                padding: '16px',
                width: '100%',
                textAlign: 'left',
                fontSize: '0.85rem',
                color: 'var(--color-text-light)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-gold)' }}>Cliente:</span>
                  <span style={{ fontWeight: '600' }}>{completedOrder.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-gold)' }}>Entrega:</span>
                  <span style={{ fontWeight: '500' }}>{completedOrder.customerAddress}, {completedOrder.customerCity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: '600' }}>Total:</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-gold)' }}>
                    {new Intl.NumberFormat(CONFIG.currency.locale, {
                      style: 'currency',
                      currency: CONFIG.currency.code,
                      maximumFractionDigits: CONFIG.currency.precision,
                    }).format(completedOrder.total)}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <a
                  href={lastWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    style={{
                      width: '100%',
                      backgroundColor: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '13px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                    }}
                  >
                    <span>Abrir chat de WhatsApp</span>
                    <span>📱</span>
                  </button>
                </a>

                <button
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: 'var(--color-gold)',
                    border: '1px solid rgba(215, 176, 106, 0.3)',
                    padding: '11px 0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                  }}
                >
                  Seguir mirando el catálogo
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>El carrito está vacío</p>
              <p style={{ fontSize: '0.85rem' }}>¡Agrega tus cosméticos favoritos para coordinar el envío!</p>
            </div>
          ) : (
            <div>
              {/* Mensaje de error / stock insuficiente */}
              {errorMessage && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span>⚠️</span>
                  <div style={{ flexGrow: 1 }}>{errorMessage}</div>
                </div>
              )}

              {/* Lista de productos */}
              <div style={{ marginBottom: '20px' }}>
                {cart.map((item) => {
                  const formattedItemPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
                    style: 'currency',
                    currency: CONFIG.currency.code,
                    maximumFractionDigits: CONFIG.currency.precision,
                  }).format(item.price * item.quantity);

                  return (
                    <div
                      key={item.key}
                      className="cart-item-anim"
                      style={{
                        display: 'flex',
                        gap: '14px',
                        marginBottom: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingBottom: '14px',
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        width="64"
                        height="64"
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: 'var(--border-glass)' }}
                      />

                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: '400', color: 'var(--color-text-light)', margin: 0 }}>
                            {item.productName}
                          </h4>
                          {item.toneName && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: '500', margin: '2px 0 0 0' }}>
                              💄 {item.toneName}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => onUpdateQuantity(item.key, -1)}
                              aria-label={`Disminuir cantidad de ${item.productName}`}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--color-gold)',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >-</button>
                            <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.key, 1)}
                              aria-label={`Aumentar cantidad de ${item.productName}`}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--color-gold)',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >+</button>
                          </div>

                          <p style={{ fontWeight: '600', color: 'var(--color-gold)', fontSize: '0.95rem', margin: 0 }}>
                            {formattedItemPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECCIÓN DE DATOS DEL CLIENTE Y ENVÍO */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(215, 176, 106, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                {hasSavedData && !isEditingData ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '600' }}>
                        📍 Datos de Entrega
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingData(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffb347',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Cambiar datos
                      </button>
                    </div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>
                      {customer.name} • {customer.phone}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {customer.address}, {customer.city}
                    </p>
                    {customer.notes && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--color-gold)', fontStyle: 'italic' }}>
                        Nota: {customer.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: '600' }}>
                        📝 Información para el Envío
                      </span>
                      {hasSavedData && (
                        <button
                          type="button"
                          onClick={() => setIsEditingData(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="Tu nombre completo *"
                          value={customer.name}
                          onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                          autoComplete="name"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(215,176,106,0.2)',
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input
                          type="tel"
                          placeholder="Celular / WhatsApp *"
                          value={customer.phone}
                          onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                          autoComplete="tel"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(215,176,106,0.2)',
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Ciudad *"
                          value={customer.city}
                          onChange={(e) => setCustomer(prev => ({ ...prev, city: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(215,176,106,0.2)',
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Dirección y barrio *"
                          value={customer.address}
                          onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                          autoComplete="street-address"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(215,176,106,0.2)',
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Instrucciones especiales (opcional)"
                          value={customer.notes || ''}
                          onChange={(e) => setCustomer(prev => ({ ...prev, notes: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(215,176,106,0.15)',
                            backgroundColor: 'rgba(0,0,0,0.25)',
                            color: '#fff',
                            fontSize: '0.82rem',
                          }}
                        />
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={(e) => setRememberDevice(e.target.checked)}
                          style={{ accentColor: 'var(--color-gold)' }}
                        />
                        Recordar mis datos en este dispositivo para futuros pedidos
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER DEL DRAWER */}
        {!completedOrder && cart.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: 'var(--border-glass)',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
              fontSize: '1.25rem',
              fontWeight: '400',
              fontFamily: 'var(--font-serif)',
            }}>
              <span>Total:</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{formattedTotal}</span>
            </div>

            <button
              onClick={() => handleConfirmOrder()}
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-gold)',
                padding: '14px 0',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.95rem',
                letterSpacing: '1px',
                boxShadow: 'var(--shadow-gold)',
                opacity: isSubmitting ? 0.75 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
              }}
            >
              {isSubmitting ? (
                <span>Procesando pedido y verificando stock...</span>
              ) : (
                <>
                  <span>CONFIRMAR PEDIDO</span>
                  <span>✨</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
