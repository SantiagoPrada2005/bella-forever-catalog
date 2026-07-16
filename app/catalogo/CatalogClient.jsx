'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../src/components/Header';
import FeaturedCarousel from '../../src/components/FeaturedCarousel';
import CategoryFilters from '../../src/components/CategoryFilters';
import ProductGrid from '../../src/components/ProductGrid';
import ProductModal from '../../src/components/ProductModal';
import CartDrawer from '../../src/components/CartDrawer';
import { CONFIG } from '../../src/config';

export default function CatalogClient({ initialProducts }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductTone, setSelectedProductTone] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Inicializar carrito desde localStorage una vez montado el cliente
  useEffect(() => {
    const saved = localStorage.getItem('bella_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar el carrito", e);
      }
    }
    setMounted(true);
  }, []);

  // Sincronizar carrito con localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bella_cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const handleAddToCart = (product, selectedTone) => {
    setCart((prev) => {
      const itemKey = `${product.id}_${selectedTone?.id || 'default'}`;
      const existing = prev.find(item => item.key === itemKey);
      if (existing) {
        return prev.map(item => item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        key: itemKey,
        productId: product.id,
        toneId: selectedTone?.id || null,
        productName: product.name,
        toneName: selectedTone?.name || '',
        price: product.price,
        quantity: 1,
        image: selectedTone?.image || product.mainImage
      }];
    });
  };

  const handleUpdateQuantity = (key, delta) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.key === key) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleCheckout = () => {
    const numberFormatter = new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision
    });

    let message = `¡Hola, ${CONFIG.brandName}! 💄✨ Me gustaría realizar el siguiente pedido:\n\n🛍️ *Detalle de mi compra:*\n`;

    cart.forEach((item) => {
      const itemTotal = numberFormatter.format(item.price * item.quantity);
      const toneStr = item.toneName ? ` (${item.toneName})` : '';
      message += `• ${item.quantity} x ${item.productName}${toneStr} — ${itemTotal}\n`;
    });

    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n💵 *Total a pagar:* ${numberFormatter.format(totalValue)} ${CONFIG.currency.code}\n`;
    message += `\n👇 ¿Me confirmas disponibilidad para coordinar el pago y el envío a ${CONFIG.defaultCity}? 🌸`;

    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = CONFIG.whatsappNumber.replace('+', '').replace(/\s+/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  const handleProductCardClick = (product, tone) => {
    setSelectedProduct(product);
    setSelectedProductTone(tone);
  };

  const filteredProducts = activeCategory === 'todos'
    ? initialProducts
    : initialProducts.filter(p => p.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '70px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: '40px' }}>
        <FeaturedCarousel
          products={initialProducts}
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
      </main>

      {/* Footer */}
      <footer style={{
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
