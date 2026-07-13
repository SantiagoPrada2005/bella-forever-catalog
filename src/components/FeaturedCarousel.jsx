import React from 'react';
import { CONFIG } from '../config';

export default function FeaturedCarousel({ products, onProductClick, onAddToCart }) {
  // Filtrar productos destacados o nuevos
  const featured = products.filter(p => p.isFeatured || p.isNew);

  if (featured.length === 0) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision
    }).format(price);
  };

  return (
    <section style={{
      padding: '60px 0 60px 24px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      <div style={{
        paddingRight: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: '300',
          color: 'var(--color-white)'
        }}>
          Colección <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Destacada</span>
        </h2>
        <span style={{
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '1px'
        }}>
          Desliza para explorar →
        </span>
      </div>

      {/* Carrusel táctil nativo en móvil */}
      <div 
        style={{
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          paddingRight: '24px',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: '20px'
        }} 
        className="no-scrollbar"
      >
        {featured.map((product) => {
          const defaultTone = product.tones && product.tones.length > 0 ? product.tones[0] : null;
          const cardImage = defaultTone?.image || product.mainImage;

          return (
            <div 
              key={product.id}
              onClick={() => onProductClick(product, defaultTone)}
              style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start',
                background: 'var(--color-panel-dark)',
                borderRadius: 'var(--radius-premium)',
                border: 'var(--border-glass)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-premium)',
                transition: 'transform 0.3s ease, border-color 0.3s ease'
              }}
              className="satin-shimmer-container"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
              }}
            >
              <div style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                background: '#180f12'
              }}>
                <img 
                  src={cardImage} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {product.isNew && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'var(--color-gold)',
                    color: 'var(--color-burgundy)',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase'
                  }}>
                    Nuevo
                  </span>
                )}
              </div>

              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '400',
                color: 'var(--color-text-light)',
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {product.name}
              </h3>

              <p style={{
                color: 'var(--color-gold)',
                fontWeight: '700',
                fontSize: '1.15rem',
                marginBottom: '16px'
              }}>
                {formatPrice(product.price)}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, defaultTone);
                }}
                style={{
                  marginTop: 'auto',
                  backgroundColor: 'var(--color-burgundy)',
                  color: 'var(--color-white)',
                  border: 'none',
                  padding: '10px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  letterSpacing: '0.5px'
                }}
              >
                Agregar al pedido
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
