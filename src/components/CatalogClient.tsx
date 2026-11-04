import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import CatalogHeroSpotlight from './CatalogHeroSpotlight';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import CartToast, { type CartToastItem } from './ui/CartToast';
import WhatsAppFloatingButton from './ui/WhatsAppFloatingButton';
import { CONFIG } from '../config';
import { getProductImage } from '../utils/image-helpers';
import type { ProductWithRelations, Category, Tone } from '../db/schema';
import { trackEvent } from '../lib/analytics';

export interface CatalogClientProps {
  initialProducts?: ProductWithRelations[];
  initialCategories?: Category[];
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function CatalogClient({
  initialProducts = [],
  initialCategories = [],
}: CatalogClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('categoria');
        if (catParam) return catParam;
      } catch {
        // Ignorar errores de lectura de URL
      }
    }
    return 'todos';
  });
  const [searchQuery, setSearchQuery] = useState('');
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

    trackEvent({
      name: 'add_to_cart',
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        tone: selectedTone?.name || null,
        quantity: 1,
      },
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

  const normalizedQuery = normalizeSearchText(searchQuery);

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const inName = normalizeSearchText(p.name).includes(normalizedQuery);
    const inDesc = normalizeSearchText(p.description).includes(normalizedQuery);
    const inCategory = normalizeSearchText(p.category).includes(normalizedQuery);
    const inTones = Boolean(
      p.tones?.some((t) => normalizeSearchText(t.name).includes(normalizedQuery))
    );

    return inName || inDesc || inCategory || inTones;
  });

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
    const targetTone =
      defaultTone ||
      (product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null);
    setSelectedProduct(product);
    setSelectedProductTone(targetTone);

    trackEvent({
      name: 'view_item',
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        tone: targetTone?.name || null,
      },
    });
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
          searchQuery={searchQuery}
          filteredCount={filteredProducts.length}
          onCategoryChange={setActiveCategory}
          onSearchChange={setSearchQuery}
        />

        <ProductGrid
          products={filteredProducts}
          categories={initialCategories}
          activeCategory={activeCategory}
          activeCategoryLabel={activeCategoryLabel}
          searchQuery={searchQuery}
          onProductClick={handleOpenProductModal}
          onAddToCart={handleAddToCart}
          onSelectCategory={setActiveCategory}
          onClearSearch={() => setSearchQuery('')}
        />
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          allProducts={initialProducts}
          initialTone={selectedProductTone}
          onClose={handleCloseProductModal}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleOpenProductModal}
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

      <WhatsAppFloatingButton
        isHidden={Boolean(selectedProduct) || isCartOpen}
        hasToastOffset={Boolean(cartToast)}
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
