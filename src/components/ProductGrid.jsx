import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function ProductGrid({ products, onProductClick, onAddToCart }) {
  const gridRef = useRef();

  useGSAP(() => {
    // Animación de entrada de las tarjetas con retraso progresivo (stagger)
    gsap.fromTo('.product-card-anim', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'power2.out' }
    );
  }, { dependencies: [products], scope: gridRef });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 48px 24px' }}>
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
        <div 
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}
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
      )}
    </div>
  );
}
