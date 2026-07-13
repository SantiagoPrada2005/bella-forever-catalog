# Luxury Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire "Bella Forever" cosmetic catalog website into a dark-themed luxury editorial layout, including premium GSAP animations, optimized mobile responsiveness, a new asymmetrical hero banner, a horizontal featured slider, and a bottom sheet detailed product drawer.

**Architecture:** We will replace base CSS tokens with dark luxury properties, build three new presentation components for the layout (EditorialHero, FeaturedCarousel, BrandStory), adapt existing modules to look premium, and integrate optimized GSAP triggers for mobile touch compatibility.

**Tech Stack:** React 19, Vite, GSAP 3, @gsap/react, Vanilla CSS.

## Global Constraints
*   All colors must follow the Luxury Dark Mode palette (Base `#0A0405`, Panels `#12090B`, Accent Burgundy `#5A1623`, Satin Gold `#D7B06A`, and Rose Highlights `#F6D6D9`).
*   The web typography must pair Cormorant Garamond (headings) and Outfit (body).
*   All hover-dependent effects (like magnetic buttons and pointer shimmers) must be disabled on mobile via `@media (hover: hover)` or touch detection to ensure zero layout-jump or visual stuttering.
*   Mobile viewport sizes must show a 2-column product grid and bottom sheet modales, and use native touch swiping with CSS snap points for carousels.

---

### Task 1: Setup Luxury Dark Theme Tokens & Global Styles

**Files:**
*   Modify: `src/index.css`

**Interfaces:**
*   Consumes: Google Font imports from `index.html` (already present).
*   Produces: Luxury dark custom properties, global scroll styles, and shimmer keyframes.

