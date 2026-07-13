import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function ProductGrid({ products, onProductClick, onAddToCart }) {
  const gridRef = useRef();

  useGSAP(() => {
    // Animación de entrada diagonal premium
    gsap.fromTo('.product-card-anim', 
      { opacity: 0, y: 30, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        stagger: {
          amount: 0.4,
          grid: 'auto',
          from: 'start'
        },
        duration: 0.8, 
        ease: 'power3.out' 
      }
    );
  }, { dependencies: [products], scope: gridRef });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 48px 16px' }}>
      {products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'var(--color-text-muted)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '8px' }}>
            No se encontraron productos
          </h3>
          <p>Pronto añadiremos más productos en esta sección.</p>
        </div>
      ) : (
        <div>
          <style>{`
            .catalog-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 16px !important;
            }
            @media (min-width: 768px) {
              .catalog-grid {
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
                gap: 30px !important;
              }
            }
          `}</style>
          <div 
            ref={gridRef}
            className="catalog-grid"
          >
            {products.map((prod) => (
              <div key={prod.id} className="product-card-anim" style={{ height: '100%' }}>
                <ProductCard 
                  product={prod} 
                  onProductClick={onProductClick} 
                  onAddToCart={onAddToCart}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
