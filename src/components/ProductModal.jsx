import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';

export default function ProductModal({ product, initialTone, onClose, onAddToCart }) {
  const modalOverlay = useRef();
  const modalContent = useRef();
  const [selectedTone, setSelectedTone] = useState(initialTone || (product.tones && product.tones.length > 0 ? product.tones[0] : null));

  useGSAP(() => {
    // Animación de entrada: overlay se desvanece y la caja del modal hace zoom-in elástico
    gsap.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    gsap.fromTo(modalContent.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.3)' });
  }, { scope: modalOverlay });

  const handleClose = () => {
    gsap.to(modalContent.current, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.in' });
    gsap.to(modalOverlay.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  };

  if (!product) return null;

  const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision
  }).format(product.price);

  return (
    <div 
      ref={modalOverlay}
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(90, 22, 35, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}
    >
      <div 
        ref={modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-premium)',
          width: '100%',
          maxWidth: '650px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(90, 22, 35, 0.15)',
          border: 'var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Diseño responsivo de 2 columnas (móvil 1 columna) */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }} className="no-scrollbar">
          {/* Imagen de Detalle */}
          <div style={{ position: 'relative', width: '100%', height: '350px', backgroundColor: '#f0f0f0' }}>
            <img 
              src={selectedTone?.image || product.mainImage} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button 
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-burgundy)',
                fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✕
            </button>
          </div>
          
          {/* Contenido de Detalle */}
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: '400', color: 'var(--color-text-dark)', marginBottom: '6px' }}>
                {product.name}
              </h2>
              <p style={{ color: 'var(--color-burgundy)', fontSize: '1.5rem', fontWeight: '700' }}>
                {formattedPrice}
              </p>
            </div>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {product.description}
            </p>

            {/* Tonos */}
            {product.tones && product.tones.length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '0.85rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: 'var(--color-text-dark)', 
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  Selecciona Tono: <span style={{ color: 'var(--color-burgundy)', fontWeight: 'bold' }}>{selectedTone?.name}</span>
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {product.tones.map((tone) => {
                    const isSelected = selectedTone?.id === tone.id;
                    return (
                      <button
                        key={tone.id}
                        title={tone.name}
                        onClick={() => setSelectedTone(tone)}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: tone.hex,
                          border: isSelected ? '2px solid var(--color-burgundy)' : '1px solid rgba(0,0,0,0.12)',
                          outline: isSelected ? '2px solid var(--color-gold)' : 'none',
                          cursor: tone.inStock ? 'pointer' : 'not-allowed',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          opacity: tone.inStock ? 1 : 0.35
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón Añadir */}
            <button
              className="btn-shine-effect"
              disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
              onClick={() => {
                onAddToCart(product, selectedTone);
                handleClose();
              }}
              style={{
                width: '100%',
                backgroundColor: product.inStock ? 'var(--color-burgundy)' : '#e5e0e0',
                color: product.inStock ? 'var(--color-white)' : '#a59b9c',
                border: 'none',
                padding: '14px 0',
                borderRadius: '12px',
                cursor: product.inStock ? 'pointer' : 'default',
                fontWeight: '600',
                fontSize: '1rem',
                letterSpacing: '1px',
                boxShadow: product.inStock ? 'var(--shadow-premium)' : 'none',
                marginTop: '10px'
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
              {product.inStock ? 'Añadir al pedido 💄' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