- [ ] **Step 1: Update variables and styles in `src/index.css`**
    Modify [index.css](file:///Users/santiago/proyectos/bella-catalog/src/index.css) to replace the light variables and setup dark base styling.

    Replace the entire content of `src/index.css` with:
    ```css
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      /* Paleta Bella Forever Luxury Dark Mode */
      --color-bg-dark: #0A0405;
      --color-panel-dark: #12090B;
      --color-burgundy: #5A1623;
      --color-burgundy-light: #7E2636;
      --color-burgundy-dark: #3D0D16;
      --color-gold: #D7B06A;
      --color-gold-hover: #E8C17F;
      --color-pastel-pink: #F6D6D9;
      --color-makeup-pink: #DDA3A9;
      --color-white: #FFFFFF;
      
      /* Tonos de texto */
      --color-text-light: #FCF9F9;
      --color-text-muted: #A39092;
      
      /* Fuentes */
      --font-serif: 'Cormorant Garamond', serif;
      --font-sans: 'Outfit', sans-serif;
      
      /* Acabados y Sombras */
      --shadow-premium: 0 15px 45px rgba(0, 0, 0, 0.4);
      --shadow-hover: 0 20px 55px rgba(90, 22, 35, 0.2);
      --shadow-gold: 0 4px 20px rgba(215, 176, 106, 0.15);
      --border-glass: 1px solid rgba(215, 176, 106, 0.12);
      --radius-premium: 16px;
      --radius-pill: 9999px;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--color-bg-dark);
      color: var(--color-text-light);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    /* Ocultar barra de scroll */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Mancha de brillo difuminada de fondo */
    .bg-makeup-blur {
      position: fixed;
      width: 60vw;
      height: 60vw;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(90, 22, 35, 0.25) 0%, rgba(215, 176, 106, 0.03) 70%, rgba(0,0,0,0) 100%);
      filter: blur(100px);
      z-index: -1;
      pointer-events: none;
      opacity: 0.8;
    }

    .bg-makeup-blur-1 {
      top: -15%;
      right: -10%;
    }

    .bg-makeup-blur-2 {
      bottom: -15%;
      left: -10%;
    }

    /* Brillo satinado shimmer diagonal */
    .satin-shimmer-container {
      position: relative;
      overflow: hidden;
    }

    .satin-shimmer-container::after {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(215, 176, 106, 0.2), transparent);
      transform: skewX(-25deg);
      pointer-events: none;
      transition: 0s;
    }

    @media (hover: hover) {
      .satin-shimmer-container:hover::after {
        left: 150%;
        transition: left 0.9s cubic-bezier(0.25, 1, 0.5, 1);
      }
    }

    /* Scrollbar premium oscura */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--color-bg-dark);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--color-burgundy);
      border-radius: 4px;
      border: 2px solid var(--color-bg-dark);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--color-gold);
    }

    /* Estilos del Bottom Sheet para móvil */
    .bottom-sheet-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .bottom-sheet-content {
      background: var(--color-panel-dark);
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border-top: var(--border-glass);
      border-left: var(--border-glass);
      border-right: var(--border-glass);
    }

    @media (min-width: 768px) {
      .bottom-sheet-overlay {
        align-items: center;
      }
      .bottom-sheet-content {
        border-radius: var(--radius-premium);
        max-width: 680px;
        border: var(--border-glass);
        max-height: 85vh;
      }
    }
    ```

- [ ] **Step 2: Run a quick build to verify the CSS changes compilation**
    Run: `bun run build`
    Expected: Passes without errors.

- [ ] **Step 3: Commit styles**
    ```bash
    git add src/index.css
    git commit -m "feat: setup luxury dark theme css tokens"
    ```

---

### Task 2: Implement Editorial Components

**Files:**
*   Create: `src/components/EditorialHero.jsx`
*   Create: `src/components/BrandStory.jsx`

**Interfaces:**
*   `EditorialHero` consumes no props. Displays header text and products intro.
*   `BrandStory` consumes no props. Displays a centered text quote.

- [ ] **Step 1: Create `src/components/EditorialHero.jsx`**
    Write [EditorialHero.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/EditorialHero.jsx):
    ```jsx
    import React, { useRef } from 'react';
    import { useGSAP } from '@gsap/react';
    import gsap from 'gsap';

    export default function EditorialHero() {
      const containerRef = useRef();

      useGSAP(() => {
        gsap.fromTo('.hero-fade-up', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, stagger: 0.15, duration: 1.2, ease: 'power3.out' }
        );
        gsap.fromTo('.hero-img-left',
          { opacity: 0, scale: 0.95, y: 20 },
          { opacity: 0.9, scale: 1, y: 0, duration: 1.4, delay: 0.2, ease: 'power2.out' }
        );
        gsap.fromTo('.hero-img-right',
          { opacity: 0, scale: 0.95, y: -20 },
          { opacity: 1, scale: 1, y: 0, duration: 1.4, delay: 0.4, ease: 'power2.out' }
        );
      }, { scope: containerRef });

      const handleScrollToGrid = () => {
        const grid = document.getElementById('catalog-grid-section');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth' });
        }
      };

      return (
        <section 
          ref={containerRef}
          style={{
            marginTop: '70px',
            padding: '80px 24px 60px 24px',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'center'
          }} className="editorial-hero-grid">
            <style>{`
              @media (min-width: 768px) {
                .editorial-hero-grid {
                  grid-template-columns: 1.2fr 1fr !important;
                }
              }
            `}</style>
            
            <div style={{ zIndex: 2 }}>
              <span className="hero-fade-up" style={{
                color: 'var(--color-gold)',
                fontSize: '0.85rem',
                fontWeight: '600',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px'
              }}>
                Boutique de Belleza
              </span>
              <h1 className="hero-fade-up" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                line-height: '1.05',
                color: 'var(--color-white)',
                marginBottom: '20px',
                fontWeight: '300'
              }}>
                Revela tu <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>brillo</span> natural
              </h1>
              <p className="hero-fade-up" style={{
                color: 'var(--color-text-muted)',
                fontSize: '1.05rem',
                lineHeight: '1.6',
                marginBottom: '32px',
                maxWidth: '520px'
              }}>
                Cosméticos seleccionados para una belleza elegante, femenina y de alta tendencia. Encuentra tu dosis diaria de color e inspírate.
              </p>
              <div className="hero-fade-up">
                <button 
                  onClick={handleScrollToGrid}
                  style={{
                    backgroundColor: 'var(--color-burgundy)',
                    color: 'var(--color-white)',
                    border: '1px solid var(--color-gold)',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    boxShadow: 'var(--shadow-gold)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
                >
                  EXPLORAR CATÁLOGO
                </button>
              </div>
            </div>

            {/* Composición asimétrica de imágenes */}
            <div style={{
              position: 'relative',
              height: '320px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Imagen izquierda (atrás) */}
              <div className="hero-img-left" style={{
                position: 'absolute',
                left: '5%',
                bottom: '10%',
                width: '55%',
                height: '240px',
                borderRadius: 'var(--radius-premium)',
                overflow: 'hidden',
                border: 'var(--border-glass)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                zIndex: 1
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop" 
                  alt="Bella Makeup" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Imagen derecha (delante) */}
              <div className="hero-img-right" style={{
                position: 'absolute',
                right: '5%',
                top: '5%',
                width: '50%',
                height: '220px',
                borderRadius: 'var(--radius-premium)',
                overflow: 'hidden',
                border: '1px solid var(--color-gold)',
                boxShadow: '0 25px 45px rgba(0,0,0,0.7)',
                zIndex: 2
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop" 
                  alt="Bella Eyelash Kit" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </section>
      );
    }
    ```

- [ ] **Step 2: Create `src/components/BrandStory.jsx`**
    Write [BrandStory.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/BrandStory.jsx):
    ```jsx
    import React from 'react';

    export default function BrandStory() {
      return (
        <section style={{
          padding: '60px 24px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(90, 22, 35, 0.15) 50%, transparent 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderTop: 'var(--border-glass)',
          borderBottom: 'var(--border-glass)'
        }}>
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
            zIndex: 2,
            position: 'relative'
          }}>
            <span style={{
              color: 'var(--color-gold)',
              fontSize: '0.75rem',
              fontWeight: '600',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '16px'
            }}>
              Nuestra Filosofía
            </span>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
              fontStyle: 'italic',
              lineHeight: '1.35',
              color: 'var(--color-white)',
              marginBottom: '16px',
              fontWeight: '300'
            }}>
              "Tu dosis diaria de brillo y color"
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              By Silvy Loaiza
            </p>
          </div>
        </section>
      );
    }
    ```

- [ ] **Step 3: Commit editorial components**
    ```bash
    git add src/components/EditorialHero.jsx src/components/BrandStory.jsx
    git commit -m "feat: add EditorialHero and BrandStory editorial components"
    ```

---

### Task 3: Implement Featured Carousel

**Files:**
*   Create: `src/components/FeaturedCarousel.jsx`

**Interfaces:**
*   `FeaturedCarousel` consumes:
    *   `products`: Array of product objects.
    *   `onProductClick`: Function triggered when a card is clicked (receives `product`, `selectedTone`).
    *   `onAddToCart`: Function triggered when add-to-cart button is pressed (receives `product`, `selectedTone`).

- [ ] **Step 1: Create `src/components/FeaturedCarousel.jsx`**
    Write [FeaturedCarousel.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/FeaturedCarousel.jsx):
    ```jsx
    import React from 'react';
    import { CONFIG } from '../config';

    export default function FeaturedCarousel({ products, onProductClick, onAddToCart }) {
      // Filtrar productos destacados o nuevos
      const featured = products.filter(p => p.isFeatured || p.isNew);

      if (featured.length === 0) return null;

      const formatPrice = (price) => {
        return new Intl.NumberFormat(CONFIG.currency.locale, {
          style: 'currency',
          currency: CONFIG.currency.code,
          maximumFractionDigits: CONFIG.currency.precision
        }).format(price);
      };

      return (
        <section style={{
          padding: '60px 0 60px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          <div style={{
            paddingRight: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              fontWeight: '300',
              color: 'var(--color-white)'
            }}>
              Colección <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Destacada</span>
            </h2>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '1px'
            }}>
              Desliza para explorar →
            </span>
          </div>

          {/* Carrusel táctil nativo en móvil */}
          <div 
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingRight: '24px',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              paddingBottom: '20px'
            }} 
            className="no-scrollbar"
          >
            {featured.map((product) => {
              const defaultTone = product.tones && product.tones.length > 0 ? product.tones[0] : null;
              const cardImage = defaultTone?.image || product.mainImage;

              return (
                <div 
                  key={product.id}
                  onClick={() => onProductClick(product, defaultTone)}
                  style={{
                    flex: '0 0 280px',
                    scrollSnapAlign: 'start',
                    background: 'var(--color-panel-dark)',
                    borderRadius: 'var(--radius-premium)',
                    border: 'var(--border-glass)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-premium)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease'
                  }}
                  className="satin-shimmer-container"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
                  }}
                >
                  <div style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    background: '#180f12'
                  }}>
                    <img 
                      src={cardImage} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {product.isNew && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: 'var(--color-gold)',
                        color: 'var(--color-burgundy)',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        textTransform: 'uppercase'
                      }}>
                        Nuevo
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '400',
                    color: 'var(--color-text-light)',
                    marginBottom: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {product.name}
                  </h3>

                  <p style={{
                    color: 'var(--color-gold)',
                    fontWeight: '700',
                    fontSize: '1.15rem',
                    marginBottom: '16px'
                  }}>
                    {formatPrice(product.price)}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product, defaultTone);
                    }}
                    style={{
                      marginTop: 'auto',
                      backgroundColor: 'var(--color-burgundy)',
                      color: 'var(--color-white)',
                      border: 'none',
                      padding: '10px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Agregar al pedido
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      );
    }
    ```

- [ ] **Step 2: Commit carousel**
    ```bash
    git add src/components/FeaturedCarousel.jsx
    git commit -m "feat: add FeaturedCarousel responsive slider component"
    ```

---

### Task 4: Update Header & App Grid Integration

**Files:**
*   Modify: `src/components/Header.jsx`
*   Modify: `src/App.jsx`

**Interfaces:**
*   `Header` API stays identical. Restyled visually.
*   `App` coordinates state as before, rendering the new components in correct sequence.

- [ ] **Step 1: Modify `src/components/Header.jsx`**
    Rewrite [Header.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/Header.jsx) to make it transparent, dark esmerilado, and luxury gold.

    Replace the entire file with:
    ```jsx
    import React from 'react';
    import { CONFIG } from '../config';

    export default function Header({ cartCount, onCartClick }) {
      return (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '70px',
          backgroundColor: 'rgba(10, 4, 5, 0.82)',
          backdropFilter: 'blur(16px)',
          borderBottom: 'var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/isotipo.png" 
              alt="Bella Forever Isotipo" 
              style={{ height: '36px', objectFit: 'contain' }} 
            />
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: '600',
              color: 'var(--color-gold)',
              letterSpacing: '2px'
            }}>
              BELLA FOREVER
            </span>
          </div>
          
          <button 
            onClick={onCartClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: '8px',
              color: 'var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                border: '1px solid var(--color-gold)',
                boxShadow: 'var(--shadow-gold)'
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </header>
      );
    }
    ```

- [ ] **Step 2: Modify `src/App.jsx`**
    Rewrite [App.jsx](file:///Users/santiago/proyectos/bella-catalog/src/App.jsx) to import the new components and restructure the home page layout. Set an anchor ID `catalog-grid-section` for scrolling.

    Replace the entire file with:
    ```jsx
    import React, { useState, useEffect } from 'react';
    import Header from './components/Header';
    import EditorialHero from './components/EditorialHero';
    import BrandStory from './components/BrandStory';
    import FeaturedCarousel from './components/FeaturedCarousel';
    import CategoryFilters from './components/CategoryFilters';
    import ProductGrid from './components/ProductGrid';
    import ProductModal from './components/ProductModal';
    import CartDrawer from './components/CartDrawer';
    import productsData from './data/products.json';
    import { CONFIG } from './config';

    export default function App() {
      const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('bella_cart');
        return saved ? JSON.parse(saved) : [];
      });
      const [activeCategory, setActiveCategory] = useState('todos');
      const [selectedProduct, setSelectedProduct] = useState(null);
      const [selectedProductTone, setSelectedProductTone] = useState(null);
      const [isCartOpen, setIsCartOpen] = useState(false);

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
          }).filter(Boolean);
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
        const cleanNumber = CONFIG.whatsappNumber.replace('+', '').replace(/\s+/g, '');
        const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        
        window.open(url, '_blank');
      };

      const filteredProducts = activeCategory === 'todos' 
        ? productsData 
        : productsData.filter(p => p.category === activeCategory);

      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '40px', backgroundColor: 'var(--color-bg-dark)' }}>
          {/* Brillos difuminados */}
          <div className="bg-makeup-blur bg-makeup-blur-1" />
          <div className="bg-makeup-blur bg-makeup-blur-2" />
          
          <Header 
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
            onCartClick={() => setIsCartOpen(true)} 
          />
          
          <main style={{ flex: '1 0 auto' }}>
            <EditorialHero />
            
            <BrandStory />
            
            <FeaturedCarousel 
              products={productsData} 
              onProductClick={handleProductCardClick} 
              onAddToCart={handleAddToCart}
            />

            <div id="catalog-grid-section" style={{ padding: '40px 0 20px 0' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                textAlign: 'center',
                fontWeight: '300',
                color: 'var(--color-white)',
                marginBottom: '10px'
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
          </main>

          {/* Modal de Detalle / Bottom Sheet */}
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
          
          <footer style={{
            marginTop: '60px',
            padding: '40px 24px',
            borderTop: 'var(--border-glass)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            backgroundColor: 'rgba(18, 9, 11, 0.4)',
            backdropFilter: 'blur(10px)',
            zIndex: 50
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
    ```

- [ ] **Step 3: Modify `CategoryFilters.jsx` to adapt styles**
    Modify [CategoryFilters.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/CategoryFilters.jsx) to make it premium dark and gold.

    Replace the entire file content with:
    ```jsx
    import React from 'react';
    import { CONFIG } from '../config';

    export default function CategoryFilters({ activeCategory, onCategoryChange }) {
      return (
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '16px 24px 24px 24px',
          gap: '12px',
          whiteSpace: 'nowrap',
          maxWidth: '1200px',
          margin: '0 auto',
          justifyContent: 'flex-start'
        }} className="no-scrollbar filters-container">
          <style>{`
            @media (min-width: 768px) {
              .filters-container {
                justify-content: center !important;
              }
            }
          `}</style>
          {CONFIG.categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1px solid var(--color-gold)' : '1px solid rgba(215, 176, 106, 0.15)',
                  backgroundColor: isActive ? 'var(--color-burgundy)' : 'var(--color-panel-dark)',
                  color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: '500',
                  fontSize: '0.85rem',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? 'var(--shadow-gold)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-gold)';
                    e.currentTarget.style.borderColor = 'var(--color-gold)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.15)';
                  }
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      );
    }
    ```

- [ ] **Step 4: Verify integration with build**
    Run: `bun run build`
    Expected: Passes without errors.

- [ ] **Step 5: Commit updates**
    ```bash
    git add src/components/Header.jsx src/App.jsx src/components/CategoryFilters.jsx
    git commit -m "feat: integrate editorial visual flow and updated navigation"
    ```

---

### Task 5: Update Product Card & Detail Bottom Sheet

**Files:**
*   Modify: `src/components/ProductCard.jsx`
*   Modify: `src/components/ProductModal.jsx`

**Interfaces:**
*   `ProductCard` and `ProductModal` consumer/producer props APIs remain the same. Restyled for responsive sheets and magnet hovers.

- [ ] **Step 1: Modify `src/components/ProductCard.jsx`**
    Rewrite [ProductCard.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ProductCard.jsx) to add:
    1. Satin Shimmer container class (`satin-shimmer-container`).
    2. Dark panels styling.
    3. Custom GSAP magnetic hook/effect on the Add Button.
    4. Touch screen check using media queries to bypass magnetic hooks on mobile.
    5. Adaptive 2-column mobile layout styling.

    Replace the entire file with:
    ```jsx
    import React, { useState, useRef, useEffect } from 'react';
    import { CONFIG } from '../config';
    import gsap from 'gsap';

    export default function ProductCard({ product, onProductClick, onAddToCart }) {
      const [selectedTone, setSelectedTone] = useState(product.tones && product.tones.length > 0 ? product.tones[0] : null);
      const buttonRef = useRef();

      const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
        style: 'currency',
        currency: CONFIG.currency.code,
        maximumFractionDigits: CONFIG.currency.precision
      }).format(product.price);

      const currentImage = selectedTone?.image || product.mainImage;

      const handleAdd = (e) => {
        e.stopPropagation();
        onAddToCart(product, selectedTone);
      };

      // Efecto Magnético para el botón - solo en dispositivos con puntero (no táctil)
      useEffect(() => {
        const btn = buttonRef.current;
        if (!btn) return;

        // Comprobar si el dispositivo soporta hover (desktop)
        const isHoverSupported = window.matchMedia('(hover: hover)').matches;
        if (!isHoverSupported) return;

        const onMouseMove = (e) => {
          const bound = btn.getBoundingClientRect();
          const btnX = bound.left + bound.width / 2;
          const btnY = bound.top + bound.height / 2;
          const distX = e.clientX - btnX;
          const distY = e.clientY - btnY;
          const dist = Math.sqrt(distX * distX + distY * distY);

          if (dist < 70) {
            gsap.to(btn, {
              x: distX * 0.25,
              y: distY * 0.25,
              duration: 0.3,
              ease: 'power2.out'
            });
          } else {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        };

        const onMouseLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1.1, 0.4)'
          });
        };

        window.addEventListener('mousemove', onMouseMove);
        btn.addEventListener('mouseleave', onMouseLeave);

        return () => {
          window.removeEventListener('mousemove', onMouseMove);
          if (btn) btn.removeEventListener('mouseleave', onMouseLeave);
        };
      }, [product]);

      return (
        <div 
          onClick={() => onProductClick(product, selectedTone)}
          style={{
            backgroundColor: 'var(--color-panel-dark)',
            borderRadius: 'var(--radius-premium)',
            boxShadow: 'var(--shadow-premium)',
            border: 'var(--border-glass)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, border-color 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            height: '100%'
          }}
          className="satin-shimmer-container"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'var(--color-gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
          }}
        >
          {/* Imagen del Producto */}
          <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
            <img 
              src={currentImage} 
              alt={product.name} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
            {product.isNew && (
              <span style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-burgundy)',
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>
                Nuevo
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <h3 style={{ 
              fontSize: '1.05rem', 
              fontWeight: '400', 
              marginBottom: '6px',
              textOverflow: 'ellipsis', 
              overflow: 'hidden', 
              whiteSpace: 'nowrap',
              color: 'var(--color-text-light)'
            }}>
              {product.name}
            </h3>
            
            <p style={{ 
              color: 'var(--color-gold)', 
              fontWeight: '700', 
              fontSize: '1.15rem', 
              marginBottom: '14px' 
            }}>
              {formattedPrice}
            </p>

            {/* Tonos */}
            {product.tones && product.tones.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '8px', 
                marginBottom: '16px' 
              }} onClick={(e) => e.stopPropagation()}>
                {product.tones.map((tone) => {
                  const isSelected = selectedTone?.id === tone.id;
                  return (
                    <button
                      key={tone.id}
                      title={tone.name}
                      onClick={() => setSelectedTone(tone)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: tone.hex,
                        border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
                        cursor: tone.inStock ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        opacity: tone.inStock ? 1 : 0.3
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Botón de Agregar */}
            <button 
              ref={buttonRef}
              onClick={handleAdd}
              disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
              style={{
                marginTop: 'auto',
                width: '100%',
                backgroundColor: product.inStock ? 'var(--color-burgundy)' : 'rgba(255, 255, 255, 0.05)',
                color: product.inStock ? 'var(--color-white)' : 'var(--color-text-muted)',
                border: product.inStock ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.05)',
                padding: '11px 0',
                borderRadius: '8px',
                cursor: product.inStock ? 'pointer' : 'default',
                fontWeight: '600',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (product.inStock) {
                  e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (product.inStock) {
                  e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
                }
              }}
            >
              {product.inStock ? 'Agregar al pedido' : 'Agotado'}
            </button>
          </div>
        </div>
      );
    }
    ```

- [ ] **Step 2: Modify `ProductGrid.jsx` to show 2 columns on mobile**
    Modify [ProductGrid.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ProductGrid.jsx) to make it load in 2 columns on small viewports instead of 1.

    Replace the return container styles with class-based responsive grid.
    Replace the entire content of `src/components/ProductGrid.jsx` with:
    ```jsx
    import React, { useRef } from 'react';
    import ProductCard from './ProductCard';
    import { useGSAP } from '@gsap/react';
    import gsap from 'gsap';

    export default function ProductGrid({ products, onProductClick, onAddToCart }) {
      const gridRef = useRef();

      useGSAP(() => {
        gsap.fromTo('.product-card-anim', 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out' }
        );
      }, { dependencies: [products], scope: gridRef });

      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 48px 16px' }}>
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
            <div>
              <style>{`
                .catalog-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr) !important;
                  gap: 16px !important;
                }
                @media (min-width: 768px) {
                  .catalog-grid {
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
                    gap: 30px !important;
                  }
                }
              `}</style>
              <div 
                ref={gridRef}
                className="catalog-grid"
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
            </div>
          )}
        </div>
      );
    }
    ```

