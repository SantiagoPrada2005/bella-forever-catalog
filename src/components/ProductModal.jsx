import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';

export default function ProductModal({ product, initialTone, onClose, onAddToCart }) {
  const modalOverlay = useRef();
  const modalContent = useRef();
  const [selectedTone, setSelectedTone] = useState(initialTone || (product.tones && product.tones.length > 0 ? product.tones[0] : null));

  useGSAP(() => {
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    
    gsap.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    
    if (isMobile) {
      // Slide up bottom sheet
      gsap.fromTo(modalContent.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
    } else {
      // Zoom-in modal
      gsap.fromTo(modalContent.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' });
    }
  }, { scope: modalOverlay });

  const handleClose = () => {
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    
    if (isMobile) {
      gsap.to(modalContent.current, { y: '100%', duration: 0.3, ease: 'power3.in' });
    } else {
      gsap.to(modalContent.current, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.in' });
    }
    gsap.to(modalOverlay.current, { opacity: 0, duration: 0.3, onComplete: onClose });
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
      className="bottom-sheet-overlay"
    >
      <div 
        ref={modalContent}
        onClick={(e) => e.stopPropagation()}
        className="bottom-sheet-content"
      >
        {/* Cabecera / Notch de arrastre en móvil */}
        <div style={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }} onClick={handleClose}>
          <div style={{
            width: '36px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '2px'
          }} className="mobile-notch"></div>
          <style>{`
            @media (min-width: 768px) {
              .mobile-notch {
                display: none !important;
              }
            }
          `}</style>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }} className="no-scrollbar">
          <div className="modal-inner-flex" style={{ display: 'flex', flexDirection: 'column' }}>
            <style>{`
              @media (min-width: 768px) {
                .modal-inner-flex {
                  flex-direction: row !important;
                }
                .modal-img-container {
                  width: 50% !important;
                  height: auto !important;
                  aspect-ratio: 1 !important;
                }
                .modal-text-container {
                  width: 50% !important;
                }
              }
            `}</style>

            {/* Imagen */}
            <div className="modal-img-container" style={{ position: 'relative', width: '100%', height: '280px', backgroundColor: '#1a0f12', flexShrink: 0 }}>
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
                  backgroundColor: 'rgba(18, 9, 11, 0.8)',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ✕
              </button>
            </div>
            
            {/* Contenido */}
            <div className="modal-text-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '400', color: 'var(--color-white)', marginBottom: '4px' }}>
                  {product.name}
                </h2>
                <p style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: '700' }}>
                  {formattedPrice}
                </p>
              </div>
              
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {product.description}
              </p>

              {/* Tonos */}
              {product.tones && product.tones.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: 'var(--color-text-light)', 
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    Tono: <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{selectedTone?.name}</span>
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {product.tones.map((tone) => {
                      const isSelected = selectedTone?.id === tone.id;
                      return (
                        <button
                          key={tone.id}
                          title={tone.name}
                          onClick={() => setSelectedTone(tone)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: tone.hex,
                            border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
                            cursor: tone.inStock ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            opacity: tone.inStock ? 1 : 0.3
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón */}
              <button
                disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
                onClick={() => {
                  onAddToCart(product, selectedTone);
                  handleClose();
                }}
                style={{
                  width: '100%',
                  backgroundColor: product.inStock ? 'var(--color-burgundy)' : 'rgba(255,255,255,0.05)',
                  color: product.inStock ? 'var(--color-white)' : 'var(--color-text-muted)',
                  border: product.inStock ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '12px 0',
                  borderRadius: '8px',
                  cursor: product.inStock ? 'pointer' : 'default',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  letterSpacing: '1px',
                  boxShadow: product.inStock ? 'var(--shadow-gold)' : 'none',
                  marginTop: '8px'
                }}
              >
                {product.inStock ? 'Añadir al pedido 💄' : 'Agotado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
