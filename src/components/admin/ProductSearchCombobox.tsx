import { useState, useMemo, useRef, useEffect } from 'react';
import type { ProductWithRelations } from '../../db/schema';
import { CONFIG } from '../../config';

interface ProductSearchComboboxProps {
  products: ProductWithRelations[];
  onSelectProduct: (product: ProductWithRelations) => void;
  onOpenCatalogPicker: () => void;
}

export default function ProductSearchCombobox({
  products,
  onSelectProduct,
  onOpenCatalogPicker,
}: ProductSearchComboboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products.slice(0, 15); // Show first 15 when empty
    }
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tones || []).some((t) => t.name.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    }).format(val);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Bar + Button Container */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar producto con foto por nombre o categoría..."
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: `1.5px solid ${isOpen ? 'var(--color-gold)' : 'rgba(215, 176, 106, 0.35)'}`,
              borderRadius: '10px',
              padding: '0 38px 0 14px',
              color: '#fff',
              fontSize: '16px', // Previene zoom automático en iOS
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              aria-label="Limpiar buscador"
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Open Catalog Picker Drawer */}
        <button
          type="button"
          onClick={onOpenCatalogPicker}
          style={{
            height: '46px',
            backgroundColor: 'rgba(215, 176, 106, 0.14)',
            border: '1.5px solid var(--color-gold)',
            borderRadius: '10px',
            padding: '0 16px',
            color: 'var(--color-gold)',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>✨ Explorar Catálogo</span>
        </button>
      </div>

      {/* Floating Visual Results Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-panel-dark)',
            border: '1.5px solid var(--color-gold)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
            zIndex: 3250,
            maxHeight: '340px',
            overflowY: 'auto',
            padding: '6px',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid rgba(215, 176, 106, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', textTransform: 'uppercase', fontWeight: '700' }}>
              {searchQuery ? `Resultados (${filteredProducts.length})` : `Catálogo rápido (${filteredProducts.length})`}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Toca para configurar
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
              }}
            >
              No se encontraron productos para &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const totalStock = p.tones && p.tones.length > 0
                ? p.tones.reduce((s, t) => s + t.stock, 0)
                : p.stock;
              const isOutOfStock = totalStock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(215, 176, 106, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(215, 176, 106, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {p.mainImage ? (
                      <img
                        src={p.mainImage}
                        alt={p.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
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
                          fontSize: '1.2rem',
                        }}
                      >
                        💄
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: '600',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', textTransform: 'capitalize' }}>
                        {p.category}
                      </span>
                      {p.tones && p.tones.length > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-pastel-pink)' }}>
                          • {p.tones.length} tonos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock Badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '0.98rem',
                        fontWeight: '700',
                        color: 'var(--color-gold)',
                        display: 'block',
                      }}
                    >
                      {formatPrice(p.price)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        color: isOutOfStock ? '#f87171' : totalStock <= 3 ? '#fbbf24' : '#34d399',
                      }}
                    >
                      {isOutOfStock ? 'Agotado' : `${totalStock} en stock`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
