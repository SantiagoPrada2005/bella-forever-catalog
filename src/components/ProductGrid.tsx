import { Fragment, useRef } from 'react';
import ProductCard from './ProductCard';
import CatalogEditorialInterlude from './CatalogEditorialInterlude';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CONFIG } from '../config';
import type { Category, ProductWithRelations, Tone } from '../db/schema';

export interface ProductGridProps {
  products: ProductWithRelations[];
  categories?: Category[];
  activeCategory?: string;
  activeCategoryLabel?: string;
  searchQuery?: string;
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart?: (product: ProductWithRelations, tone: Tone | null) => void;
  onSelectCategory?: (categoryId: string) => void;
  onClearSearch?: () => void;
}

const CATEGORY_SUBTITLES: Record<string, string> = {
  rubor: ' Texturas sedosas y pigmentos modulables que iluminan tus mejillas.',
  labiales: 'Acabados aterciopelados, tintas y brillos de confort prolongado.',
  cejas: 'Definición precisa y fijación natural de estudio.',
  pestanas: 'Volumen, alargamiento y dramatismo para realzar tu mirada.',
  correctores: 'Cobertura uniforme de efecto segunda piel sin cuartearse.',
  rostro: 'Preparación, fijación y perfeccionadores para un acabado impecable.',
};

