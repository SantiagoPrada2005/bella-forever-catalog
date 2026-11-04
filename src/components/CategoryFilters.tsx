import { CONFIG } from '../config';
import type { Category, ProductWithRelations } from '../db/schema';

export interface CategoryFiltersProps {
  categories?: Category[];
  products?: ProductWithRelations[];
  activeCategory: string;
  searchQuery?: string;
  filteredCount?: number;
  onCategoryChange?: (id: string) => void;
  onSelectCategory?: (id: string) => void;
  onSearchChange?: (query: string) => void;
}

export default function CategoryFilters({
  categories,
  products = [],
  activeCategory,
  searchQuery = '',
  filteredCount,
  onCategoryChange,
  onSelectCategory,
  onSearchChange,
}: CategoryFiltersProps) {
  const handleChange = onCategoryChange || onSelectCategory || (() => {});
  const baseCategories =
    categories && categories.length > 0
      ? categories.map((c) => ({ id: c.slug, name: c.name }))
      : CONFIG.categories.filter((c) => c.id !== 'todos');

  const validCategories =
    products && products.length > 0
      ? baseCategories.filter((cat) => products.some((p) => p.category === cat.id))
      : baseCategories;

  const catList = [{ id: 'todos', name: 'Todos' }, ...validCategories];

  const defaultCount =
    activeCategory === 'todos'
      ? products.length
      : products.filter((p) => p.category === activeCategory).length;

  const displayCount = typeof filteredCount === 'number' ? filteredCount : defaultCount;

  return (
    <nav className="catalog-filters-sticky" aria-label="Buscar y filtrar por categoría">
      <div className="catalog-filters-stack">
        {onSearchChange && (
          <div className="catalog-search-row">
            <div className="catalog-search-box">
              <span className="catalog-search-icon" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar producto, tono o categoría..."
                aria-label="Buscar productos en el catálogo"
                className="catalog-search-input"
              />
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpiar búsqueda"
                  className="catalog-search-clear"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <span className="catalog-mobile-count">
              {displayCount} {displayCount === 1 ? 'pieza' : 'piezas'}
            </span>
          </div>
        )}

        <div className="catalog-filters-pills-row">
          <div className="catalog-filters-track no-scrollbar">
            {catList.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleChange(cat.id)}
                  className={`catalog-filter-pill ${isActive ? 'is-active' : ''}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <span className="catalog-filters-count">
            {displayCount} {displayCount === 1 ? 'pieza' : 'piezas'}
          </span>
        </div>
      </div>
    </nav>
  );
}
