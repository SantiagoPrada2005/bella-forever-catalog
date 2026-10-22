import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';
import ProductGallery from './ProductGallery';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface ProductModalProps {
  product: ProductWithRelations | null;
  initialTone?: Tone | null;
  onClose: () => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
}

export default function ProductModal({ product, initialTone, onClose, onAddToCart }: ProductModalProps) {
  const modalOverlay = useRef<HTMLDivElement>(null);
  const modalContent = useRef<HTMLDivElement>(null);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    initialTone || (product?.tones && product.tones.length > 0 ? product.tones[0] ?? null : null)
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bloquear el scroll del body al abrir y desbloquear al cerrar
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useGSAP(() => {
    if (!modalOverlay.current || !modalContent.current) return;
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    
    const tl = gsap.timeline();
    
    tl.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    
    if (isMobile) {
      tl.fromTo(modalContent.current, { y: '100%' }, { y: '0%', duration: 0.5, ease: 'power4.out' }, '-=0.2');
    } else {
      tl.fromTo(modalContent.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.1)' }, '-=0.2');
    }

    // Staggered entry for inner details
    tl.fromTo('.modal-anim-item', 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' },
      '-=0.25'
    );
  }, { scope: modalOverlay });

  const handleClose = () => {
    if (!modalOverlay.current || !modalContent.current) {
      onClose();
      return;
    }
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
    maximumFractionDigits: CONFIG.currency.precision,
  }).format(product.price);

  const hasTones = Boolean(product.tones && product.tones.length > 0);
  const isToneAvailable = selectedTone ? (Boolean(selectedTone.inStock) && selectedTone.stock > 0) : true;
  const isAvailable = Boolean(product.inStock) && (hasTones ? isToneAvailable : product.stock > 0);
  const currentStock = selectedTone ? selectedTone.stock : product.stock;
  const isLowStock = isAvailable && currentStock > 0 && currentStock <= 3;

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
          flexShrink: 0,
        }} onClick={handleClose}>
          <div style={{
            width: '36px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
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

            {/* Imagen ProductGallery */}
            <div className="modal-img-container" style={{ position: 'relative', width: '100%', backgroundColor: '#1a0f12', flexShrink: 0 }}>
              <ProductGallery
                images={product.productImages || []}
                fallbackImage={product.mainImage}
                selectedToneImage={selectedTone?.image}
                productName={product.name}
              />
              <button 
                onClick={handleClose}
                aria-label="Cerrar detalles del producto"
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
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                ✕
              </button>
            </div>
            
            {/* Contenido */}
            <div className="modal-text-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modal-anim-item">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '400', color: 'var(--color-white)', marginBottom: '4px' }}>
                  {product.name}
                </h2>
                <p style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: '700' }}>
                  {formattedPrice}
                </p>
              </div>
              
              <p className="modal-anim-item" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {product.description}
              </p>

              {/* Tonos */}
              {product.tones && product.tones.length > 0 && (
                <div className="modal-anim-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px',
                      color: 'var(--color-text-light)', 
                      margin: 0,
                      fontWeight: '600',
                    }}>
                      Tono: <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{selectedTone?.name}</span>
                    </h4>
                    {isLowStock && (
                      <span style={{
                        fontSize: '0.72rem',
                        color: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontWeight: '600',
                      }}>
                        ¡Quedan {currentStock}!
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: tone.hex,
                            border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
                            cursor: toneReady ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            opacity: toneReady ? 1 : 0.3,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón */}
              <button
                className={`modal-anim-item ${isJustAdded ? 'btn-added-state' : ''}`}
                disabled={!isAvailable || isJustAdded}
                onClick={() => {
                  if (!product || !isAvailable || isJustAdded) return;
                  onAddToCart(product, selectedTone);
                  setIsJustAdded(true);
                  closeTimerRef.current = setTimeout(() => {
                    handleClose();
                  }, 450);
                }}
                aria-label={isJustAdded ? '¡Producto añadido al pedido!' : (isAvailable ? 'Añadir al pedido' : 'Agotado')}
                style={{
                  width: '100%',
                  backgroundColor: isJustAdded
                    ? 'var(--color-burgundy-light)'
                    : isAvailable
                      ? 'var(--color-burgundy)'
                      : 'rgba(255,255,255,0.05)',
                  color: isJustAdded
                    ? 'var(--color-gold)'
                    : isAvailable
                      ? 'var(--color-white)'
                      : 'var(--color-text-muted)',
                  border: isJustAdded
                    ? '1px solid var(--color-gold)'
                    : isAvailable
                      ? '1px solid var(--color-gold)'
                      : '1px solid rgba(255,255,255,0.05)',
                  padding: '13px 20px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: isAvailable && !isJustAdded ? 'pointer' : 'default',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  boxShadow: isJustAdded || isAvailable ? 'var(--shadow-gold)' : 'none',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease',
                }}
              >
                {isAvailable ? (
                  isJustAdded ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Agregado al pedido
                    </span>
                  ) : (
                    'Añadir al pedido'
                  )
                ) : (
                  'Agotado'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