export default function ProductGrid({
  products,
  categories = [],
  activeCategory = 'todos',
  activeCategoryLabel = 'Completa',
  searchQuery = '',
  onProductClick,
  onAddToCart = () => {},
  onSelectCategory,
  onClearSearch,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const trimmedSearch = searchQuery.trim();
  const isSearchActive = trimmedSearch.length > 0;
  const isSectionedAllView = activeCategory === 'todos' && !isSearchActive && products.length > 0;

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.product-card-anim',
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            stagger: {
              amount: 0.28,
              from: 'start',
            },
            duration: 0.48,
            ease: 'power2.out',
          }
        );
      });
    },
    { dependencies: [products, activeCategory, trimmedSearch], scope: gridRef }
  );

  // Construimos las secciones por categoría cuando estamos en la vista "Todos"
  const baseCategories =
    categories && categories.length > 0
      ? categories.map((c) => ({ id: c.slug, name: c.name }))
      : CONFIG.categories.filter((c) => c.id !== 'todos');

  const knownCatIds = new Set(baseCategories.map((c) => c.id));
  const extraCategories: Array<{ id: string; name: string }> = [];
  for (const p of products) {
    if (p.category && !knownCatIds.has(p.category)) {
      knownCatIds.add(p.category);
      extraCategories.push({
        id: p.category,
        name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
      });
    }
  }

  const orderedCategories = [...baseCategories, ...extraCategories];
  const categorySections = orderedCategories
    .map((cat) => ({
      ...cat,
      subtitle:
        CATEGORY_SUBTITLES[cat.id.toLowerCase()] ||
        `Selección curada de ${cat.name.toLowerCase()} en nuestro catálogo.`,
      items: products.filter((p) => p.category === cat.id),
    }))
    .filter((section) => section.items.length > 0);

  const featuredAndNewProducts = products.filter((p) => p.isFeatured || p.isNew).slice(0, 8);

  return (
    <section className="catalog-grid-section" aria-label="Colección de productos" ref={gridRef}>
      {/* Encabezado cuando se filtra por una categoría específica o hay búsqueda activa */}
      {!isSectionedAllView && (
        <div
          className="catalog-section-heading"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <h2 className="catalog-section-title">
            {isSearchActive ? 'Resultados para ' : activeCategory === 'todos' ? 'Colección ' : 'Selección '}
            <span className="catalog-section-title__serif">
              {isSearchActive
                ? `"${trimmedSearch}"`
                : activeCategory === 'todos'
                  ? 'de Estudio'
                  : activeCategoryLabel}
            </span>
          </h2>

          {(isSearchActive || activeCategory !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                if (onClearSearch) onClearSearch();
                if (onSelectCategory) onSelectCategory('todos');
              }}
              className="catalog-category-section__action"
            >
              Ver todo el catálogo
            </button>
          )}
        </div>
      )}

      {/* Estado Vacío */}
      {products.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            backgroundColor: 'var(--catalog-surface-card)',
            borderRadius: 'var(--radius-catalog-card)',
            border: '1px solid var(--catalog-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.75rem',
              color: 'var(--catalog-accent)',
              margin: 0,
              lineHeight: 1.15,
              paddingBottom: '4px',
            }}
          >
            {isSearchActive
              ? 'No encontramos coincidencias para tu búsqueda'
              : 'Sin piezas en esta categoría'}
          </h3>
          <p
            style={{
              color: 'var(--catalog-ink-muted)',
              fontSize: '0.88rem',
              maxWidth: '40ch',
              margin: 0,
            }}
          >
            {isSearchActive
              ? 'Intenta con otra palabra clave (por ejemplo: rubor, labial, gloss o cejas) o explora toda la colección.'
              : 'Pronto sumaremos nuevas referencias a esta selección.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isSearchActive && onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="catalog-filter-pill is-active"
                style={{ marginTop: '4px' }}
              >
                Limpiar búsqueda
              </button>
            )}
            {onSelectCategory && activeCategory !== 'todos' && (
              <button
                type="button"
                onClick={() => onSelectCategory('todos')}
                className="catalog-filter-pill is-active"
                style={{ marginTop: '4px' }}
              >
                Ver toda la colección
              </button>
            )}
          </div>
        </div>
      ) : isSectionedAllView ? (
        /* Vista "Todos" Seccionada: Banda de Destacados + Secciones por Categoría */
        <div className="catalog-sections-wrapper">
          {/* 1. Banda Curada: Favoritos & Nuevos Lanzamientos */}
          {featuredAndNewProducts.length > 0 && (
            <div className="catalog-featured-band">
              <div className="catalog-band-header">
                <div>
                  <span className="catalog-band-eyebrow">Selección Especial</span>
                  <h2 className="catalog-section-title" style={{ margin: 0 }}>
                    Favoritos &{' '}
                    <span className="catalog-section-title__serif">Nuevos Lanzamientos</span>
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--catalog-ink-muted)',
                  }}
                >
                  Desliza para explorar →
                </span>
              </div>

              <div className="catalog-featured-carousel no-scrollbar">
                {featuredAndNewProducts.map((prod) => (
                  <div key={`feat-${prod.id}`} className="catalog-featured-carousel__item">
                    <ProductCard
                      product={prod}
                      priority={false}
                      onProductClick={onProductClick}
                      onAddToCart={onAddToCart}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Secciones por Categoría */}
          {categorySections.map((section, sectionIndex) => (
            <Fragment key={section.id}>
              <div className="catalog-category-section">
                <div className="catalog-category-section__header">
                  <div className="catalog-category-section__meta">
                    <span className="catalog-band-eyebrow" style={{ marginBottom: '2px' }}>
                      {section.items.length} {section.items.length === 1 ? 'referencia' : 'referencias'}
                    </span>
                    <h2 className="catalog-section-title" style={{ margin: 0 }}>
                      Colección <span className="catalog-section-title__serif">{section.name}</span>
                    </h2>
                    <p className="catalog-category-section__subtitle">{section.subtitle}</p>
                  </div>

                  {onSelectCategory && (
                    <button
                      type="button"
                      onClick={() => onSelectCategory(section.id)}
                      className="catalog-category-section__action"
                    >
                      Ver sección ({section.items.length}) →
                    </button>
                  )}
                </div>

                <div className="catalog-studio-grid">
                  {section.items.map((prod) => (
                    <div key={prod.id} className="product-card-anim" style={{ height: '100%' }}>
                      <ProductCard
                        product={prod}
                        priority={false}
                        onProductClick={onProductClick}
                        onAddToCart={onAddToCart}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Interludio Editorial después de la primera categoría */}
              {sectionIndex === 0 && (
                <CatalogEditorialInterlude onSelectFeaturedCategory={onSelectCategory} />
              )}
            </Fragment>
          ))}
        </div>
      ) : (
        /* Vista Enfocada: Categoría seleccionada o Resultados de Búsqueda */
        <div className="catalog-studio-grid">
          {products.map((prod) => (
            <div key={prod.id} className="product-card-anim" style={{ height: '100%' }}>
              <ProductCard
                product={prod}
                priority={false}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
