import React from 'react';
import { CONFIG } from '../config';

export default function CategoryFilters({ categories, products = [], activeCategory, onCategoryChange }) {
  const baseCategories = categories && categories.length > 0
    ? categories.map(c => ({ id: c.slug, name: c.name }))
    : CONFIG.categories.filter(c => c.id !== 'todos');

  const validCategories = products && products.length > 0
    ? baseCategories.filter(cat => products.some(p => p.category === cat.id))
    : baseCategories;

  const catList = [{ id: 'todos', name: 'Todos' }, ...validCategories];

  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      padding: '16px 24px 24px 24px',
      gap: '12px',
      whiteSpace: 'nowrap',
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
      {catList.map((cat) => {
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
