import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface ProductCardProps {
  product: ProductWithRelations;
  priority?: boolean;
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
}

export default function ProductCard({
  product,
  priority = false,
  onProductClick,
  onAddToCart,
}: ProductCardProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
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

  const hasTones = Boolean(product.tones && product.tones.length > 0);
  const isToneAvailable = selectedTone ? Boolean(selectedTone.inStock) && selectedTone.stock > 0 : true;
  const isAvailable = Boolean(product.inStock) && (hasTones ? isToneAvailable : product.stock > 0);
  const currentStock = selectedTone ? selectedTone.stock : product.stock;
  const isLowStock = isAvailable && currentStock > 0 && currentStock <= 3;

  const visibleTones = product.tones ? product.tones.slice(0, 5) : [];
  const extraTonesCount = product.tones && product.tones.length > 5 ? product.tones.length - 5 : 0;

  return (
    <article
      onClick={() => onProductClick(product, selectedTone)}
      className="studio-product-card"
    >
      {/* Fila Superior: Categoría y Badge Glossier */}
      <div className="studio-product-card__top-row">
        <span className="studio-product-card__category">{product.category}</span>
        {product.isNew ? (
          <span className="studio-product-card__badge">Nuevo</span>
        ) : isLowStock ? (
          <span className="studio-product-card__badge">Quedan {currentStock}</span>
        ) : null}
      </div>

      {/* Marco de Estudio de la Imagen */}
      <div className="studio-product-card__media">
        <img
          src={currentImage}
          alt={`${product.name}${selectedTone?.name ? ` - Tono ${selectedTone.name}` : ''} | Bella Forever`}
          width="400"
          height="400"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="studio-product-card__img"
        />
      </div>

      {/* Cuerpo Tipográfico + Swatches AMUSE */}
      <div className="studio-product-card__body">
        <h3 className="studio-product-card__title">{product.name}</h3>

        {hasTones && product.tones && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}
          >
            {selectedTone?.name && (
              <p className="studio-product-card__tone-label">
                Tono: <strong style={{ color: 'var(--catalog-ink)', fontWeight: 600 }}>{selectedTone.name}</strong>
              </p>
            )}
            <div className="amuse-swatch-list">
              {visibleTones.map((tone) => {
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
                      width: '19px',
                      height: '19px',
                      backgroundColor: tone.hex,
                    }}
                  />
                );
              })}
              {extraTonesCount > 0 && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: 'var(--catalog-ink-muted)',
                    paddingLeft: '2px',
                  }}
                >
                  +{extraTonesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pie de tarjeta: Precio y Acción Rápida */}
        <div className="studio-product-card__footer">
          <p className="studio-product-card__price">{formattedPrice}</p>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            aria-label={
              isJustAdded
                ? 'Producto agregado al pedido'
                : isAvailable
                  ? `Agregar ${product.name} al pedido`
                  : 'Producto agotado'
            }
            className={`studio-product-card__cta ${isJustAdded ? 'is-added' : ''}`}
          >
            {isAvailable ? (isJustAdded ? 'Agregado' : '+ Agregar') : 'Agotado'}
          </button>
        </div>
      </div>
    </article>
  );
}
