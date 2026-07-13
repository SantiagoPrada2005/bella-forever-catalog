import React from 'react';
import { CONFIG } from '../config';

export default function CategoryFilters({ activeCategory, onCategoryChange }) {
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      padding: '16px 24px 24px 24px',
      gap: '12px',
      whiteSpace: 'nowrap',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      justifyContent: 'flex-start'
    }} className="no-scrollbar filters-container">
      <style>{`
        @media (min-width: 768px) {
          .filters-container {
            justify-content: center !important;
          }
        }
      `}</style>
      {CONFIG.categories.map((cat) => {
        const isActive = cat.id === activeCategory;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              border: isActive ? '1px solid var(--color-gold)' : '1px solid rgba(215, 176, 106, 0.15)',
              backgroundColor: isActive ? 'var(--color-burgundy)' : 'var(--color-panel-dark)',
              color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? 'var(--shadow-gold)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--color-gold)';
                e.currentTarget.style.borderColor = 'var(--color-gold)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--color-text-muted)';
                e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.15)';
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
