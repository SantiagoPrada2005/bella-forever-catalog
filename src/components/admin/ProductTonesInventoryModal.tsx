import { useState, useId } from 'react';
import type { ProductWithRelations, Tone } from '../../db/schema';
import { updateProductTonesStock } from '../../lib/api-client';

export interface ProductTonesInventoryModalProps {
  product: ProductWithRelations;
  onClose: () => void;
  onSaved: (updatedProduct: ProductWithRelations) => void;
}

interface ToneStockState {
  id: string;
  name: string;
  hex: string;
  stock: number;
  inStock: boolean;
}

export default function ProductTonesInventoryModal({
  product,
  onClose,
  onSaved,
}: ProductTonesInventoryModalProps) {
  const modalTitleId = useId();
  const [toneStates, setToneStates] = useState<ToneStockState[]>(() => {
    return (product.tones || []).map(t => ({
      id: t.id,
      name: t.name,
      hex: t.hex,
      stock: t.stock !== undefined ? t.stock : 10,
      inStock: t.inStock !== undefined ? t.inStock : (t.stock ?? 10) > 0,
    }));
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalStock = toneStates.reduce((acc, t) => acc + t.stock, 0);

  const handleStockChange = (id: string, newStock: number) => {
    const safeStock = Math.max(0, isNaN(newStock) ? 0 : newStock);
    setToneStates(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, stock: safeStock, inStock: safeStock > 0 ? t.inStock : false }
          : t
      )
    );
  };

  const handleToggleInStock = (id: string) => {
    setToneStates(prev =>
      prev.map(t =>
        t.id === id ? { ...t, inStock: !t.inStock } : t
      )
    );
  };

  const handleAdjustStep = (id: string, delta: number) => {
    setToneStates(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nextStock = Math.max(0, t.stock + delta);
        return {
          ...t,
          stock: nextStock,
          inStock: nextStock > 0 ? (t.stock === 0 ? true : t.inStock) : false,
        };
      })
    );
  };

  const handleSetAllStock = (amount: number) => {
    setToneStates(prev =>
      prev.map(t => ({
        ...t,
        stock: amount,
        inStock: amount > 0,
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = toneStates.map(t => ({
        id: t.id,
        stock: t.stock,
        inStock: t.inStock,
      }));

      const res = await updateProductTonesStock(product.id, payload);
      if (res.product) {
        onSaved(res.product);
      } else {
        // En caso de que no retorne el producto completo, sintetizamos el estado actualizado
        const updatedTones = (product.tones || []).map(t => {
          const matching = toneStates.find(item => item.id === t.id);
          return matching ? { ...t, stock: matching.stock, inStock: matching.inStock } : t;
        });
        const updatedTotal = updatedTones.reduce((s, t) => s + t.stock, 0);
        onSaved({
          ...product,
          stock: updatedTotal,
          inStock: updatedTones.some(t => t.inStock && t.stock > 0),
          tones: updatedTones as Tone[],
        });
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar inventario de tonos', err);
      const msg = err instanceof Error ? err.message : 'Error al guardar inventario de tonos';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        style={{
          backgroundColor: 'var(--color-panel-dark)',
          border: 'var(--border-glass)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-premium)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: 'var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {product.mainImage && (
              <img
                src={product.mainImage}
                alt={product.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                }}
              />
            )}
            <div>
              <h3
                id={modalTitleId}
                style={{
                  fontSize: '1.15rem',
                  color: 'var(--color-gold)',
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                  fontWeight: '600',
                }}
              >
                Inventario de Tonos
              </h3>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Barra de Resumen y Acciones Rápidas */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(215, 176, 106, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Total Unidades:
            </span>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: totalStock === 0 ? '#ef4444' : totalStock <= 5 ? '#f59e0b' : '#10b981',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              {totalStock} un.
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              ({toneStates.length} variantes)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleSetAllStock(0)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.72rem',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Agotar todos
            </button>
            <button
              type="button"
              onClick={() => handleSetAllStock(5)}
              style={{
                background: 'rgba(215, 176, 106, 0.1)',
                border: '1px solid rgba(215, 176, 106, 0.25)',
                color: 'var(--color-gold)',
                fontSize: '0.72rem',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Poner 5 a todos
            </button>
          </div>
        </div>

        {/* Mensaje de Error si aplica */}
        {error && (
          <div
            style={{
              margin: '12px 24px 0 24px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.82rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Lista de Tonos con Steppers */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {toneStates.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '20px 0' }}>
              Este producto no tiene tonos configurados.
            </p>
          ) : (
            toneStates.map(tone => {
              const isOut = tone.stock === 0 || !tone.inStock;
              const isLow = !isOut && tone.stock <= 3;

              return (
                <div
                  key={tone.id}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(215, 176, 106, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Swatch y Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '130px', flex: 1 }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: tone.hex,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500', display: 'block' }}>
                        {tone.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981',
                        }}
                      >
                        {isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Disponible'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle de Disponibilidad */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: tone.inStock ? '#34d399' : 'var(--color-text-muted)',
                      userSelect: 'none',
                    }}
                    title="Habilitar o inhabilitar este tono para compra"
                  >
                    <input
                      type="checkbox"
                      checked={tone.inStock}
                      onChange={() => handleToggleInStock(tone.id)}
                      style={{ accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                    />
                    <span style={{ display: 'none' /* para mobile */ }}>Vis</span>
                  </label>

                  {/* Stepper de Unidades */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleAdjustStep(tone.id, -1)}
                      disabled={tone.stock <= 0}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid rgba(215, 176, 106, 0.25)',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: tone.stock <= 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                        cursor: tone.stock <= 0 ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                      }}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={tone.stock}
                      onChange={(e) => handleStockChange(tone.id, parseInt(e.target.value, 10))}
                      style={{
                        width: '54px',
                        height: '28px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: '1px solid rgba(215, 176, 106, 0.3)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleAdjustStep(tone.id, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid rgba(215, 176, 106, 0.25)',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con Acciones */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: 'var(--border-glass)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--gradient-gold)',
              color: '#000',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Inventario'}
          </button>
        </div>
      </div>
    </div>
  );
}
