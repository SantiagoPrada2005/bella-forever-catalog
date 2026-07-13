import React from 'react';
import { CONFIG } from '../config';

export default function CategoryFilters({ activeCategory, onCategoryChange }) {
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      padding: '24px 24px 12px 24px',
      gap: '12px',
      whiteSpace: 'nowrap',
      maxWidth: '1200px',
      margin: '0 auto',
      justifyContent: 'center'
    }} className="no-scrollbar">
      {CONFIG.categories.map((cat) => {
        const isActive = cat.id === activeCategory;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-pill)',
              border: isActive ? '1px solid var(--color-gold)' : '1px solid rgba(90, 22, 35, 0.1)',
              backgroundColor: isActive ? 'var(--color-burgundy)' : 'rgba(255, 255, 255, 0.6)',
              color: isActive ? 'var(--color-gold)' : 'var(--color-burgundy)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? 'var(--shadow-gold)' : 'none',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(90, 22, 35, 0.05)';
                e.currentTarget.style.borderColor = 'var(--color-burgundy)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(90, 22, 35, 0.1)';
              }
            }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
