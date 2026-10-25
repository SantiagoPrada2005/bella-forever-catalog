import { useState, useMemo } from 'react';
import type { ProductWithRelations } from '../../db/schema';
import ProductConfigCard, { type ConfiguredProductItem } from './ProductConfigCard';
import { CONFIG } from '../../config';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithRelations[];
  onAddProduct: (item: ConfiguredProductItem) => void;
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  products,
  onAddProduct,
}: ProductPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [configuringProduct, setConfiguringProduct] = useState<ProductWithRelations | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Extract unique categories from products
  const categoryList = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return ['todos', ...Array.from(cats)];
  }, [products]);

  // Filtered products based on search and category
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== 'todos') {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tones || []).some((t) => t.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision,
    }).format(val);
  };

  const handleProductAdd = (item: ConfiguredProductItem) => {
    onAddProduct(item);
    setConfiguringProduct(null);
    setAddedToast(`¡${item.productName} agregado!`);
    setTimeout(() => {
      setAddedToast(null);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="catalog-picker-backdrop" onClick={onClose}>
      <div
        className="catalog-picker-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-panel-dark)',
            borderBottom: '1px solid rgba(215, 176, 106, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.3rem',
                color: '#fff',
                fontWeight: '400',
              }}
            >
              Catálogo Visual
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-gold)' }}>
              {filteredProducts.length} productos disponibles
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar catálogo"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(215, 176, 106, 0.3)',
              color: 'var(--color-gold)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Success toast notification */}
        {addedToast && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.95)',
              color: '#fff',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>✅</span>
            <span>{addedToast}</span>
          </div>
        )}

        {/* In-drawer Product Configuration View */}
        {configuringProduct ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <button
              type="button"
              onClick={() => setConfiguringProduct(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-gold)',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0',
              }}
            >
              ← Volver al catálogo
            </button>
            <ProductConfigCard
              key={configuringProduct.id}
              product={configuringProduct}
              onAdd={handleProductAdd}
              onCancel={() => setConfiguringProduct(null)}
            />
          </div>
        ) : (
          <>
            {/* Search Bar inside Drawer */}
            <div style={{ padding: '12px 14px 4px 14px', backgroundColor: 'var(--color-panel-dark)' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre, tono o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1.5px solid rgba(215, 176, 106, 0.3)',
                    borderRadius: '10px',
                    padding: '0 40px 0 14px',
                    color: '#fff',
                    fontSize: '16px', // Previene zoom en iOS
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
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
            </div>

            {/* Category horizontal pills scroll */}
            <div className="catalog-category-scroll">
              {categoryList.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: isSelected ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isSelected ? 'var(--color-gold)' : 'rgba(215, 176, 106, 0.2)'}`,
                      color: isSelected ? '#0A0405' : 'var(--color-text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      flexShrink: 0,
                      minHeight: '38px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat === 'todos' ? '✨ Todos' : cat}
                  </button>
                );
              })}
            </div>

            {/* Product Cards Grid */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
                  No se encontraron productos que coincidan con &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="catalog-picker-grid">
                  {filteredProducts.map((p) => {
                    const totalStock = p.tones && p.tones.length > 0
                      ? p.tones.reduce((acc, t) => acc + t.stock, 0)
                      : p.stock;
                    const isOutOfStock = totalStock <= 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setConfiguringProduct(p)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(215, 176, 106, 0.16)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        {/* Product Image */}
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            position: 'relative',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          {p.mainImage ? (
                            <img
                              src={p.mainImage}
                              alt={p.name}
                              loading="lazy"
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
                                fontSize: '2rem',
                              }}
                            >
                              💄
                            </div>
                          )}

                          {/* Stock Tag on Image */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.9)' : 'rgba(10, 4, 5, 0.85)',
                              color: isOutOfStock ? '#fff' : totalStock <= 3 ? '#f59e0b' : '#34d399',
                              border: `1px solid ${isOutOfStock ? '#ef4444' : 'rgba(215, 176, 106, 0.3)'}`,
                              padding: '2px 7px',
                              borderRadius: '8px',
                              fontSize: '0.68rem',
                              fontWeight: '700',
                            }}
                          >
                            {isOutOfStock ? 'Agotado' : `${totalStock} disp.`}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--color-gold)',
                              textTransform: 'uppercase',
                              fontWeight: '700',
                              letterSpacing: '0.5px',
                              marginBottom: '2px',
                            }}
                          >
                            {p.category}
                          </span>
                          <h4
                            style={{
                              margin: '0 0 6px 0',
                              fontSize: '0.85rem',
                              color: '#fff',
                              fontWeight: '600',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.2em',
                            }}
                          >
                            {p.name}
                          </h4>

                          {/* Tone previews if any */}
                          {p.tones && p.tones.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {p.tones.slice(0, 4).map((t) => (
                                  <span
                                    key={t.id}
                                    style={{
                                      width: '10px',
                                      height: '10px',
                                      borderRadius: '50%',
                                      backgroundColor: t.hex,
                                      display: 'inline-block',
                                      border: '1px solid rgba(255,255,255,0.3)',
                                    }}
                                  />
                                ))}
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {p.tones.length} tonos
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              marginTop: 'auto',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: '6px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                color: 'var(--color-gold)',
                              }}
                            >
                              {formatPrice(p.price)}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--color-gold)',
                                backgroundColor: 'rgba(215, 176, 106, 0.15)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontWeight: '700',
                              }}
                            >
                              + Elegir
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
