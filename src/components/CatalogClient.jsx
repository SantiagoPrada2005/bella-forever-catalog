import React, { useState, useEffect } from 'react';
import Header from './Header';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';

export default function CatalogClient({ initialProducts = [], initialCategories = [] }) {
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
        image: getProductImage(product, selectedTone)
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

    // Append product image URLs (carousel-style: up to 4 images per item)
    const allImageUrls = [];
    cart.forEach((item) => {
      const product = initialProducts.find(p => p.id === item.productId);
      if (product) {
        const galleryUrls = (product.productImages || []).map(img => img.url);
        const imageUrl = getProductImage(product, null);
        if (galleryUrls.length > 0) {
          allImageUrls.push(...galleryUrls.slice(0, 4));
        } else if (imageUrl) {
          allImageUrls.push(imageUrl);
        }
      }
    });

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `\n💰 *Total Estimado:* ${numberFormatter.format(totalAmount)}\n`;
    message += `📍 *Ciudad de entrega:* ${CONFIG.defaultCity}\n\n¿Me confirmas disponibilidad para coordinar el pago y envío? ¡Gracias! 💕`;

    if (allImageUrls.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const formattedUrls = allImageUrls.map(url => url.startsWith('http') ? url : `${origin}${url}`);
      message += `\n\n🖼️ *Imágenes de referencia:*\n${formattedUrls.join('\n')}`;
    }

    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = activeCategory === 'todos'
    ? initialProducts
    : initialProducts.filter(p => p.category === activeCategory);

  const featuredProducts = initialProducts.filter(p => p.isFeatured);

  const handleOpenProductModal = (product, defaultTone = null) => {
    setSelectedProduct(product);
    setSelectedProductTone(defaultTone || (product.tones && product.tones.length > 0 ? product.tones[0] : null));
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
    setSelectedProductTone(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '70px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header 
        cartCount={totalCartCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />

      <main style={{ flex: '1 0 auto', paddingBottom: '60px' }}>
        {featuredProducts.length > 0 && (
          <FeaturedCarousel 
            products={featuredProducts} 
            onProductClick={(product) => handleOpenProductModal(product)} 
          />
        )}

        <CategoryFilters 
          categories={initialCategories} 
          products={initialProducts}
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />

        <ProductGrid 
          products={filteredProducts} 
          onProductClick={(product, tone) => handleOpenProductModal(product, tone)} 
        />
      </main>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          initialTone={selectedProductTone}
          onClose={handleCloseProductModal} 
          onAddToCart={handleAddToCart} 
        />
      )}

      {isCartOpen && (
        <CartDrawer 
          onClose={() => setIsCartOpen(false)} 
          cart={cart} 
          onUpdateQuantity={handleUpdateQuantity} 
          onCheckout={handleCheckout} 
        />
      )}

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
