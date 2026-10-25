import { useState, useEffect, useRef, useCallback } from 'react';
import { formatCop } from '../../utils/currency';

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

  const formattedPrice = notification ? formatCop(notification.price) : '';

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
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid var(--catalog-border, rgba(215, 176, 106, 0.28))',
            backgroundColor: '#FBF4F5',
          }}
        >
          <img
            src={notification.image}
            alt={notification.productName}
            width="46"
            height="46"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--catalog-accent, #D7B06A)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Agregado a tu bolsa</span>
          </div>
          <h4
            style={{
              color: 'var(--catalog-ink, #FCF9F9)',
              fontSize: '0.86rem',
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
              color: 'var(--catalog-ink-muted, #C9B1B6)',
              fontSize: '0.75rem',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notification.toneName ? (
              <>
                Tono: <span style={{ color: 'var(--catalog-ink, #FCF9F9)', fontWeight: 500 }}>{notification.toneName}</span> -{' '}
              </>
            ) : null}
            <span style={{ color: 'var(--catalog-accent, #D7B06A)', fontWeight: 700 }}>{formattedPrice}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          style={{
            backgroundColor: 'var(--catalog-cta-bg, #6E1B2B)',
            color: 'var(--catalog-ink, #FCF9F9)',
            border: '1px solid var(--catalog-accent, #D7B06A)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 14px',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          aria-label="Ver bolsa de compras"
        >
          Ver bolsa
        </button>

        <button
          type="button"
          onClick={triggerClose}
          aria-label="Cerrar notificación"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--catalog-ink-muted, #C9B1B6)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={`cart-toast-progress ${isPaused ? 'is-paused' : ''}`} />
      </div>
    </div>
  );
}
