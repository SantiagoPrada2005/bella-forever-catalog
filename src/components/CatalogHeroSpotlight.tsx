import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface CatalogHeroSpotlightProps {
  products: ProductWithRelations[];
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
}

export default function CatalogHeroSpotlight({
  products,
  onProductClick,
  onAddToCart,
}: CatalogHeroSpotlightProps) {
  const spotlightPool = products.filter((p) => p.isFeatured || p.isNew);
  const items = spotlightPool.length > 0 ? spotlightPool.slice(0, 4) : products.slice(0, 3);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = items[activeIndex] ?? items[0] ?? null;

  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    activeProduct?.tones && activeProduct.tones.length > 0 ? activeProduct.tones[0] ?? null : null
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectProductIndex = (idx: number) => {
    setActiveIndex(idx);
    const nextProd = items[idx] ?? items[0] ?? null;
    const firstTone =
      nextProd?.tones && nextProd.tones.length > 0 ? nextProd.tones[0] ?? null : null;
    setSelectedTone(firstTone);
    setIsJustAdded(false);
  };

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  if (!activeProduct) {
    return null;
  }

  const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision,
  }).format(activeProduct.price);

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
                color: 'rgba(255, 255, 255, 0.92)',
                maxWidth: '30ch',
                lineHeight: 1.35,
              }}
            >
              Fórmulas luminosas pensadas para realzar tu piel todos los días.
            </span>
          </div>
        </div>

        {/* Columna Derecha / Vitrina Interactiva AMUSE en Móvil */}
        <div className="catalog-hero__spotlight-pane">
          <div className="catalog-hero__top-nav">
            <span className="catalog-pill-tag">Favorito de Estudio</span>
            {items.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} role="tablist" aria-label="Productos destacados">
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
                      style={{
                        width: isCurrent ? '22px' : '8px',
                        height: '8px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: isCurrent ? 'var(--catalog-accent)' : 'rgba(140, 29, 50, 0.25)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'width 0.25s ease, background-color 0.25s ease',
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarjeta Spotlight interactiva estilo AMUSE Bebe Tint */}
          <div className="catalog-spotlight-card">
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
              <div className="catalog-spotlight__price-row">
                <h1
                  className="catalog-spotlight__title"
                  onClick={() => onProductClick(activeProduct, selectedTone)}
                >
                  {activeProduct.name}
                </h1>
                <p className="catalog-spotlight__price">{formattedPrice}</p>
              </div>

              <p className="catalog-spotlight__desc">{activeProduct.description}</p>

              {hasTones && activeProduct.tones && (
                <div>
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
                          onClick={() => setSelectedTone(tone)}
                          className={`amuse-swatch-btn ${isSelected ? 'is-active' : ''} ${!toneReady ? 'is-out' : ''}`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
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
                color: 'var(--catalog-accent)',
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
