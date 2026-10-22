import { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from '../../config';

export interface CartToastItem {
  id: number;
  productName: string;
  toneName?: string;
  price: number;
  image: string;
}

export interface CartToastProps {
  notification: CartToastItem | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export default function CartToast({
  notification,
  onClose,
  onOpenCart,
}: CartToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Formateador de moneda
  const formattedPrice = notification
    ? new Intl.NumberFormat(CONFIG.currency.locale, {
        style: 'currency',
        currency: CONFIG.currency.code,
        maximumFractionDigits: CONFIG.currency.precision,
      }).format(notification.price)
    : '';

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (!notification) return;

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      triggerClose();
    }, 3800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, isPaused, triggerClose]);

  if (!notification) return null;

  return (
    <div className="cart-toast-container" role="status" aria-live="polite">
      <div
        className={`cart-toast ${isClosing ? 'is-closing' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '430px',
        }}
      >
        {/* Imagen Miniatura */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(215, 176, 106, 0.3)',
            backgroundColor: '#180f12',
          }}
        >
          <img
            src={notification.image}
            alt={notification.productName}
            width="46"
            height="46"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Textos Informativos */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-gold)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>¡Agregado al pedido!</span>
          </div>
          <h4
            style={{
              color: 'var(--color-white)',
              fontSize: '0.88rem',
              fontWeight: 500,
              margin: '1px 0 2px 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notification.productName}
          </h4>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.76rem',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notification.toneName ? (
              <>
                Tono: <span style={{ color: 'var(--color-text-light)' }}>{notification.toneName}</span> •{' '}
              </>
            ) : null}
            <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{formattedPrice}</span>
          </p>
        </div>

        {/* Botón Acción Ver Carrito */}
        <button
          onClick={onOpenCart}
          style={{
            backgroundColor: 'var(--color-burgundy)',
            color: 'var(--color-white)',
            border: '1px solid var(--color-gold)',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.4px',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: 'var(--shadow-gold)',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Ver carrito de compras"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>Ver carrito</span>
        </button>

        {/* Botón Cerrar */}
        <button
          onClick={triggerClose}
          aria-label="Cerrar notificación"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-white)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Barra de progreso inferior */}
        <div className={`cart-toast-progress ${isPaused ? 'is-paused' : ''}`} />
      </div>
    </div>
  );
}
