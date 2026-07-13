import React, { useState } from 'react';
import FeaturedCarousel from '../components/FeaturedCarousel';
import CategoryFilters from '../components/CategoryFilters';
import ProductGrid from '../components/ProductGrid';
import ProductModal from '../components/ProductModal';
import CartDrawer from '../components/CartDrawer';
import productsData from '../data/products.json';
import { CONFIG } from '../config';

export default function Catalog({
  cart,
  isCartOpen,
  setIsCartOpen,
  handleAddToCart,
  handleUpdateQuantity,
  handleCheckout
}) {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductTone, setSelectedProductTone] = useState(null);

  const handleProductCardClick = (product, tone) => {
    setSelectedProduct(product);
    setSelectedProductTone(tone);
  };

  const filteredProducts = activeCategory === 'todos'
    ? productsData
    : productsData.filter(p => p.category === activeCategory);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <FeaturedCarousel
        products={productsData}
        onProductClick={handleProductCardClick}
        onAddToCart={handleAddToCart}
      />

      <div id="catalog-grid-section" style={{ padding: '40px 0 20px 0' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.2rem',
          textAlign: 'center',
          fontWeight: '300',
          color: 'var(--color-white)',
          marginBottom: '10px',
          letterSpacing: '1px'
        }}>
          Nuestro Catálogo
        </h2>
        <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <ProductGrid
          products={filteredProducts}
          onProductClick={handleProductCardClick}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Modal de Detalle */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          initialTone={selectedProductTone}
          onClose={() => {
            setSelectedProduct(null);
            setSelectedProductTone(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Carrito Lateral */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '40px 24px',
        borderTop: 'var(--border-glass)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        backgroundColor: 'rgba(18, 9, 11, 0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-gold)', marginBottom: '8px', letterSpacing: '2px' }}>
          BELLA FOREVER
        </p>
        <p style={{ marginBottom: '6px' }}>📍 {CONFIG.defaultCity} (Valle del Cauca)</p>
        <p>
          By: <a href={`https://instagram.com/${CONFIG.instagramUser}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)', fontWeight: '600', textDecoration: 'none' }}>@{CONFIG.instagramUser}</a>
        </p>
      </footer>
    </div>
  );
}
