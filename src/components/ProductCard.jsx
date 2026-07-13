import React, { useState } from 'react';
import { CONFIG } from '../config';

export default function ProductCard({ product, onProductClick, onAddToCart }) {
  const [selectedTone, setSelectedTone] = useState(product.tones && product.tones.length > 0 ? product.tones[0] : null);

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

  return (
    <div 
      onClick={() => onProductClick(product, selectedTone)}
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-premium)',
        boxShadow: 'var(--shadow-premium)',
        border: 'var(--border-glass)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
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
            transition: 'transform 0.5s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {product.isNew && (
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-burgundy)',
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            letterSpacing: '0.5px'
          }}>
            Nuevo
          </span>
        )}
      </div>

      {/* Información del Producto */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '500', 
          marginBottom: '6px',
          textOverflow: 'ellipsis', 
          overflow: 'hidden', 
          whiteSpace: 'nowrap',
          color: 'var(--color-text-dark)'
        }}>
          {product.name}
        </h3>
        
        <p style={{ 
          color: 'var(--color-burgundy)', 
          fontWeight: '700', 
          fontSize: '1.3rem', 
          marginBottom: '16px' 
        }}>
          {formattedPrice}
        </p>

        {/* Selector de Tonos */}
        {product.tones && product.tones.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '8px', 
            marginBottom: '20px' 
          }} onClick={(e) => e.stopPropagation()}>
            {product.tones.map((tone) => {
              const isSelected = selectedTone?.id === tone.id;
              return (
                <button
                  key={tone.id}
                  title={tone.name}
                  onClick={() => setSelectedTone(tone)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: tone.hex,
                    border: isSelected ? '2px solid var(--color-burgundy)' : '1px solid rgba(0,0,0,0.12)',
                    outline: isSelected ? '2px solid var(--color-gold)' : 'none',
                    cursor: tone.inStock ? 'pointer' : 'not-allowed',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    opacity: tone.inStock ? 1 : 0.35
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Botón de Agregar */}
        <button 
          className="btn-shine-effect"
          onClick={handleAdd}
          disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
          style={{
            marginTop: 'auto',
            width: '100%',
            backgroundColor: product.inStock ? 'var(--color-burgundy)' : '#e5e0e0',
            color: product.inStock ? 'var(--color-white)' : '#a59b9c',
            border: 'none',
            padding: '12px 0',
            borderRadius: '10px',
            cursor: product.inStock ? 'pointer' : 'default',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            boxShadow: product.inStock ? 'var(--shadow-premium)' : 'none'
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
