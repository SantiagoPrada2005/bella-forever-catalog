import React, { useState, useEffect } from 'react';
import Header from './Header';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Category, Tone } from '../db/schema';

export interface CatalogClientProps {
  initialProducts?: ProductWithRelations[];
  initialCategories?: Category[];
}

export default function CatalogClient({
  initialProducts = [],
  initialCategories = [],
}: CatalogClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [selectedProductTone, setSelectedProductTone] = useState<Tone | null>(null);

  // Cargar carrito desde localStorage en cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bella_cart');
      if (saved) {
        setCart(JSON.parse(saved) as CartItem[]);
      }
    } catch (e: unknown) {
      console.error("Error al cargar el carrito inicial", e);
    }
    setIsCartLoaded(true);
  }, []);

  // Sincronizar carrito con localStorage tras la carga inicial
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem('bella_cart', JSON.stringify(cart));
    } catch (e: unknown) {
      console.error("Error al guardar el carrito", e);
    }
  }, [cart, isCartLoaded]);


  const handleAddToCart = (product: ProductWithRelations, selectedTone: Tone | null) => {
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
        image: getProductImage(product, selectedTone),
      }];
    });
  };

  const handleUpdateQuantity = (key: string, delta: number) => {
    setCart((prev) => {
      const updated: CartItem[] = [];
      for (const item of prev) {
        if (item.key === key) {
          const nextQty = item.quantity + delta;
          if (nextQty > 0) {
            updated.push({ ...item, quantity: nextQty });
          }
        } else {
          updated.push(item);
        }
      }
      return updated;
    });
  };

  const handleOrderCompleted = () => {
    setCart([]);
    try {
      localStorage.removeItem('bella_cart');
    } catch (e: unknown) {
      console.error("Error al limpiar carrito", e);
    }
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = activeCategory === 'todos'
    ? initialProducts
    : initialProducts.filter(p => p.category === activeCategory);

  const featuredProducts = initialProducts.filter(p => p.isFeatured);

  const handleOpenProductModal = (product: ProductWithRelations, defaultTone: Tone | null = null) => {
    setSelectedProduct(product);
    setSelectedProductTone(defaultTone || (product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null));
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
        isCatalog
      />

      <main style={{ flex: '1 0 auto', paddingBottom: '60px' }}>
        <section style={{ textAlign: 'center', padding: '36px 20px 16px 20px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '300',
            color: 'var(--color-white)',
            letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            Catálogo <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Exclusivo</span>
          </h1>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.95rem',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: '1.5',
          }}>
            Maquillaje de alta gama para realzar tu belleza. Selecciona tus productos y tonos favoritos y coordina tu pedido directo por WhatsApp.
          </p>
        </section>

        {featuredProducts.length > 0 && (
          <FeaturedCarousel 
            products={featuredProducts} 
            onProductClick={(product, tone) => handleOpenProductModal(product, tone)} 
            onAddToCart={handleAddToCart}
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
          onAddToCart={handleAddToCart}
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
          onOrderCompleted={handleOrderCompleted}
          initialProducts={initialProducts}
        />
      )}

      <footer style={{
        padding: '40px 24px',
        borderTop: 'var(--border-glass)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        backgroundColor: 'rgba(18, 9, 11, 0.4)',
        backdropFilter: 'blur(10px)',
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