- [ ] **Step 3: Modify `src/components/ProductModal.jsx`**
    Rewrite [ProductModal.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ProductModal.jsx) to make it:
    1. A slide-up bottom sheet on mobile screens, and a standard dark luxury modal overlay on desktops.
    2. Render with deep colors and golden lines.
    3. Fully responsive.

    Replace the entire file with:
    ```jsx
    import React, { useRef, useState } from 'react';
    import { useGSAP } from '@gsap/react';
    import gsap from 'gsap';
    import { CONFIG } from '../config';

    export default function ProductModal({ product, initialTone, onClose, onAddToCart }) {
      const modalOverlay = useRef();
      const modalContent = useRef();
      const [selectedTone, setSelectedTone] = useState(initialTone || (product.tones && product.tones.length > 0 ? product.tones[0] : null));

      useGSAP(() => {
        const isMobile = !window.matchMedia('(min-width: 768px)').matches;
        
        gsap.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        
        if (isMobile) {
          // Slide up bottom sheet
          gsap.fromTo(modalContent.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
        } else {
          // Zoom-in modal
          gsap.fromTo(modalContent.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' });
        }
      }, { scope: modalOverlay });

      const handleClose = () => {
        const isMobile = !window.matchMedia('(min-width: 768px)').matches;
        
        if (isMobile) {
          gsap.to(modalContent.current, { y: '100%', duration: 0.3, ease: 'power3.in' });
        } else {
          gsap.to(modalContent.current, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.in' });
        }
        gsap.to(modalOverlay.current, { opacity: 0, duration: 0.3, onComplete: onClose });
      };

      if (!product) return null;

      const formattedPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
        style: 'currency',
        currency: CONFIG.currency.code,
        maximumFractionDigits: CONFIG.currency.precision
      }).format(product.price);

      return (
        <div 
          ref={modalOverlay}
          onClick={handleClose}
          className="bottom-sheet-overlay"
        >
          <div 
            ref={modalContent}
            onClick={(e) => e.stopPropagation()}
            className="bottom-sheet-content"
          >
            {/* Cabecera / Notch de arrastre en móvil */}
            <div style={{
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }} onClick={handleClose}>
              <div style={{
                width: '36px',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '2px'
              }} className="mobile-notch"></div>
              <style>{`
                @media (min-width: 768px) {
                  .mobile-notch {
                    display: none !important;
                  }
                }
              `}</style>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }} className="no-scrollbar">
              <div className="modal-inner-flex" style={{ display: 'flex', flexDirection: 'column' }}>
                <style>{`
                  @media (min-width: 768px) {
                    .modal-inner-flex {
                      flex-direction: row !important;
                    }
                    .modal-img-container {
                      width: 50% !important;
                      height: auto !important;
                      aspect-ratio: 1 !important;
                    }
                    .modal-text-container {
                      width: 50% !important;
                    }
                  }
                `}</style>

                {/* Imagen */}
                <div className="modal-img-container" style={{ position: 'relative', width: '100%', height: '280px', backgroundColor: '#1a0f12', flexShrink: 0 }}>
                  <img 
                    src={selectedTone?.image || product.mainImage} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button 
                    onClick={handleClose}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: 'rgba(18, 9, 11, 0.8)',
                      border: '1px solid rgba(215, 176, 106, 0.3)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold)',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Contenido */}
                <div className="modal-text-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '400', color: 'var(--color-white)', marginBottom: '4px' }}>
                      {product.name}
                    </h2>
                    <p style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: '700' }}>
                      {formattedPrice}
                    </p>
                  </div>
                  
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {product.description}
                  </p>

                  {/* Tonos */}
                  {product.tones && product.tones.length > 0 && (
                    <div>
                      <h4 style={{ 
                        fontSize: '0.75rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        color: 'var(--color-text-light)', 
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}>
                        Tono: <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{selectedTone?.name}</span>
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {product.tones.map((tone) => {
                          const isSelected = selectedTone?.id === tone.id;
                          return (
                            <button
                              key={tone.id}
                              title={tone.name}
                              onClick={() => setSelectedTone(tone)}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: tone.hex,
                                border: isSelected ? '2px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
                                cursor: tone.inStock ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                opacity: tone.inStock ? 1 : 0.3
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Botón */}
                  <button
                    disabled={!product.inStock || (selectedTone && !selectedTone.inStock)}
                    onClick={() => {
                      onAddToCart(product, selectedTone);
                      handleClose();
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: product.inStock ? 'var(--color-burgundy)' : 'rgba(255,255,255,0.05)',
                      color: product.inStock ? 'var(--color-white)' : 'var(--color-text-muted)',
                      border: product.inStock ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '12px 0',
                      borderRadius: '8px',
                      cursor: product.inStock ? 'pointer' : 'default',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      letterSpacing: '1px',
                      boxShadow: product.inStock ? 'var(--shadow-gold)' : 'none',
                      marginTop: '8px'
                    }}
                  >
                    {product.inStock ? 'Añadir al pedido 💄' : 'Agotado'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ```

