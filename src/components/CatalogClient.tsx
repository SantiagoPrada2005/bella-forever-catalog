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
import { getCustomerCookie } from '../utils/cookie';
import type { ProductWithRelations, Category, Tone } from '../db/schema';
import { applyMetaAdvancedMatching, trackEvent } from '../lib/analytics';

export interface CatalogClientProps {
  initialProducts?: ProductWithRelations[];
  initialCategories?: Category[];
  initialProductId?: string | null;
  initialToneId?: string | null;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesProductSearch(
  product: ProductWithRelations,
  activeCategory: string,
  normalizedQuery: string
): boolean {
  const matchesCategory = activeCategory === 'todos' || product.category === activeCategory;
  if (!matchesCategory) return false;
  if (!normalizedQuery) return true;

  const inName = normalizeSearchText(product.name).includes(normalizedQuery);
  const inDesc = normalizeSearchText(product.description).includes(normalizedQuery);
  const inCategory = normalizeSearchText(product.category).includes(normalizedQuery);
  const inTones = Boolean(
    product.tones?.some((t) => normalizeSearchText(t.name).includes(normalizedQuery))
  );

  return inName || inDesc || inCategory || inTones;
}

function syncCatalogUrl(
  nextCategory: string,
  nextProductId: string | null,
  nextToneId: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (nextCategory && nextCategory !== 'todos') {
      params.set('categoria', nextCategory);
    } else {
      params.delete('categoria');
    }

    if (nextProductId) {
      params.set('producto', nextProductId);
      if (nextToneId) {
        params.set('tono', nextToneId);
      } else {
        params.delete('tono');
      }
    } else {
      params.delete('producto');
      params.delete('tono');
    }

    const queryStr = params.toString();
    const nextRelativeUrl = `${url.pathname}${queryStr ? `?${queryStr}` : ''}${url.hash}`;
    window.history.replaceState(null, '', nextRelativeUrl);
  } catch {
    // Ignorar errores de History API en entornos restringidos
  }
}

function resolveInitialDeepLink(
  products: ProductWithRelations[],
  initialProductId: string | null,
  initialToneId: string | null
): { product: ProductWithRelations | null; tone: Tone | null } {
  if (products.length === 0) {
    return { product: null, tone: null };
  }
  const urlParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetProductId = initialProductId || urlParams?.get('producto')?.trim() || null;
  if (!targetProductId) {
    return { product: null, tone: null };
  }

  const targetProduct = products.find((p) => p.id === targetProductId) ?? null;
  if (!targetProduct) {
    return { product: null, tone: null };
  }

  const targetToneId = initialToneId || urlParams?.get('tono')?.trim() || null;
  const matchedTone = targetToneId
    ? targetProduct.tones?.find((t) => t.id === targetToneId)
    : undefined;
  const targetTone = matchedTone ?? targetProduct.tones?.[0] ?? null;

  return { product: targetProduct, tone: targetTone };
}

export default function CatalogClient({
  initialProducts = [],
  initialCategories = [],
  initialProductId = null,
  initialToneId = null,
}: CatalogClientProps) {
  const [initialDeepLink] = useState(() =>
    resolveInitialDeepLink(initialProducts, initialProductId, initialToneId)
  );
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
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(
    initialDeepLink.product
  );
  const [selectedProductTone, setSelectedProductTone] = useState<Tone | null>(
    initialDeepLink.tone
  );
  const [cartToast, setCartToast] = useState<CartToastItem | null>(null);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitAnalyticsRef = useRef(false);
  const lastTrackedSearchRef = useRef('');

  useEffect(() => {
    return () => {
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (didInitAnalyticsRef.current) return;
    didInitAnalyticsRef.current = true;

    const savedCustomer = getCustomerCookie();
    if (savedCustomer) {
      applyMetaAdvancedMatching(savedCustomer);
    }

    if (initialDeepLink.product) {
      trackEvent({
        name: 'view_item',
        product: {
          id: initialDeepLink.product.id,
          toneId: initialDeepLink.tone?.id || null,
          name: initialDeepLink.product.name,
          price: initialDeepLink.product.price,
          category: initialDeepLink.product.category,
          tone: initialDeepLink.tone?.name || null,
        },
      });
    }
  }, [initialDeepLink]);

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
          category: product.category,
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
        toneId: selectedTone?.id || null,
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

  const filteredProducts = initialProducts.filter((p) =>
    matchesProductSearch(p, activeCategory, normalizedQuery)
  );

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      lastTrackedSearchRef.current = '';
      return;
    }

    const searchKey = `${activeCategory}:${normalizedQuery}`;
    if (searchKey === lastTrackedSearchRef.current) return;

    const timer = setTimeout(() => {
      lastTrackedSearchRef.current = searchKey;
      const matchedIds = initialProducts
        .filter((p) => matchesProductSearch(p, activeCategory, normalizedQuery))
        .map((p) => p.tones?.[0]?.id || p.id);

      trackEvent({
        name: 'search',
        query: searchQuery.trim(),
        category: activeCategory,
        productIds: matchedIds.slice(0, 20),
        resultsCount: matchedIds.length,
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery, normalizedQuery, activeCategory, initialProducts]);

  const baseCategories =
    initialCategories.length > 0
      ? initialCategories.map((c) => ({ id: c.slug, name: c.name }))
      : CONFIG.categories;

  const activeCategoryLabel =
    activeCategory === 'todos'
      ? 'de Estudio'
      : baseCategories.find((c) => c.id === activeCategory)?.name || activeCategory;

  const handleCategoryChange = (nextCategory: string) => {
    setActiveCategory(nextCategory);
    syncCatalogUrl(nextCategory, selectedProduct?.id ?? null, selectedProductTone?.id ?? null);

    if (nextCategory !== 'todos') {
      const categoryLabel =
        baseCategories.find((c) => c.id === nextCategory)?.name || nextCategory;
      const productIds = initialProducts
        .filter((p) => p.category === nextCategory)
        .slice(0, 20)
        .map((p) => p.tones?.[0]?.id || p.id);

      trackEvent({
        name: 'view_category',
        category: nextCategory,
        categoryLabel,
        productIds,
      });
    }
  };

  const handleOpenProductModal = (
    product: ProductWithRelations,
    defaultTone: Tone | null = null
  ) => {
    const targetTone =
      defaultTone ||
      (product.tones && product.tones.length > 0 ? product.tones[0] ?? null : null);
    setSelectedProduct(product);
    setSelectedProductTone(targetTone);
    syncCatalogUrl(activeCategory, product.id, targetTone?.id ?? null);

    trackEvent({
      name: 'view_item',
      product: {
        id: product.id,
        toneId: targetTone?.id || null,
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
    syncCatalogUrl(activeCategory, null, null);
  };

  const handleModalToneChange = (product: ProductWithRelations, tone: Tone) => {
    setSelectedProductTone(tone);
    syncCatalogUrl(activeCategory, product.id, tone.id);

    trackEvent({
      name: 'view_item',
      skipDb: true,
      product: {
        id: product.id,
        toneId: tone.id,
        name: product.name,
        price: product.price,
        category: product.category,
        tone: tone.name,
      },
    });
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
          onCategoryChange={handleCategoryChange}
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
          onSelectCategory={handleCategoryChange}
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
          onToneChange={handleModalToneChange}
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
