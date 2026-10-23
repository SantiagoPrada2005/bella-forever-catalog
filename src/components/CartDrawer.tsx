import { useRef, useState, useEffect, type SyntheticEvent } from 'react';
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

  useGSAP(
    () => {
      if (!drawerOverlay.current || !drawerContent.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline();
        tl.fromTo(drawerOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        tl.fromTo(
          drawerContent.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '-=0.18'
        );

        if (cart.length > 0) {
          tl.fromTo(
            '.cart-item-anim',
            { opacity: 0, x: 16 },
            { opacity: 1, x: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' },
            '-=0.2'
          );
        }
      });
    },
    { scope: drawerOverlay }
  );

  const handleClose = () => {
    if (!drawerOverlay.current || !drawerContent.current) {
      onClose();
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onClose();
      return;
    }
    gsap.to(drawerContent.current, { x: '100%', duration: 0.25, ease: 'power3.in' });
    gsap.to(drawerOverlay.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

    let message = `Hola, ${CONFIG.brandName}.\nAcabo de registrar el pedido *#${order.orderNumber}* desde el catálogo:\n\n*Detalle de mi compra:*\n`;

    order.items.forEach((item) => {
      const itemTotal = numberFormatter.format(item.price * item.quantity);
      const toneStr = item.toneName ? ` (${item.toneName})` : '';
      message += `- ${item.quantity} x ${item.productName}${toneStr} - ${itemTotal}\n`;
    });

    message += `\n*Total:* ${numberFormatter.format(order.total)}\n`;
    message += `*Entrega a:* ${order.customerName}\n`;
    message += `*Teléfono:* ${order.customerPhone}\n`;
    message += `*Dirección:* ${order.customerAddress}, ${order.customerCity}\n`;
    if (order.customerNotes) {
      message += `*Notas:* ${order.customerNotes}\n`;
    }
    message += `\n¿Me confirmas disponibilidad y los datos para coordinar el pago y envío? Muchas gracias.`;

    const allImageUrls: string[] = [];
    order.items.forEach((item) => {
      const prod = initialProducts.find((p) => p.id === item.productId);
      if (prod && prod.mainImage) {
        allImageUrls.push(prod.mainImage);
      }
    });

    if (allImageUrls.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const formattedUrls = allImageUrls
        .slice(0, 3)
        .map((url) => (url.startsWith('http') ? url : `${origin}${url}`));
      message += `\n\n*Imágenes de referencia:*\n${formattedUrls.join('\n')}`;
    }

    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmOrder = async (e?: SyntheticEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setErrorMessage('Por favor completa tu Nombre, Teléfono y Dirección de entrega.');
      setIsEditingData(true);
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Tu bolsa está vacía.');
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
        items: cart.map((item) => ({
          productId: item.productId,
          toneId: item.toneId || null,
          quantity: item.quantity,
        })),
      };

      const newOrder = await createOrder(orderPayload);

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

      onOrderCompleted(newOrder);
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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.22))',
    backgroundColor: '#FFFFFF',
    color: 'var(--catalog-ink, #24070E)',
    fontSize: '0.86rem',
    fontFamily: 'var(--font-sans)',
  } as const;

  const labelStyle = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--catalog-ink, #24070E)',
    marginBottom: '4px',
  } as const;

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
        backgroundColor: 'rgba(36, 7, 14, 0.42)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 2000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Bolsa de compras"
    >
      <div
        ref={drawerContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--catalog-bg, #FBF6F7)',
          color: 'var(--catalog-ink, #24070E)',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(36, 7, 14, 0.16)',
          borderLeft: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.16))',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.16))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '1.55rem',
                fontWeight: 500,
                color: 'var(--catalog-accent, #8C1D32)',
                lineHeight: 1.15,
                paddingBottom: '2px',
                margin: 0,
              }}
            >
              {completedOrder ? 'Pedido Confirmado' : 'Tu Bolsa'}
            </h3>
            {hasSavedData && !completedOrder && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--catalog-ink-muted, #68454D)',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Datos de entrega guardados en este dispositivo
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar bolsa de compras"
            style={{
              backgroundColor: 'var(--catalog-surface-card, #F4ECEE)',
              border: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.16))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: 'var(--catalog-accent, #8C1D32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido Principal */}
        <div
          style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}
          className="no-scrollbar"
        >
          {completedOrder ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span className="catalog-pill-tag">PEDIDO #{completedOrder.orderNumber}</span>
              <div>
                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '1.75rem',
                    color: 'var(--catalog-accent, #8C1D32)',
                    margin: '0 0 6px 0',
                    fontWeight: 500,
                    lineHeight: 1.15,
                    paddingBottom: '3px',
                  }}
                >
                  Gracias por tu compra
                </h4>
                <p
                  style={{
                    color: 'var(--catalog-ink-muted, #68454D)',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    maxWidth: '340px',
                    margin: '0 auto',
                  }}
                >
                  Tu pedido ha sido registrado y reservado en nuestro inventario.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.16))',
                  borderRadius: '14px',
                  padding: '16px',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--catalog-ink, #24070E)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--catalog-ink-muted, #68454D)' }}>Cliente:</span>
                  <span style={{ fontWeight: 600 }}>{completedOrder.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--catalog-ink-muted, #68454D)' }}>Entrega:</span>
                  <span style={{ fontWeight: 500 }}>
                    {completedOrder.customerAddress}, {completedOrder.customerCity}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--catalog-border-subtle, rgba(36, 7, 14, 0.08))',
                    paddingTop: '8px',
                  }}
                >
                  <span style={{ color: 'var(--catalog-accent, #8C1D32)', fontWeight: 600 }}>
                    Total:
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--catalog-accent, #8C1D32)' }}>
                    {new Intl.NumberFormat(CONFIG.currency.locale, {
                      style: 'currency',
                      currency: CONFIG.currency.code,
                      maximumFractionDigits: CONFIG.currency.precision,
                    }).format(completedOrder.total)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '8px',
                }}
              >
                <a
                  href={lastWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="catalog-spotlight-cta"
                  style={{ textDecoration: 'none', padding: '12px 16px' }}
                >
                  Enviar confirmación por WhatsApp
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="studio-product-card__cta"
                  style={{ padding: '11px 16px' }}
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                marginTop: '60px',
                color: 'var(--catalog-ink-muted, #68454D)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <p
                style={{
                  fontSize: '1.35rem',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--catalog-accent, #8C1D32)',
                  margin: 0,
                }}
              >
                Tu bolsa está vacía
              </p>
              <p style={{ fontSize: '0.86rem', margin: 0 }}>
                Selecciona tus cosméticos y tonos favoritos para coordinar tu entrega.
              </p>
            </div>
          ) : (
            <div>
              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    color: '#991B1B',
                    fontSize: '0.84rem',
                  }}
                >
                  {errorMessage}
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
                        gap: '12px',
                        marginBottom: '14px',
                        borderBottom: '1px solid var(--catalog-border-subtle, rgba(36, 7, 14, 0.08))',
                        paddingBottom: '14px',
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        width="64"
                        height="64"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid var(--catalog-border-subtle, rgba(36, 7, 14, 0.08))',
                          backgroundColor: '#FFFFFF',
                        }}
                      />

                      <div
                        style={{
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--catalog-ink, #24070E)',
                              margin: 0,
                            }}
                          >
                            {item.productName}
                          </h4>
                          {item.toneName && (
                            <p
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--catalog-accent, #8C1D32)',
                                fontWeight: 500,
                                margin: '2px 0 0 0',
                              }}
                            >
                              Tono: {item.toneName}
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.key, -1)}
                              aria-label={`Disminuir cantidad de ${item.productName}`}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '9999px',
                                border: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.2))',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                color: 'var(--catalog-accent, #8C1D32)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.key, 1)}
                              aria-label={`Aumentar cantidad de ${item.productName}`}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '9999px',
                                border: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.2))',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                color: 'var(--catalog-accent, #8C1D32)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              +
                            </button>
                          </div>

                          <p
                            style={{
                              fontWeight: 700,
                              color: 'var(--catalog-accent, #8C1D32)',
                              fontSize: '0.92rem',
                              margin: 0,
                            }}
                          >
                            {formattedItemPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Datos de Entrega con Labels explícitos arriba de cada campo (WCAG AA) */}
              <div
                style={{
                  backgroundColor: 'var(--catalog-surface-card, #F4ECEE)',
                  border: '1px solid var(--catalog-border-subtle, rgba(36, 7, 14, 0.08))',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                {hasSavedData && !isEditingData ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--catalog-accent, #8C1D32)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Datos de Entrega
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingData(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--catalog-accent, #8C1D32)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Editar
                      </button>
                    </div>
                    <p
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '0.88rem',
                        color: 'var(--catalog-ink, #24070E)',
                        fontWeight: 600,
                      }}
                    >
                      {customer.name} · {customer.phone}
                    </p>
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '0.82rem',
                        color: 'var(--catalog-ink-muted, #68454D)',
                      }}
                    >
                      {customer.address}, {customer.city}
                    </p>
                    {customer.notes && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: '0.78rem',
                          color: 'var(--catalog-accent, #8C1D32)',
                          fontStyle: 'italic',
                        }}
                      >
                        Nota: {customer.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--catalog-accent, #8C1D32)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Información de Envío
                      </span>
                      {hasSavedData && (
                        <button
                          type="button"
                          onClick={() => setIsEditingData(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--catalog-ink-muted, #68454D)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label htmlFor="cart-customer-name" style={labelStyle}>
                          Nombre completo *
                        </label>
                        <input
                          id="cart-customer-name"
                          type="text"
                          placeholder="Ej. Valentina Gómez"
                          value={customer.name}
                          onChange={(e) =>
                            setCustomer((prev) => ({ ...prev, name: e.target.value }))
                          }
                          autoComplete="name"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label htmlFor="cart-customer-phone" style={labelStyle}>
                            Celular / WhatsApp *
                          </label>
                          <input
                            id="cart-customer-phone"
                            type="tel"
                            placeholder="311 000 0000"
                            value={customer.phone}
                            onChange={(e) =>
                              setCustomer((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            autoComplete="tel"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label htmlFor="cart-customer-city" style={labelStyle}>
                            Ciudad *
                          </label>
                          <input
                            id="cart-customer-city"
                            type="text"
                            placeholder="Roldanillo"
                            value={customer.city}
                            onChange={(e) =>
                              setCustomer((prev) => ({ ...prev, city: e.target.value }))
                            }
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="cart-customer-address" style={labelStyle}>
                          Dirección y barrio *
                        </label>
                        <input
                          id="cart-customer-address"
                          type="text"
                          placeholder="Calle, número y barrio"
                          value={customer.address}
                          onChange={(e) =>
                            setCustomer((prev) => ({ ...prev, address: e.target.value }))
                          }
                          autoComplete="street-address"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label htmlFor="cart-customer-notes" style={labelStyle}>
                          Notas de entrega (opcional)
                        </label>
                        <input
                          id="cart-customer-notes"
                          type="text"
                          placeholder="Indicaciones adicionales"
                          value={customer.notes || ''}
                          onChange={(e) =>
                            setCustomer((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          style={inputStyle}
                        />
                      </div>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          color: 'var(--catalog-ink-muted, #68454D)',
                          marginTop: '4px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={(e) => setRememberDevice(e.target.checked)}
                          style={{ accentColor: 'var(--catalog-accent, #8C1D32)' }}
                        />
                        Recordar mis datos para futuros pedidos
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Drawer */}
        {!completedOrder && cart.length > 0 && (
          <div
            style={{
              padding: '18px 20px',
              borderTop: '1px solid var(--catalog-border, rgba(140, 29, 50, 0.16))',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  color: 'var(--catalog-ink-muted, #68454D)',
                  fontWeight: 500,
                }}
              >
                Total estimado
              </span>
              <span
                style={{
                  color: 'var(--catalog-accent, #8C1D32)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {formattedTotal}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleConfirmOrder()}
              disabled={isSubmitting}
              className="catalog-spotlight-cta"
              style={{ padding: '13px 20px', fontSize: '0.82rem' }}
            >
              {isSubmitting ? 'Procesando pedido...' : 'Confirmar pedido por WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
