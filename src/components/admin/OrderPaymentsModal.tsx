import { useState } from 'react';
import type { OrderWithItems, OrderPayment } from '../../db/schema';
import { addOrderPayment, deleteOrderPayment } from '../../lib/api-client';
import { formatCop, parseCop } from '../../utils/currency';

interface OrderPaymentsModalProps {
  order: OrderWithItems;
  onClose: () => void;
  onUpdated: () => void;
}

const PAYMENT_METHODS = [
  { id: 'nequi', label: 'Nequi 🟣' },
  { id: 'daviplata', label: 'Daviplata 🔴' },
  { id: 'bancolombia', label: 'Bancolombia 🟡' },
  { id: 'efectivo', label: 'Efectivo 💵' },
  { id: 'tarjeta', label: 'Tarjeta 💳' },
  { id: 'otro', label: 'Otro 🏷️' },
];

export default function OrderPaymentsModal({ order, onClose, onUpdated }: OrderPaymentsModalProps) {
  const payments = order.payments || [];
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, order.total - totalPaid);

  const [amount, setAmount] = useState<string>(remainingBalance > 0 ? remainingBalance.toString() : '');
  const [method, setMethod] = useState<string>('nequi');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = formatCop;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleAddPayment = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const numAmount = parseCop(amount);
    if (numAmount <= 0) {
      setError('Ingresa un monto válido mayor a 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addOrderPayment(order.id, {
        amount: numAmount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setAmount('');
      setReference('');
      setNotes('');
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el abono';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment: OrderPayment) => {
    if (!confirm(`¿Eliminar el abono de ${formatPrice(payment.amount)} (${payment.method})?`)) {
      return;
    }
    setDeletingId(payment.id);
    try {
      await deleteOrderPayment(order.id, payment.id);
      onUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el abono');
    } finally {
      setDeletingId(null);
    }
  };

  const progressPercent = Math.min(100, Math.round((totalPaid / (order.total || 1)) * 100));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 3500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-panel-dark)',
          border: '1px solid var(--color-gold)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-premium)',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera Móvil */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(215, 176, 106, 0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(10, 4, 5, 0.6)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                Historial de Pagos y Abonos
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(215, 176, 106, 0.15)',
                  color: 'var(--color-gold)',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                }}
              >
                #{order.orderNumber}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
              Cliente: <strong style={{ color: '#fff' }}>{order.customerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido con scroll */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Card Resumen de Saldos */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(215, 176, 106, 0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Total Pedido
                </span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#fff', fontSize: '1rem' }}>
                  {formatPrice(order.total)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase' }}>
                  Abonado
                </span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#34d399', fontSize: '1rem' }}>
                  {formatPrice(totalPaid)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: remainingBalance > 0 ? '#f59e0b' : '#34d399', textTransform: 'uppercase' }}>
                  Saldo Pendiente
                </span>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontWeight: '800',
                    color: remainingBalance > 0 ? '#f59e0b' : '#34d399',
                    fontSize: '1.05rem',
                  }}
                >
                  {remainingBalance > 0 ? formatPrice(remainingBalance) : 'PAGADO ✅'}
                </p>
              </div>
            </div>

            {/* Barra de progreso de pago */}
            <div style={{ marginTop: '14px' }}>
              <div
                style={{
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: remainingBalance === 0 ? '#10b981' : 'var(--color-gold)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                <span>Progreso: {progressPercent}% pagado</span>
                <span>{payments.length} abonos</span>
              </div>
            </div>
          </div>

          {/* Formulario para Registrar Nuevo Abono */}
          <form
            onSubmit={handleAddPayment}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(215, 176, 106, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-gold)', fontSize: '0.92rem', fontWeight: '600' }}>
              + Registrar Nuevo Abono
            </h4>

            {error && (
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
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Monto ($ COP) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    min="1"
                    placeholder="Monto a abonar"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(215, 176, 106, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                  {remainingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(remainingBalance.toString())}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(215, 176, 106, 0.2)',
                        border: '1px solid rgba(215, 176, 106, 0.4)',
                        color: 'var(--color-gold)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Pagar todo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Método de Pago *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(215, 176, 106, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id} style={{ backgroundColor: '#1a0b0f', color: '#fff' }}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  # Comprobante / Referencia (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nequi M12345"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.2)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  Nota del abono (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Abono en efectivo en tienda"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(215, 176, 106, 0.2)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-gold)',
                padding: '11px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-gold)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Guardando Abono...' : 'Guardar Abono'}
            </button>
          </form>

          {/* Historial de Abonos */}
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-gold)', fontSize: '0.92rem', fontWeight: '600' }}>
            Abonos Registrados ({payments.length})
          </h4>

          {payments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                border: '1px dashed rgba(215, 176, 106, 0.2)',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
              }}
            >
              Aún no hay abonos registrados para este pedido.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.map((p) => {
                const methodObj = PAYMENT_METHODS.find((m) => m.id === p.method);
                const methodLabel = methodObj ? methodObj.label : p.method;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(215, 176, 106, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(215, 176, 106, 0.12)',
                            color: 'var(--color-gold)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}
                        >
                          {methodLabel}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {formatDate(p.createdAt)}
                        </span>
                      </div>

                      {p.reference && (
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem', color: '#fff' }}>
                          Ref: <span style={{ fontFamily: 'monospace', color: 'var(--color-gold)' }}>{p.reference}</span>
                        </p>
                      )}

                      {p.notes && (
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          Nota: {p.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: '#34d399' }}>
                        +{formatPrice(p.amount)}
                      </span>
                      <button
                        onClick={() => handleDeletePayment(p)}
                        disabled={deletingId === p.id}
                        title="Eliminar abono"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '6px',
                          fontSize: '0.9rem',
                          opacity: deletingId === p.id ? 0.4 : 0.8,
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(215, 176, 106, 0.18)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(10, 4, 5, 0.6)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(215, 176, 106, 0.3)',
              color: 'var(--color-gold)',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
