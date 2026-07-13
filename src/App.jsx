import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryFilters from './components/CategoryFilters';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import productsData from './data/products.json';
import { CONFIG } from './config';

export default function App() {
  // Inicialización del carrito desde localStorage
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bella_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductTone, setSelectedProductTone] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sincronizar carrito con localStorage
  useEffect(() => {
    localStorage.setItem('bella_cart', JSON.stringify(cart));
  }, [cart]);

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
      }).filter(Boolean); // Filtrar nulos si cantidad <= 0
    });
  };

  const handleProductCardClick = (product, tone) => {
    setSelectedProduct(product);
    setSelectedProductTone(tone);
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
    // wa.me usa número telefónico sin el prefijo +
    const cleanNumber = CONFIG.whatsappNumber.replace('+', '').replace(/\s+/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  const filteredProducts = activeCategory === 'todos' 
    ? productsData 
    : productsData.filter(p => p.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
      {/* Fondos difuminados decorativos tipo makeup */}
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />
      
      <Header 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <main style={{ flex: '1 0 auto' }}>
        <Hero />
        <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <ProductGrid 
          products={filteredProducts} 
          onProductClick={handleProductCardClick} 
          onAddToCart={handleAddToCart} 
        />
      </main>

      {/* Modal de Detalle de Producto */}
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

      {/* Carrito Lateral deslizable */}
      {isCartOpen && (
        <CartDrawer 
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      )}
      
      {/* Footer elegante */}
      <footer style={{
        marginTop: '60px',
        padding: '32px 24px',
        borderTop: 'var(--border-glass)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.9rem',
        backgroundColor: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 50
      }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-burgundy)', marginBottom: '8px', letterSpacing: '1px' }}>
          BELLA FOREVER
        </p>
        <p style={{ marginBottom: '6px' }}>📍 {CONFIG.defaultCity} (Valle del Cauca)</p>
        <p style={{ fontSize: '0.85rem' }}>
          By: <a href={`https://instagram.com/${CONFIG.instagramUser}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-burgundy)', fontWeight: '600', textDecoration: 'none' }}>@{CONFIG.instagramUser}</a>
        </p>
      </footer>
    </div>
  );
}
