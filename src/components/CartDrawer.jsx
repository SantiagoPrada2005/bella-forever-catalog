import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';

export default function CartDrawer({ cart, onClose, onUpdateQuantity, onCheckout }) {
  const drawerOverlay = useRef();
  const drawerContent = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(drawerOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    tl.fromTo(drawerContent.current, { x: '100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' }, '-=0.2');
    
    // Animación escalonada para los items del carrito
    tl.fromTo('.cart-item-anim', 
      { opacity: 0, x: 20 }, 
      { opacity: 1, x: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' },
      '-=0.25'
    );
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 2000
      }}
    >
      <div 
        ref={drawerContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-panel-dark)',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
          borderLeft: 'var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: 'var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: '400', color: 'var(--color-gold)' }}>
            Tu Pedido
          </h3>
          <button 
            onClick={handleClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.3rem', 
              cursor: 'pointer',
              color: 'var(--color-gold)',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }} className="no-scrollbar">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>El carrito está vacío</p>
              <p style={{ fontSize: '0.85rem' }}>¡Agrega tus cosméticos favoritos para coordinar el envío!</p>
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
                  className="cart-item-anim"
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    marginBottom: '20px', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                    paddingBottom: '16px' 
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.productName} 
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: 'var(--border-glass)' }} 
                  />
                  
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '400', color: 'var(--color-text-light)' }}>
                        {item.productName}
                      </h4>
                      {item.toneName && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: '500', marginTop: '2px' }}>
                          💄 {item.toneName}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          onClick={() => onUpdateQuantity(item.key, -1)}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '4px', 
                            border: '1px solid rgba(255,255,255,0.15)', 
                            backgroundColor: 'transparent', 
                            cursor: 'pointer',
                            color: 'var(--color-gold)',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >-</button>
                        <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.key, 1)}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '4px', 
                            border: '1px solid rgba(255,255,255,0.15)', 
                            backgroundColor: 'transparent', 
                            cursor: 'pointer',
                            color: 'var(--color-gold)',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >+</button>
                      </div>
                      
                      <p style={{ fontWeight: '600', color: 'var(--color-gold)', fontSize: '1rem' }}>
                        {formattedItemPrice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ 
            padding: '24px', 
            borderTop: 'var(--border-glass)', 
            backgroundColor: 'rgba(0, 0, 0, 0.2)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              fontSize: '1.2rem', 
              fontWeight: '400',
              fontFamily: 'var(--font-serif)'
            }}>
              <span>Total:</span>
              <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{formattedTotal}</span>
            </div>
            
            <button
              onClick={onCheckout}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-gold)',
                padding: '12px 0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                letterSpacing: '1px',
                boxShadow: 'var(--shadow-gold)',
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
