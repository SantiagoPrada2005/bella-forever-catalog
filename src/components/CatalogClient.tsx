import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import CatalogHeroSpotlight from './CatalogHeroSpotlight';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import CartToast, { type CartToastItem } from './ui/CartToast';
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bella_cart');
      if (saved) {
        setCart(JSON.parse(saved) as CartItem[]);
      }
    } catch (e: unknown) {
      console.error('Error al cargar el carrito inicial', e);
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem('bella_cart', JSON.stringify(cart));
    } catch (e: unknown) {
      console.error('Error al guardar el carrito', e);
    }
  }, [cart, isCartLoaded]);

  const handleAddToCart = (product: ProductWithRelations, selectedTone: Tone | null) => {
    setCart((prev) => {
      const itemKey = `${product.id}_${selectedTone?.id || 'default'}`;
      const existing = prev.find((item) => item.key === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          key: itemKey,
          productId: product.id,
          toneId: selectedTone?.id || null,
          productName: product.name,
          toneName: selectedTone?.name || '',
          price: product.price,
          quantity: 1,
          image: getProductImage(product, selectedTone),
        },
      ];
    });

    setIsCartBumping(true);
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = setTimeout(() => {
      setIsCartBumping(false);
    }, 650);

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
      console.error('Error al limpiar carrito', e);
    }
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts =
    activeCategory === 'todos'
      ? initialProducts
      : initialProducts.filter((p) => p.category === activeCategory);

  const baseCategories =
    initialCategories.length > 0
      ? initialCategories.map((c) => ({ id: c.slug, name: c.name }))
      : CONFIG.categories;

  const activeCategoryLabel =
    activeCategory === 'todos'
      ? 'de Estudio'
      : baseCategories.find((c) => c.id === activeCategory)?.name || activeCategory;

  const handleOpenProductModal = (
    product: ProductWithRelations,
    defaultTone: Tone | null = null
  ) => {
    setSelectedProduct(product);
    setSelectedProductTone(
      defaultTone ||
        (product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null)
    );
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
    setSelectedProductTone(null);
  };

  return (
    <div className="theme-catalog-studio">
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header
        cartCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        isCatalog
        isCartBumping={isCartBumping}
      />

      <main style={{ flex: '1 0 auto' }}>
        <CatalogHeroSpotlight
          products={initialProducts}
          onProductClick={handleOpenProductModal}
          onAddToCart={handleAddToCart}
        />

        <CategoryFilters
          categories={initialCategories}
          products={initialProducts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <ProductGrid
          products={filteredProducts}
          activeCategory={activeCategory}
          activeCategoryLabel={activeCategoryLabel}
          onProductClick={handleOpenProductModal}
          onAddToCart={handleAddToCart}
          onSelectCategory={setActiveCategory}
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

      <footer className="catalog-footer-studio">
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.35rem',
            fontWeight: 400,
            color: 'var(--catalog-accent)',
            letterSpacing: '0.16em',
            marginBottom: '6px',
          }}
        >
          BELLA FOREVER
        </p>
        <p
          style={{
            marginBottom: '6px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            color: 'var(--catalog-ink-muted)',
          }}
        >
          {CONFIG.defaultCity} · Valle del Cauca
        </p>
        <p style={{ fontSize: '0.78rem', margin: 0 }}>
          Curaduría por{' '}
          <a
            href={`https://instagram.com/${CONFIG.instagramUser}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--catalog-accent)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            @{CONFIG.instagramUser}
          </a>
        </p>
      </footer>
    </div>
  );
}
