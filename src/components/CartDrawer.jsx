import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';

export default function CartDrawer({ cart, onClose, onUpdateQuantity, onCheckout }) {
  const drawerOverlay = useRef();
  const drawerContent = useRef();

  useGSAP(() => {
    // Animación de entrada: overlay se desvanece y el contenido se desliza lateralmente
    gsap.fromTo(drawerOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(drawerContent.current, { x: '100%' }, { x: '0%', duration: 0.45, ease: 'power3.out' });
  }, { scope: drawerOverlay });

  const handleClose = () => {
    gsap.to(drawerContent.current, { x: '100%', duration: 0.3, ease: 'power3.in' });
    gsap.to(drawerOverlay.current, { opacity: 0, duration: 0.3, onComplete: onClose });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const formattedTotal = new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency',
    currency: CONFIG.currency.code,
    maximumFractionDigits: CONFIG.currency.precision
  }).format(cartTotal);

  return (
    <div 
      ref={drawerOverlay}
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(90, 22, 35, 0.4)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 2000
      }}
    >
      <div 
        ref={drawerContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-white)',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 35px rgba(90, 22, 35, 0.1)',
          borderLeft: 'var(--border-glass)'
        }}
      >
        {/* Cabecera del Carrito */}
        <div style={{
          padding: '24px',
          borderBottom: 'var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: '400', color: 'var(--color-burgundy)' }}>
            Tu Pedido
          </h3>
          <button 
            onClick={handleClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              color: 'var(--color-burgundy)',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Lista de Ítems */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }} className="no-scrollbar">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>El carrito está vacío</p>
              <p style={{ fontSize: '0.9rem' }}>¡Agrega tus cosméticos favoritos para coordinar el envío!</p>
            </div>
          ) : (
            cart.map((item) => {
              const formattedItemPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
                style: 'currency',
                currency: CONFIG.currency.code,
                maximumFractionDigits: CONFIG.currency.precision
              }).format(item.price * item.quantity);

              return (
                <div 
                  key={item.key} 
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    marginBottom: '20px', 
                    borderBottom: '1px solid rgba(90, 22, 35, 0.05)', 
                    paddingBottom: '16px' 
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.productName} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: 'var(--border-glass)' }} 
                  />
                  
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--color-text-dark)' }}>
                        {item.productName}
                      </h4>
                      {item.toneName && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-burgundy)', fontWeight: '500', marginTop: '2px' }}>
                          💄 {item.toneName}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      {/* Control de Cantidad */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          onClick={() => onUpdateQuantity(item.key, -1)}
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(90, 22, 35, 0.15)', 
                            backgroundColor: '#fff', 
                            cursor: 'pointer',
                            color: 'var(--color-burgundy)',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-pastel-pink)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        >-</button>
                        <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.key, 1)}
                          style={{ 
                            width: '26px', 
                            height: '26px', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(90, 22, 35, 0.15)', 
                            backgroundColor: '#fff', 
                            cursor: 'pointer',
                            color: 'var(--color-burgundy)',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-pastel-pink)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        >+</button>
                      </div>
                      
                      <p style={{ fontWeight: '600', color: 'var(--color-burgundy)', fontSize: '1.1rem' }}>
                        {formattedItemPrice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Carrito */}
        {cart.length > 0 && (
          <div style={{ 
            padding: '24px', 
            borderTop: 'var(--border-glass)', 
            backgroundColor: 'rgba(90, 22, 35, 0.015)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              fontSize: '1.3rem', 
              fontWeight: '600',
              fontFamily: 'var(--font-serif)'
            }}>
              <span>Total:</span>
              <span style={{ color: 'var(--color-burgundy)' }}>{formattedTotal}</span>
            </div>
            
            <button
              className="btn-shine-effect"
              onClick={onCheckout}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: 'none',
                padding: '14px 0',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                letterSpacing: '1px',
                boxShadow: 'var(--shadow-premium)',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
            >
              Confirmar pedido por WhatsApp 📱
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
