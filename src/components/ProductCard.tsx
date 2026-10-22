import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { CONFIG } from '../config';
import gsap from 'gsap';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface ProductCardProps {
  product: ProductWithRelations;
  priority?: boolean;
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
}

export default function ProductCard({ product, priority = false, onProductClick, onAddToCart }: ProductCardProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision,
  }).format(product.price);

  const currentImage = getProductImage(product, selectedTone);

  const handleAdd = (e: ReactMouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedTone);
    setIsJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setIsJustAdded(false);
    }, 1200);
  };

  // Efecto Magnético para el botón - solo en dispositivos con puntero (no táctil)
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    // Comprobar si el dispositivo soporta hover (desktop)
    const isHoverSupported = window.matchMedia('(hover: hover)').matches;
    if (!isHoverSupported) return;

    const onMouseMove = (e: MouseEvent) => {
      const bound = btn.getBoundingClientRect();
      const btnX = bound.left + bound.width / 2;
      const btnY = bound.top + bound.height / 2;
      const distX = e.clientX - btnX;
      const distY = e.clientY - btnY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < 70) {
        gsap.to(btn, {
          x: distX * 0.25,
          y: distY * 0.25,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1.1, 0.4)',
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    btn.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (btn) btn.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [product]);

  const hasTones = Boolean(product.tones && product.tones.length > 0);
  const isToneAvailable = selectedTone ? (Boolean(selectedTone.inStock) && selectedTone.stock > 0) : true;
  const isAvailable = Boolean(product.inStock) && (hasTones ? isToneAvailable : product.stock > 0);
  const currentStock = selectedTone ? selectedTone.stock : product.stock;
  const isLowStock = isAvailable && currentStock > 0 && currentStock <= 3;

  return (
    <div 
      onClick={() => onProductClick(product, selectedTone)}
      style={{
        backgroundColor: 'var(--color-panel-dark)',
        borderRadius: 'var(--radius-premium)',
        boxShadow: 'var(--shadow-premium)',
        border: 'var(--border-glass)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
      }}
      className="satin-shimmer-container product-card-cq"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'var(--color-gold)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.16)';
      }}
    >
      {/* Imagen del Producto */}
      <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
        <img 
          src={currentImage} 
          alt={`${product.name}${selectedTone?.name ? ` - Tono ${selectedTone.name}` : ''} | Bella Forever`}
          width="400"
          height="400"
          loading={priority ? 'eager' : 'lazy'}
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          decoding={priority ? 'sync' : 'async'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {product.isNew && (
          <span style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'var(--surface-editorial-alabaster)',
            color: 'var(--color-ink-burgundy)',
            fontSize: '0.62rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            letterSpacing: '0.12em',
          }}>
            Nuevo
          </span>
        )}
        {product.productImages && product.productImages.length > 1 && (
          <span style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
          }}>
            {product.productImages.slice(0, 5).map((_, i) => (
              <span key={i} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: i === 0 ? 'var(--color-gold)' : 'rgba(255,255,255,0.35)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }} />
            ))}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 className="product-card__title">
          {product.name}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ 
            color: 'var(--color-gold)', 
            fontWeight: '700', 
            fontSize: '1.1rem', 
            margin: 0,
          }}>
            {formattedPrice}
          </p>
          {isLowStock && (
            <span style={{
              fontSize: '0.68rem',
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '2px 7px',
              fontWeight: '600',
            }}>
              ¡Quedan {currentStock}!
            </span>
          )}
        </div>

        {/* Tonos */}
        {product.tones && product.tones.length > 0 && (
          <div style={{ marginBottom: '14px' }} onClick={(e) => e.stopPropagation()}>
            {selectedTone?.name && (
              <p style={{
                fontSize: '0.68rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Tono: <span style={{ color: 'var(--color-pastel-pink)', fontWeight: 600 }}>{selectedTone.name}</span>
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {product.tones.map((tone) => {
                const isSelected = selectedTone?.id === tone.id;
                const toneReady = Boolean(tone.inStock) && tone.stock > 0;
                return (
                  <button
                    key={tone.id}
                    title={`${tone.name}${!toneReady ? ' (Agotado)' : ''}`}
                    aria-label={`Seleccionar tono ${tone.name}`}
                    onClick={() => setSelectedTone(tone)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: tone.hex,
                      border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.22)',
                      cursor: toneReady ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.14)' : 'scale(1)',
                      opacity: toneReady ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Botón de Agregar */}
        <button 
          ref={buttonRef}
          onClick={handleAdd}
          disabled={!isAvailable}
          aria-label={isJustAdded ? '¡Producto agregado al pedido!' : (isAvailable ? `Agregar ${product.name} al pedido` : 'Producto agotado')}
          className={isJustAdded ? 'btn-added-state' : ''}
          style={{
            marginTop: 'auto',
            width: '100%',
            backgroundColor: isJustAdded 
              ? 'var(--color-burgundy-light)' 
              : isAvailable 
                ? 'var(--color-burgundy)' 
                : 'rgba(255, 255, 255, 0.05)',
            color: isJustAdded 
              ? 'var(--color-gold)' 
              : isAvailable 
                ? 'var(--color-white)' 
                : 'var(--color-text-muted)',
            border: isJustAdded 
              ? '1px solid var(--color-gold)' 
              : isAvailable 
                ? '1px solid rgba(215, 176, 106, 0.45)' 
                : '1px solid rgba(255,255,255,0.05)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-pill)',
            cursor: isAvailable ? 'pointer' : 'default',
            fontWeight: '700',
            fontSize: '0.76rem',
            transition: 'all 0.25s ease',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isJustAdded ? 'var(--shadow-gold)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (isAvailable && !isJustAdded) {
              e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (isAvailable && !isJustAdded) {
              e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
            }
          }}
        >
          {isAvailable ? (
            isJustAdded ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ¡Agregado!
              </span>
            ) : (
              'Agregar'
            )
          ) : (
            'Agotado'
          )}
        </button>
      </div>
    </div>
  );
}
