import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface FeaturedCarouselProps {
  products: ProductWithRelations[];
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart?: (product: ProductWithRelations, tone: Tone | null) => void;
}

export default function FeaturedCarousel({
  products,
  onProductClick,
  onAddToCart = () => {},
}: FeaturedCarouselProps) {
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const handleAdd = (e: MouseEvent, product: ProductWithRelations, defaultTone: Tone | null) => {
    e.stopPropagation();
    onAddToCart(product, defaultTone);
    setAddedProductId(product.id);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setAddedProductId(null);
    }, 1200);
  };

  // Filtrar productos destacados o nuevos
  const featured = products.filter(p => p.isFeatured || p.isNew);

  if (featured.length === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    }).format(price);
  };

  return (
    <section style={{
      padding: '60px 0 60px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      <div style={{
        paddingRight: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: '300',
          color: 'var(--color-white)',
        }}>
          Colección <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Destacada</span>
        </h2>
        <span style={{
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '1px',
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
          paddingBottom: '20px',
        }} 
        className="no-scrollbar"
      >
        {featured.map((product, index) => {
          const defaultTone = product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null;
          const cardImage = getProductImage(product, defaultTone);

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
                transition: 'transform 0.3s ease, border-color 0.3s ease',
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
                background: '#180f12',
              }}>
                <img 
                  src={cardImage} 
                  alt={product.name} 
                  width="280"
                  height="280"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding={index === 0 ? "sync" : "async"}
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
                    textTransform: 'uppercase',
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
                textOverflow: 'ellipsis',
              }}>
                {product.name}
              </h3>

              <p style={{
                color: 'var(--color-gold)',
                fontWeight: '700',
                fontSize: '1.15rem',
                marginBottom: '16px',
              }}>
                {formatPrice(product.price)}
              </p>

              {(() => {
                const isJustAdded = addedProductId === product.id;
                return (
                  <button
                    onClick={(e) => handleAdd(e, product, defaultTone)}
                    className={isJustAdded ? 'btn-added-state' : ''}
                    aria-label={isJustAdded ? `¡${product.name} agregado al pedido!` : `Agregar ${product.name} al pedido`}
                    style={{
                      marginTop: 'auto',
                      backgroundColor: isJustAdded ? 'var(--color-burgundy-light)' : 'var(--color-burgundy)',
                      color: isJustAdded ? 'var(--color-gold)' : 'var(--color-white)',
                      border: isJustAdded ? '1px solid var(--color-gold)' : '1px solid rgba(215, 176, 106, 0.25)',
                      padding: '10px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.25s ease',
                      boxShadow: isJustAdded ? 'var(--shadow-gold)' : 'none',
                    }}
                  >
                    {isJustAdded ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>¡Agregado!</span>
                      </>
                    ) : (
                      'Agregar al pedido'
                    )}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </section>
  );
}
