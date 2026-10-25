import { useState, useMemo } from 'react';
import type { ProductWithRelations } from '../../db/schema';
import { formatCop, parseCop } from '../../utils/currency';

export interface ConfiguredProductItem {
  productId: string;
  productName: string;
  toneId: string | null;
  toneName: string | null;
  imageUrl: string;
  price: number;
  catalogPrice: number;
  quantity: number;
  maxStock: number;
}

interface ProductConfigCardProps {
  product: ProductWithRelations;
  onAdd: (item: ConfiguredProductItem) => void;
  onCancel?: () => void;
  initialToneId?: string | null;
}

export default function ProductConfigCard({
  product,
  onAdd,
  onCancel,
  initialToneId,
}: ProductConfigCardProps) {
  // Available tones
  const tones = useMemo(() => product.tones || [], [product]);

  // Selected tone state
  const [selectedToneId, setSelectedToneId] = useState<string>(() => {
    if (initialToneId && tones.some((t) => t.id === initialToneId)) {
      return initialToneId;
    }
    return tones.length > 0 ? tones[0].id : '';
  });

  // Quantity state (defaults to 1)
  const [quantity, setQuantity] = useState<number>(1);

  // Custom price state (defaults to catalog price)
  const [customPrice, setCustomPrice] = useState<string>(product.price.toString());

  // Error feedback inside card
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected tone object
  const selectedTone = useMemo(() => {
    if (!selectedToneId) return null;
    return tones.find((t) => t.id === selectedToneId) || null;
  }, [tones, selectedToneId]);

  // Reactive image: switches immediately to tone photo if available!
  const displayImage = useMemo(() => {
    if (selectedTone?.image) return selectedTone.image;
    if (product.mainImage) return product.mainImage;
    if (product.productImages && product.productImages[0]?.url) {
      return product.productImages[0].url;
    }
    return '';
  }, [selectedTone, product]);

  // Available stock for selected variation
  const availableStock = useMemo(() => {
    if (selectedTone) return selectedTone.stock;
    return product.stock;
  }, [selectedTone, product]);

  const parsedPrice = parseCop(customPrice);
  const isValidPrice = parsedPrice >= 0 && customPrice.trim() !== '';
  const lineTotal = isValidPrice ? parsedPrice * quantity : 0;

  const formatPrice = formatCop;

  const handleAdd = () => {
    if (tones.length > 0 && !selectedTone) {
      setErrorMsg('Por favor selecciona un tono');
      return;
    }

    if (!isValidPrice) {
      setErrorMsg('Ingresa un precio válido');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('La cantidad debe ser al menos 1');
      return;
    }

    onAdd({
      productId: product.id,
      productName: product.name,
      toneId: selectedTone ? selectedTone.id : null,
      toneName: selectedTone ? selectedTone.name : null,
      imageUrl: displayImage,
      price: parsedPrice,
      catalogPrice: product.price,
      quantity,
      maxStock: availableStock,
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(215, 176, 106, 0.05)',
        border: '1.5px solid var(--color-gold)',
        borderRadius: '16px',
        padding: '16px',
        marginTop: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
        position: 'relative',
      }}
    >
      {/* Header with dismiss button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--color-gold)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              backgroundColor: 'rgba(215, 176, 106, 0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            Configurar Producto
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              textTransform: 'capitalize',
            }}
          >
            {product.category}
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar configuración"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Main product visual card */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        {/* Dynamic Image with smooth border */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            flexShrink: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1.5px solid rgba(215, 176, 106, 0.4)',
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.2s ease',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold)',
                fontSize: '1.8rem',
              }}
            >
              💄
            </div>
          )}

          {/* Stock badge overlay on image */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: availableStock > 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: '700',
              textAlign: 'center',
              padding: '2px 0',
            }}
          >
            {availableStock > 0 ? `${availableStock} disp.` : 'Agotado'}
          </div>
        </div>

        {/* Product title & price info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#fff',
              lineHeight: 1.25,
            }}
          >
            {product.name}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.15rem',
                fontWeight: '700',
                color: 'var(--color-gold)',
              }}
            >
              {formatPrice(product.price)}
            </span>
            {selectedTone && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-pastel-pink)',
                  backgroundColor: 'rgba(215, 176, 106, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Tono: <strong>{selectedTone.name}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tone Selection (if product has tones) */}
      {tones.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.76rem',
              color: 'var(--color-gold)',
              marginBottom: '6px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Elige el Tono / Color ({tones.length} disponibles):
          </label>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {tones.map((t) => {
              const isSelected = selectedToneId === t.id;
              const hasStock = t.stock > 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedToneId(t.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(215, 176, 106, 0.28)' : 'rgba(0, 0, 0, 0.5)',
                    border: `1.5px solid ${isSelected ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.15)'}`,
                    color: isSelected ? 'var(--color-gold)' : '#fff',
                    borderRadius: '24px',
                    padding: '8px 14px',
                    minHeight: '44px', // Touch target ≥ 44px
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(215, 176, 106, 0.3)' : 'none',
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: t.hex,
                      display: 'inline-block',
                      border: '1.5px solid rgba(255,255,255,0.4)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      flexShrink: 0,
                    }}
                  />
                  <span>{t.name}</span>
                  <span
                    style={{
                      color: hasStock ? '#34d399' : '#f87171',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                    }}
                  >
                    ({t.stock})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Custom Price Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          alignItems: 'flex-end',
          marginBottom: '14px',
        }}
      >
        {/* Quantity Stepper */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.74rem',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
              fontWeight: '600',
            }}
          >
            Cantidad
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              style={{
                width: '44px',
                height: '44px', // Touch target ≥ 44px
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              -
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '56px',
                height: '44px',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(215, 176, 106, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '16px', // Previene zoom en iOS
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar cantidad"
              style={{
                width: '44px',
                height: '44px', // Touch target ≥ 44px
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          {/* Quick Quantity Shortcuts for Mobile */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            {[1, 2, 3, 5].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                style={{
                  padding: '3px 8px',
                  backgroundColor: quantity === amt ? 'rgba(215, 176, 106, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${quantity === amt ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '6px',
                  color: quantity === amt ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Unit Price */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label
              style={{
                fontSize: '0.74rem',
                color: 'var(--color-text-muted)',
                fontWeight: '600',
              }}
            >
              Precio Unitario ($)
            </label>
            {parsedPrice !== product.price && isValidPrice && (
              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--color-gold)',
                  fontStyle: 'italic',
                }}
              >
                Catálogo: {formatPrice(product.price)}
              </span>
            )}
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(215, 176, 106, 0.4)',
              borderRadius: '8px',
              padding: '0 12px',
              color: 'var(--color-gold)',
              fontWeight: '700',
              fontSize: '16px', // Previene zoom en iOS
              outline: 'none',
            }}
          />
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '12px',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Subtotal & Action Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(215, 176, 106, 0.2)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Subtotal Línea ({quantity} un.):
          </span>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--color-gold)',
            }}
          >
            {formatPrice(lineTotal)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            minHeight: '44px',
            backgroundColor: 'var(--color-gold)',
            color: '#0A0405',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-gold)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.1s ease',
          }}
        >
          <span>+ Agregar al Pedido</span>
        </button>
      </div>
    </div>
  );
}
