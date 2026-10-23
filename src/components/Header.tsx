export interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
  isCatalog?: boolean;
  isCartBumping?: boolean;
}

export default function Header({
  cartCount = 0,
  onCartClick,
  isCatalog = false,
  isCartBumping = false,
}: HeaderProps) {
  if (isCatalog) {
    return (
      <header className="catalog-header-studio">
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <img
            src="/isotipo.png"
            alt="Bella Forever Isotipo"
            width="34"
            height="34"
            style={{ height: '34px', width: '34px', objectFit: 'contain' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.35rem',
              fontWeight: 600,
              color: 'var(--catalog-accent)',
              letterSpacing: '0.12em',
            }}
          >
            BELLA FOREVER
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/"
            style={{
              color: 'var(--catalog-ink-muted)',
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              fontWeight: 500,
              padding: '6px 10px',
            }}
          >
            Inicio
          </a>

          <button
            type="button"
            onClick={onCartClick}
            aria-label={
              cartCount > 0 ? `Ver pedido con ${cartCount} productos` : 'Ver bolsa de compras'
            }
            style={{
              backgroundColor:
                cartCount > 0 ? 'var(--catalog-cta-bg)' : 'var(--catalog-surface-card)',
              color: cartCount > 0 ? 'var(--catalog-ink)' : 'var(--catalog-accent)',
              border: '1px solid rgba(215, 176, 106, 0.48)',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              position: 'relative',
              padding: '7px 15px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.76rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              boxShadow: cartCount > 0 ? '0 4px 16px rgba(215, 176, 106, 0.16)' : 'none',
              transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
            }}
          >
            <svg
              className={isCartBumping ? 'cart-icon-bump' : ''}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className={isCartBumping ? 'cart-badge-pop' : ''}>
              Bolsa ({cartCount})
            </span>
            {isCartBumping && (
              <span className="sr-only" role="status" aria-live="polite">
                Producto agregado. {cartCount} {cartCount === 1 ? 'producto' : 'productos'} en la bolsa.
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '70px',
        backgroundColor: 'rgba(10, 4, 5, 0.82)',
        backdropFilter: 'blur(16px)',
        borderBottom: 'var(--border-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 1000,
      }}
    >
      <a
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        <img
          src="/isotipo.png"
          alt="Bella Forever Isotipo"
          width="36"
          height="36"
          style={{ height: '36px', width: '36px', objectFit: 'contain' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            fontWeight: '600',
            color: 'var(--color-gold)',
            letterSpacing: '2px',
          }}
        >
          BELLA FOREVER
        </span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <a
          href="/catalogo"
          aria-label="Ver Catálogo de Maquillaje Bella Forever"
          style={{
            color: 'var(--color-text-light)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(215, 176, 106, 0.35)',
            backgroundColor: 'rgba(90, 22, 35, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
            }}
          >
            Catálogo
          </span>
        </a>
      </div>
    </header>
  );
}
