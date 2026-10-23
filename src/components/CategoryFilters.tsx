import { CONFIG } from '../config';
import type { Category, ProductWithRelations } from '../db/schema';

export interface CategoryFiltersProps {
  categories?: Category[];
  products?: ProductWithRelations[];
  activeCategory: string;
  onCategoryChange?: (id: string) => void;
  onSelectCategory?: (id: string) => void;
}

export default function CategoryFilters({
  categories,
  products = [],
  activeCategory,
  onCategoryChange,
  onSelectCategory,
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

  const activeCount =
    activeCategory === 'todos'
      ? products.length
      : products.filter((p) => p.category === activeCategory).length;

  return (
    <nav className="catalog-filters-sticky" aria-label="Filtrar por categoría">
      <div className="catalog-filters-inner">
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
          {activeCount} {activeCount === 1 ? 'pieza' : 'piezas'}
        </span>
      </div>
    </nav>
  );
}
