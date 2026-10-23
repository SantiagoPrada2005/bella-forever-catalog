import { Fragment, useRef } from 'react';
import ProductCard from './ProductCard';
import CatalogEditorialInterlude from './CatalogEditorialInterlude';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface ProductGridProps {
  products: ProductWithRelations[];
  activeCategory?: string;
  activeCategoryLabel?: string;
  onProductClick: (product: ProductWithRelations, tone: Tone | null) => void;
  onAddToCart?: (product: ProductWithRelations, tone: Tone | null) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export default function ProductGrid({
  products,
  activeCategory = 'todos',
  activeCategoryLabel = 'Completa',
  onProductClick,
  onAddToCart = () => {},
  onSelectCategory,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.product-card-anim',
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: {
              amount: 0.32,
              from: 'start',
            },
            duration: 0.55,
            ease: 'power2.out',
          }
        );
      });
    },
    { dependencies: [products, activeCategory], scope: gridRef }
  );

  const interludeInsertIndex = products.length >= 4 ? 3 : products.length - 1;
  const shouldShowInterlude = activeCategory === 'todos' && products.length > 0;

  return (
    <section className="catalog-grid-section" aria-label="Colección de productos">
      <div className="catalog-section-heading">
        <h2 className="catalog-section-title">
          {activeCategory === 'todos' ? 'Colección ' : 'Selección '}
          <span className="catalog-section-title__serif">
            {activeCategory === 'todos' ? 'de Estudio' : activeCategoryLabel}
          </span>
        </h2>
      </div>

      {products.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 20px',
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
            Sin piezas en esta categoría
          </h3>
          <p
            style={{
              color: 'var(--catalog-ink-muted)',
              fontSize: '0.88rem',
              maxWidth: '38ch',
              margin: 0,
            }}
          >
            Pronto sumaremos nuevas referencias a esta selección.
          </p>
          {onSelectCategory && (
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
      ) : (
        <div ref={gridRef} className="catalog-studio-grid">
          {products.map((prod, index) => (
            <Fragment key={prod.id}>
              <div className="product-card-anim" style={{ height: '100%' }}>
                <ProductCard
                  product={prod}
                  priority={false}
                  onProductClick={onProductClick}
                  onAddToCart={onAddToCart}
                />
              </div>
              {shouldShowInterlude && index === interludeInsertIndex && (
                <CatalogEditorialInterlude onSelectFeaturedCategory={onSelectCategory} />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
