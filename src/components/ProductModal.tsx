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

export default function ProductModal({
  product,
  initialTone,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const modalOverlay = useRef<HTMLDivElement>(null);
  const modalContent = useRef<HTMLDivElement>(null);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    initialTone || (product?.tones && product.tones.length > 0 ? product.tones[0] ?? null : null)
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useGSAP(
    () => {
      if (!modalOverlay.current || !modalContent.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const isMobile = !window.matchMedia('(min-width: 768px)').matches;
        const tl = gsap.timeline();

        tl.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });

        if (isMobile) {
          tl.fromTo(
            modalContent.current,
            { y: '100%' },
            { y: '0%', duration: 0.45, ease: 'power3.out' },
            '-=0.15'
          );
        } else {
          tl.fromTo(
            modalContent.current,
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' },
            '-=0.15'
          );
        }
      });
    },
    { scope: modalOverlay }
  );

  const handleClose = () => {
    if (!modalOverlay.current || !modalContent.current) {
      onClose();
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onClose();
      return;
    }
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    if (isMobile) {
      gsap.to(modalContent.current, { y: '100%', duration: 0.26, ease: 'power3.in' });
    } else {
      gsap.to(modalContent.current, { scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
    gsap.to(modalOverlay.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  };

  if (!product) return null;

  const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision,
  }).format(product.price);

  const hasTones = Boolean(product.tones && product.tones.length > 0);
  const isToneAvailable = selectedTone ? Boolean(selectedTone.inStock) && selectedTone.stock > 0 : true;
  const isAvailable = Boolean(product.inStock) && (hasTones ? isToneAvailable : product.stock > 0);
  const currentStock = selectedTone ? selectedTone.stock : product.stock;
  const isLowStock = isAvailable && currentStock > 0 && currentStock <= 3;

  return (
    <div
      ref={modalOverlay}
      onClick={handleClose}
      className="bottom-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
    >
      <div
        ref={modalContent}
        onClick={(e) => e.stopPropagation()}
        className="bottom-sheet-content"
      >
        {/* Cabecera de la ficha estilo AMUSE Mobile en Chiaroscuro */}
        <div
          style={{
            padding: '12px 18px 8px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--catalog-border-subtle, rgba(215, 176, 106, 0.14))',
            flexShrink: 0,
          }}
        >
          <span className="catalog-pill-tag">{product.category}</span>

          <div
            onClick={handleClose}
            style={{
              width: '36px',
              height: '4px',
              backgroundColor: 'rgba(215, 176, 106, 0.3)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar detalles del producto"
            style={{
              backgroundColor: 'var(--catalog-surface-card, #160A0D)',
              border: '1px solid var(--catalog-border, rgba(215, 176, 106, 0.26))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--catalog-accent, #D7B06A)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            padding: '16px 18px 24px 18px',
            gap: '16px',
          }}
          className="no-scrollbar"
        >
          {/* Título Editorial Centrado estilo AMUSE Bebe Tint */}
          <div style={{ textAlign: 'center' }}>
            <h2
              id="studio-modal-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.75rem, 6vw, 2.35rem)',
                fontWeight: 500,
                color: 'var(--catalog-ink, #FCF9F9)',
                lineHeight: 1.12,
                paddingBottom: '4px',
                margin: 0,
              }}
            >
              {product.name}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {/* Galería Cuadrada de Estudio Iluminada */}
            <div>
              <ProductGallery
                images={product.productImages || []}
                fallbackImage={product.mainImage}
                selectedToneImage={selectedTone?.image}
                productName={product.name}
              />
            </div>

            {/* Información, Swatches AMUSE y Compra */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <p
                  style={{
                    color: 'var(--catalog-accent, #D7B06A)',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {formattedPrice}
                </p>
                {isLowStock && (
                  <span className="studio-product-card__badge">
                    Últimas {currentStock} unidades
                  </span>
                )}
              </div>

              <p
                style={{
                  color: 'var(--catalog-ink-muted, #C9B1B6)',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {product.description}
              </p>

              {/* Selector de Tonos estilo AMUSE */}
              {hasTones && product.tones && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--catalog-surface-card, #160A0D)',
                    border: '1px solid var(--catalog-border-subtle, rgba(215, 176, 106, 0.14))',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.74rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--catalog-ink-muted, #C9B1B6)',
                      margin: '0 0 8px 0',
                      fontWeight: 600,
                    }}
                  >
                    Color:{' '}
                    <span style={{ color: 'var(--catalog-accent, #D7B06A)', fontWeight: 700 }}>
                      {selectedTone?.name}
                    </span>
                  </p>

                  <div className="amuse-swatch-list" style={{ gap: '10px' }}>
                    {product.tones.map((tone) => {
                      const isSelected = selectedTone?.id === tone.id;
                      const toneReady = Boolean(tone.inStock) && tone.stock > 0;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          title={`${tone.name}${!toneReady ? ' (Agotado)' : ''}`}
                          aria-label={`Seleccionar tono ${tone.name}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedTone(tone)}
                          className={`amuse-swatch-btn ${isSelected ? 'is-active' : ''} ${!toneReady ? 'is-out' : ''}`}
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: tone.hex,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA Principal en una línea */}
              <button
                type="button"
                disabled={!isAvailable || isJustAdded}
                onClick={() => {
                  if (!product || !isAvailable || isJustAdded) return;
                  onAddToCart(product, selectedTone);
                  setIsJustAdded(true);
                  closeTimerRef.current = setTimeout(() => {
                    handleClose();
                  }, 450);
                }}
                aria-label={
                  isJustAdded
                    ? 'Producto agregado al pedido'
                    : isAvailable
                      ? 'Agregar al pedido'
                      : 'Agotado'
                }
                className="catalog-spotlight-cta"
                style={{ padding: '13px 20px', fontSize: '0.8rem', marginTop: '4px' }}
              >
                {isAvailable
                  ? isJustAdded
                    ? 'Agregado al pedido'
                    : 'Agregar al pedido'
                  : 'Agotado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
