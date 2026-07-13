import React from 'react';
import { CONFIG } from '../config';

export default function Header({ cartCount, onCartClick }) {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '70px',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: 'var(--border-glass)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
      }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <img 
          src="/isotipo.png" 
          alt="Bella Forever Isotipo" 
          style={{ height: '36px', objectFit: 'contain' }} 
        />
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          fontWeight: '700',
          color: 'var(--color-burgundy)',
          letterSpacing: '2px'
        }}>
          BELLA FOREVER
        </span>
      </div>
      
      <button 
        onClick={onCartClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          color: 'var(--color-burgundy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-burgundy)',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-gold)'
          }}>
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}
