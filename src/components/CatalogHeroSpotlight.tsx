import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getProductImage } from '../utils/image-helpers';
import { formatCop } from '../utils/currency';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface CatalogHeroSpotlightProps {
  products: ProductWithRelations[];
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
}

const SPOTLIGHT_INTERVAL_MS = 4800;

export default function CatalogHeroSpotlight({
  products,
  onProductClick,
  onAddToCart,
}: CatalogHeroSpotlightProps) {
  const spotlightPool = products.filter((p) => p.isFeatured || p.isNew);
  const items = spotlightPool.length > 0 ? spotlightPool.slice(0, 5) : products.slice(0, 4);

  const [activeIndex, setActiveIndex] = useState(0);
  const [toneOverrides, setToneOverrides] = useState<Record<string, Tone>>({});
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const activeProduct = items[activeIndex] ?? items[0] ?? null;

  const selectedTone: Tone | null = activeProduct
    ? toneOverrides[activeProduct.id] ??
      (activeProduct.tones && activeProduct.tones.length > 0
        ? activeProduct.tones[0] ?? null
        : null)
    : null;

  const handleSelectProductIndex = (idx: number) => {
    setActiveIndex(idx);
    setIsJustAdded(false);
  };

  const handleSelectTone = (tone: Tone) => {
    if (!activeProduct) return;
    setToneOverrides((prev) => ({
      ...prev,
      [activeProduct.id]: tone,
    }));
  };

  // Rotación automática cada 4.8s cuando hay múltiples productos destacados y no está en pausa
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
      setIsJustAdded(false);
    }, SPOTLIGHT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [items.length, isPaused, activeIndex]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  // Coreografía suave de entrada al cambiar de producto destacado
  useGSAP(
    () => {
      if (!cardRef.current || !activeProduct) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.catalog-spotlight__img',
          { opacity: 0, scale: 0.92, y: 8 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out' }
        );
        gsap.fromTo(
          '.catalog-spotlight__anim-item',
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            duration: 0.42,
            ease: 'power2.out',
          }
        );
      });
    },
    { dependencies: [activeProduct?.id], scope: cardRef }
  );

  if (!activeProduct) {
    return null;
  }

  const formattedPrice = formatCop(activeProduct.price);

  const currentImage = getProductImage(activeProduct, selectedTone);
  const hasTones = Boolean(activeProduct.tones && activeProduct.tones.length > 0);
  const isToneAvailable = selectedTone ? Boolean(selectedTone.inStock) && selectedTone.stock > 0 : true;
  const isAvailable = Boolean(activeProduct.inStock) && (hasTones ? isToneAvailable : activeProduct.stock > 0);

  const handleDirectAdd = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    onAddToCart(activeProduct, selectedTone);
    setIsJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setIsJustAdded(false);
    }, 1200);
  };

  const handleTouchStart = (e: TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || items.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        setActiveIndex((prev) => (prev + 1) % items.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
      setIsJustAdded(false);
    }
  };

  return (
    <section className="catalog-shell" aria-label="Vitrina destacada del catálogo">
      <div className="catalog-hero-frame">
        {/* Columna Izquierda / Cabecera en Móvil: Fotografía de Campaña Glossier */}
        <div className="catalog-hero__editorial-media">
          <img
            src="/images/studio-hero-blush.webp"
            alt="Retrato editorial de maquillaje Bella Forever"
            width="760"
            height="768"
            fetchPriority="high"
            decoding="async"
            className="catalog-hero__editorial-img"
          />
          <div className="catalog-hero__media-overlay">
            <span className="catalog-hero__brand-mark">Bella Forever.</span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                color: 'rgba(251, 244, 245, 0.92)',
                maxWidth: '30ch',
                lineHeight: 1.35,
              }}
            >
              Fórmulas luminosas pensadas para realzar tu piel todos los días.
            </span>
          </div>
        </div>

        {/* Columna Derecha / Vitrina Interactiva AMUSE con Rotación Automática */}
        <div
          className="catalog-hero__spotlight-pane"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div className="catalog-hero__top-nav">
            <span className="catalog-pill-tag">Favorito de Estudio</span>
            {items.length > 1 && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                role="tablist"
                aria-label="Productos destacados"
              >
                {items.map((item, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={`Ver destacado ${item.name}`}
                      onClick={() => handleSelectProductIndex(idx)}
                      className="spotlight-tab-pill"
                      style={{
                        width: isCurrent ? '32px' : '8px',
                      }}
                    >
                      {isCurrent && (
                        <span
                          key={`${activeProduct.id}-${activeIndex}`}
                          className={`spotlight-tab-pill__fill ${isPaused ? 'is-paused' : ''}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarjeta Spotlight interactiva estilo AMUSE Bebe Tint en Terciopelo + Luz Alabastro */}
          <div ref={cardRef} className="catalog-spotlight-card">
            <div
              className="catalog-spotlight__media-wrap"
              onClick={() => onProductClick(activeProduct, selectedTone)}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalles de ${activeProduct.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onProductClick(activeProduct, selectedTone);
                }
              }}
            >
              <div
                className="catalog-spotlight__swatch-aura"
                style={{
                  backgroundColor: selectedTone?.hex || '#D88391',
                }}
              />
              <img
                key={currentImage}
                src={currentImage}
                alt={`${activeProduct.name}${selectedTone?.name ? ` en tono ${selectedTone.name}` : ''}`}
                width="240"
                height="240"
                fetchPriority="high"
                decoding="async"
                className="catalog-spotlight__img"
              />
            </div>

            <div className="catalog-spotlight__info">
              <div className="catalog-spotlight__price-row catalog-spotlight__anim-item">
                <h1
                  className="catalog-spotlight__title"
                  onClick={() => onProductClick(activeProduct, selectedTone)}
                >
                  {activeProduct.name}
                </h1>
                <p className="catalog-spotlight__price">{formattedPrice}</p>
              </div>

              <p className="catalog-spotlight__desc catalog-spotlight__anim-item">
                {activeProduct.description}
              </p>

              {hasTones && activeProduct.tones && (
                <div className="catalog-spotlight__anim-item">
                  <p
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'var(--catalog-ink-muted)',
                      margin: '0 0 6px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Tono: <span style={{ color: 'var(--catalog-accent)' }}>{selectedTone?.name}</span>
                  </p>
                  <div className="amuse-swatch-list">
                    {activeProduct.tones.map((tone) => {
                      const isSelected = selectedTone?.id === tone.id;
                      const toneReady = Boolean(tone.inStock) && tone.stock > 0;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          title={`${tone.name}${!toneReady ? ' (Agotado)' : ''}`}
                          aria-label={`Seleccionar tono ${tone.name}`}
                          aria-pressed={isSelected}
                          onClick={() => handleSelectTone(tone)}
                          className={`amuse-swatch-btn ${isSelected ? 'is-active' : ''} ${!toneReady ? 'is-out' : ''}`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                className="catalog-spotlight__anim-item"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
              >
                <button
                  type="button"
                  onClick={handleDirectAdd}
                  disabled={!isAvailable}
                  className="catalog-spotlight-cta"
                >
                  {isAvailable ? (isJustAdded ? 'Agregado al pedido' : 'Agregar al pedido') : 'Agotado'}
                </button>
              </div>
            </div>
          </div>

          {/* Firma tipográfica inferior derecha estilo Glossier */}
          <div className="catalog-hero__footer">
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                color: 'rgba(251, 244, 245, 0.84)',
                lineHeight: 1.35,
                maxWidth: '28ch',
              }}
            >
              Selecciona tus tonos y coordina tu entrega directa en Roldanillo.
            </span>
            <p className="catalog-hero__giant-sig" aria-hidden="true">
              Bella.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