- [ ] **Step 4: Verify layout compilation**
    Run: `bun run build`
    Expected: Passes without errors.

- [ ] **Step 5: Commit changes**
    ```bash
    git add src/components/ProductCard.jsx src/components/ProductGrid.jsx src/components/ProductModal.jsx
    git commit -m "feat: implement mobile-first bottom sheets and magnetic elements hooks"
    ```

---

### Task 6: Update Cart Drawer & Final Verification

**Files:**
*   Modify: `src/components/CartDrawer.jsx`

**Interfaces:**
*   `CartDrawer` consumes cart and checkout handlers. Updates visual details for luxury black glass backdrop.

- [ ] **Step 1: Modify `src/components/CartDrawer.jsx`**
    Rewrite [CartDrawer.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/CartDrawer.jsx) to make it premium dark and esmerilado.

    Replace the entire file with:
    ```jsx
    import React, { useRef } from 'react';
    import { useGSAP } from '@gsap/react';
    import gsap from 'gsap';
    import { CONFIG } from '../config';

    export default function CartDrawer({ cart, onClose, onUpdateQuantity, onCheckout }) {
      const drawerOverlay = useRef();
      const drawerContent = useRef();

      useGSAP(() => {
        gsap.fromTo(drawerOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(drawerContent.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' });
      }, { scope: drawerOverlay });

      const handleClose = () => {
        gsap.to(drawerContent.current, { x: '100%', duration: 0.3, ease: 'power3.in' });
        gsap.to(drawerOverlay.current, { opacity: 0, duration: 0.3, onComplete: onClose });
      };

      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const formattedTotal = new Intl.NumberFormat(CONFIG.currency.locale, {
        style: 'currency',
        currency: CONFIG.currency.code,
        maximumFractionDigits: CONFIG.currency.precision
      }).format(cartTotal);

      return (
        <div 
          ref={drawerOverlay}
          onClick={handleClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 2000
          }}
        >
          <div 
            ref={drawerContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-panel-dark)',
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.5)',
              borderLeft: 'var(--border-glass)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: 'var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: '400', color: 'var(--color-gold)' }}>
                Tu Pedido
              </h3>
              <button 
                onClick={handleClose} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.3rem', 
                  cursor: 'pointer',
                  color: 'var(--color-gold)',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }} className="no-scrollbar">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>El carrito está vacío</p>
                  <p style={{ fontSize: '0.85rem' }}>¡Agrega tus cosméticos favoritos para coordinar el envío!</p>
                </div>
              ) : (
                cart.map((item) => {
                  const formattedItemPrice = new Intl.NumberFormat(CONFIG.currency.locale, {
                    style: 'currency',
                    currency: CONFIG.currency.code,
                    maximumFractionDigits: CONFIG.currency.precision
                  }).format(item.price * item.quantity);

                  return (
                    <div 
                      key={item.key} 
                      style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '20px', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                        paddingBottom: '16px' 
                      }}
                    >
                      <img 
                        src={item.image} 
                        alt={item.productName} 
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: 'var(--border-glass)' }} 
                      />
                      
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '400', color: 'var(--color-text-light)' }}>
                            {item.productName}
                          </h4>
                          {item.toneName && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: '500', marginTop: '2px' }}>
                              💄 {item.toneName}
                            </p>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                              onClick={() => onUpdateQuantity(item.key, -1)}
                              style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '4px', 
                                border: '1px solid rgba(255,255,255,0.15)', 
                                backgroundColor: 'transparent', 
                                cursor: 'pointer',
                                color: 'var(--color-gold)',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >-</button>
                            <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.key, 1)}
                              style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '4px', 
                                border: '1px solid rgba(255,255,255,0.15)', 
                                backgroundColor: 'transparent', 
                                cursor: 'pointer',
                                color: 'var(--color-gold)',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >+</button>
                          </div>
                          
                          <p style={{ fontWeight: '600', color: 'var(--color-gold)', fontSize: '1rem' }}>
                            {formattedItemPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ 
                padding: '24px', 
                borderTop: 'var(--border-glass)', 
                backgroundColor: 'rgba(0, 0, 0, 0.2)' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '20px', 
                  fontSize: '1.2rem', 
                  fontWeight: '400',
                  fontFamily: 'var(--font-serif)'
                }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{formattedTotal}</span>
                </div>
                
                <button
                  onClick={onCheckout}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-burgundy)',
                    color: 'var(--color-white)',
                    border: '1px solid var(--color-gold)',
                    padding: '12px 0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    letterSpacing: '1px',
                    boxShadow: 'var(--shadow-gold)',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
                >
                  Confirmar pedido por WhatsApp 📱
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    ```

- [ ] **Step 2: Clean up visual companion and stop server**
    Write waiting file to terminate visual helper screen.
    Run: `/Users/santiago/.gemini/config/plugins/superpowers/skills/brainstorming/scripts/stop-server.sh /Users/santiago/proyectos/bella-catalog/.superpowers/brainstorm/15190-1783978262`

- [ ] **Step 3: Run final bundle build and double-check code output**
    Run: `bun run build`
    Expected: Vite build completes and outputs static build files in `dist` successfully.

- [ ] **Step 4: Commit changes**
    ```bash
    git add src/components/CartDrawer.jsx
    git commit -m "feat: update cart drawer to luxury dark theme and cleanup workspace"
    ```
