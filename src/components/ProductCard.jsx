import React, { useState, useRef, useEffect } from 'react';
import { CONFIG } from '../config';
import gsap from 'gsap';

export default function ProductCard({ product, onProductClick, onAddToCart }) {
  const [selectedTone, setSelectedTone] = useState(product.tones && product.tones.length > 0 ? product.tones[0] : null);
  const buttonRef = useRef();

  const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision
  }).format(product.price);

  const currentImage = selectedTone?.image || product.mainImage;

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product, selectedTone);
  };

  // Efecto Magnético para el botón - solo en dispositivos con puntero (no táctil)
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    // Comprobar si el dispositivo soporta hover (desktop)
    const isHoverSupported = window.matchMedia('(hover: hover)').matches;
    if (!isHoverSupported) return;

    const onMouseMove = (e) => {
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
          ease: 'power2.out'
        });
      } else {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1.1, 0.4)'
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    btn.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (btn) btn.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [product]);

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
        height: '100%'
      }}
      className="satin-shimmer-container"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'var(--color-gold)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
      }}
    >
      {/* Imagen del Producto */}
      <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
        <img 
          src={currentImage} 
          alt={product.name} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {product.isNew && (
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-burgundy)',
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            letterSpacing: '0.5px'
          }}>
            Nuevo
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ 
          fontSize: '1.05rem', 
          fontWeight: '400', 
          marginBottom: '6px',
          textOverflow: 'ellipsis', 
          overflow: 'hidden', 
          whiteSpace: 'nowrap',
          color: 'var(--color-text-light)'
        }}>
          {product.name}
        </h3>
        
        <p style={{ 
          color: 'var(--color-gold)', 
          fontWeight: '700', 
          fontSize: '1.15rem', 
          marginBottom: '14px' 
        }}>
          {formattedPrice}
        </p>

        {/* Tonos */}
        {product.tones && product.tones.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '8px', 
            marginBottom: '16px' 
          }} onClick={(e) => e.stopPropagation()}>
            {product.tones.map((tone) => {
              const isSelected = selectedTone?.id === tone.id;
              return (
                <button
                  key={tone.id}
                  title={tone.name}
                  onClick={() => setSelectedTone(tone)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: tone.hex,
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
                    cursor: tone.inStock ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    opacity: tone.inStock ? 1 : 0.3
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Botón de Agregar */}
        <button 
          ref={buttonRef}
          onClick={handleAdd}
          disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
          style={{
            marginTop: 'auto',
            width: '100%',
            backgroundColor: product.inStock ? 'var(--color-burgundy)' : 'rgba(255, 255, 255, 0.05)',
            color: product.inStock ? 'var(--color-white)' : 'var(--color-text-muted)',
            border: product.inStock ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.05)',
            padding: '11px 0',
            borderRadius: '8px',
            cursor: product.inStock ? 'pointer' : 'default',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            if (product.inStock) {
              e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (product.inStock) {
              e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
            }
          }}
        >
          {product.inStock ? 'Agregar al pedido' : 'Agotado'}
        </button>
      </div>
    </div>
  );
}
