import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import CartToast, { type CartToastItem } from './ui/CartToast';
import { BellaSunburstSeal } from './svg/BellaEditorialSvgs';
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
  const [cartToast, setCartToast] = useState<CartToastItem | null>(null);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    };
  }, []);

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

    // Disparar animación física en el Header (bounce + ping)
    setIsCartBumping(true);
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = setTimeout(() => {
      setIsCartBumping(false);
    }, 650);

    // Desplegar notificación Toast inferior
    setCartToast({
      id: Date.now(),
      productName: product.name,
      toneName: selectedTone?.name,
      price: product.price,
      image: getProductImage(product, selectedTone),
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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '70px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header 
        cartCount={totalCartCount} 
        onCartClick={() => setIsCartOpen(true)} 
        isCatalog
        isCartBumping={isCartBumping}
      />

      <main style={{ flex: '1 0 auto', paddingBottom: '60px' }}>
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px 8px 16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(90, 22, 35, 0.55) 0%, rgba(38, 8, 16, 0.85) 100%)',
            border: 'var(--border-glass)',
            borderRadius: 'var(--radius-editorial)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <BellaSunburstSeal
              size={38}
              className="bella-sunburst-seal--spin"
              style={{ color: 'var(--color-gold)' }}
            />
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)',
              fontWeight: '300',
              color: 'var(--color-white)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: '1.1',
              margin: 0,
            }}>
              Catálogo{' '}
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                textTransform: 'none',
                color: 'var(--color-gold)',
                fontSize: '1.15em',
              }}>
                Exclusivo
              </span>
            </h1>
            <p style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              maxWidth: '50ch',
              margin: 0,
              lineHeight: '1.5',
            }}>
              Selecciona tus cosméticos y tonos favoritos para coordinar tu pedido directo por WhatsApp.
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '4px',
            }}>
              <span className="poster-micro-tag" style={{ color: 'var(--color-pastel-pink)' }}>
                CURADURÍA PREMIUM
              </span>
              <span className="poster-micro-tag" style={{ color: 'var(--color-gold)' }}>
                ROLDANILLO &amp; ENVÍOS
              </span>
            </div>
          </div>
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

      <CartToast
        notification={cartToast}
        onClose={() => setCartToast(null)}
        onOpenCart={() => {
          setCartToast(null);
          setIsCartOpen(true);
        }}
      />

      <footer style={{
        padding: '36px 24px',
        borderTop: 'var(--border-glass)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.82rem',
        backgroundColor: 'rgba(18, 9, 11, 0.55)',
        backdropFilter: 'blur(12px)',
      }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-gold)', marginBottom: '6px', letterSpacing: '0.16em' }}>
          BELLA FOREVER
        </p>
        <p style={{ marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
          {CONFIG.defaultCity} · Valle del Cauca
        </p>
        <p style={{ fontSize: '0.78rem' }}>
          Curaduría por <a href={`https://instagram.com/${CONFIG.instagramUser}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)', fontWeight: '600', textDecoration: 'none' }}>@{CONFIG.instagramUser}</a>
        </p>
      </footer>
    </div>
  );
}
