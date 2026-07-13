# Separación de Página y Parallax Editorial - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el catálogo actual de Bella Forever en dos rutas distintas (`/` para la Landing Page y `/catalogo` para el catálogo interactivo), e incorporar una galería en parallax asimétrico usando GSAP ScrollTrigger en la Landing Page.

**Architecture:** Usaremos `react-router-dom` para enrutar las páginas. Mantendremos el estado del carrito de compras a nivel global en `App.jsx` para evitar que se pierdan productos seleccionados al cambiar de ruta, y modificaremos el Header para que oculte el carrito en el Home y lo muestre en el catálogo.

**Tech Stack:** React 19, react-router-dom, GSAP + ScrollTrigger (@gsap/react).

## Global Constraints
- Seguir el diseño de la paleta oscura luxury (var(--color-bg-dark), var(--color-gold), etc.).
- Utilizar transiciones fluidas de página y ScrollTrigger para animaciones performantes en la GPU.
- No utilizar placeholders vacíos, usar imágenes de Unsplash que coincidan con la estética del maquillaje.

---

### Task 1: Instalar react-router-dom y configurar Router base

**Files:**
- Modify: [package.json](file:///Users/santiago/proyectos/bella-catalog/package.json)
- Modify: [src/main.jsx](file:///Users/santiago/proyectos/bella-catalog/src/main.jsx)
- Modify: [src/App.jsx](file:///Users/santiago/proyectos/bella-catalog/src/App.jsx)
- Create: [src/pages/Home.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Home.jsx) [NEW]
- Create: [src/pages/Catalog.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Catalog.jsx) [NEW]

**Interfaces:**
- Consumes: Estado del carrito y productos.
- Produces: Estructura de enrutamiento con react-router-dom.

- [ ] **Step 1: Instalar react-router-dom**
  
  Ejecutar:
  ```bash
  bun install react-router-dom
  ```

- [ ] **Step 2: Configurar Router en src/main.jsx**
  
  Reemplazar el contenido de [src/main.jsx](file:///Users/santiago/proyectos/bella-catalog/src/main.jsx) para envolver la app en `BrowserRouter`.
  
  ```javascript
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { BrowserRouter } from 'react-router-dom'
  import './index.css'
  import App from './App.jsx'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { useGSAP } from '@gsap/react'

  // Registrar plugins centralizadamente
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
  ```

- [ ] **Step 3: Crear los placeholders de páginas**
  
  Crear `src/pages/Home.jsx`:
  ```javascript
  import React from 'react';
  
  export default function Home() {
    return (
      <div style={{ color: '#fff', padding: '100px 24px', textAlign: 'center' }}>
        <h1>Bella Forever | Home</h1>
      </div>
    );
  }
  ```

  Crear `src/pages/Catalog.jsx`:
  ```javascript
  import React from 'react';
  
  export default function Catalog() {
    return (
      <div style={{ color: '#fff', padding: '100px 24px', textAlign: 'center' }}>
        <h1>Bella Forever | Catálogo</h1>
      </div>
    );
  }
  ```

- [ ] **Step 4: Configurar Rutas en src/App.jsx**
  
  Modificar [src/App.jsx](file:///Users/santiago/proyectos/bella-catalog/src/App.jsx) para utilizar `<Routes>` y `<Route>`.
  
  ```javascript
  import React, { useState, useEffect } from 'react';
  import { Routes, Route } from 'react-router-dom';
  import Header from './components/Header';
  import IntroLoader from './components/IntroLoader';
  import Home from './pages/Home';
  import Catalog from './pages/Catalog';
  import productsData from './data/products.json';
  import { CONFIG } from './config';

  export default function App() {
    const [isIntroComplete, setIsIntroComplete] = useState(false);
    const [cart, setCart] = useState(() => {
      const saved = localStorage.getItem('bella_cart');
      return saved ? JSON.parse(saved) : [];
    });
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

    return (
      <>
        {!isIntroComplete && <IntroLoader onComplete={() => setIsIntroComplete(true)} />}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)' }}>
          <div className="bg-makeup-blur bg-makeup-blur-1" />
          <div className="bg-makeup-blur bg-makeup-blur-2" />

          <Header
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onCartClick={() => setIsCartOpen(true)}
          />

          <main style={{ flex: '1 0 auto' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/catalogo" 
                element={
                  <Catalog 
                    cart={cart}
                    isCartOpen={isCartOpen}
                    setIsCartOpen={setIsCartOpen}
                    handleAddToCart={handleAddToCart}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleCheckout={handleCheckout}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </>
    );
  }
  ```

- [ ] **Step 5: Confirmar que la aplicación compila y las rutas cargan**
  
  Ejecutar:
  ```bash
  bun run build
  ```
  Expected: Compilación exitosa.

---

### Task 2: Migrar y Completar la página del Catálogo (src/pages/Catalog.jsx)

**Files:**
- Modify: [src/pages/Catalog.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Catalog.jsx)

**Interfaces:**
- Consumes: Props del carrito y funciones de agregado/modificación.
- Produces: Render del catálogo con todos sus filtros, modal y drawer del carrito.

- [ ] **Step 1: Implementar lógica del catálogo en Catalog.jsx**
  
  Mover los componentes del catálogo (carousel, filtros, grid, modal, drawer y footer) a [src/pages/Catalog.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Catalog.jsx).
  
  ```javascript
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
  ```

---

### Task 3: Crear el componente de Parallax Gallery e implementar el Home (Landing)

**Files:**
- Create: [src/components/ParallaxGallery.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ParallaxGallery.jsx) [NEW]
- Modify: [src/pages/Home.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Home.jsx)
- Modify: [src/components/EditorialHero.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/EditorialHero.jsx)

**Interfaces:**
- Consumes: Ninguna prop requerida (lee imágenes o enlaces estáticos).
- Produces: Galería asimétrica interactiva que se anima con el scroll mediante GSAP y ScrollTrigger.

- [ ] **Step 1: Crear ParallaxGallery.jsx**
  
  Crear la galería con grilla asimétrica en [src/components/ParallaxGallery.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ParallaxGallery.jsx). Las imágenes tendrán diferentes velocidades usando ScrollTrigger con valores dinámicos.
  
  ```javascript
  import React, { useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useGSAP } from '@gsap/react';
  import gsap from 'gsap';

  const GALLERIES = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop",
      title: "Labiales Satinados",
      speed: -30,
      width: '100%',
      aspect: '1'
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
      title: "Rubores Premium",
      speed: -15,
      width: '85%',
      aspect: '0.8'
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
      title: "Paletas de Sombras",
      speed: -45,
      width: '90%',
      aspect: '1.2'
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1631730359575-38e4755d772b?q=80&w=800&auto=format&fit=crop",
      title: "Cejas Perfectas",
      speed: -20,
      width: '100%',
      aspect: '0.9'
    }
  ];

  export default function ParallaxGallery() {
    const containerRef = useRef();
    const navigate = useNavigate();

    useGSAP(() => {
      const items = gsap.utils.toArray('.parallax-item');
      items.forEach((item) => {
        const speed = parseFloat(item.dataset.speed) || -20;
        gsap.to(item, {
          yPercent: speed,
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      // Animación de entrada inicial
      gsap.fromTo('.gallery-title',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%'
          }
        }
      );
    }, { scope: containerRef });

    return (
      <section 
        ref={containerRef}
        style={{
          padding: '80px 24px',
          maxWidth: '1100px',
          margin: '0 auto',
          overflow: 'hidden'
        }}
      >
        <h2 
          className="gallery-title"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            textAlign: 'center',
            fontWeight: '300',
            color: 'var(--color-white)',
            marginBottom: '60px'
          }}
        >
          Explora la <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Colección</span>
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '40px 30px',
          alignItems: 'start'
        }} className="parallax-grid">
          <style>{`
            @media (max-width: 600px) {
              .parallax-grid {
                grid-template-columns: 1fr !important;
                gap: 50px 0 !important;
              }
            }
          `}</style>
          
          {GALLERIES.map((item, idx) => (
            <div 
              key={item.id}
              className="parallax-item"
              data-speed={item.speed}
              onClick={() => navigate('/catalogo')}
              style={{
                width: item.width,
                margin: idx % 2 === 0 ? '0 auto 0 0' : '80px 0 0 auto',
                cursor: 'pointer',
                position: 'relative',
                borderRadius: 'var(--radius-premium)',
                overflow: 'hidden',
                border: 'var(--border-glass)',
                boxShadow: 'var(--shadow-premium)',
                transition: 'border-color 0.3s ease, transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
              }}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: item.aspect,
                overflow: 'hidden'
              }}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.6s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                
                {/* Overlay oscuro y título */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(10, 4, 5, 0.9) 0%, rgba(10, 4, 5, 0) 100%)',
                  padding: '24px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Bella Forever</span>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#fff', fontWeight: '400', marginTop: '4px' }}>{item.title}</h4>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)' }}>Explorar →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Actualizar Home.jsx para renderizar secciones**
  
  Reemplazar [src/pages/Home.jsx](file:///Users/santiago/proyectos/bella-catalog/src/pages/Home.jsx) para renderizar `EditorialHero`, `BrandStory`, `ParallaxGallery` y el CTA de salida.
  
  ```javascript
  import React from 'react';
  import { useNavigate } from 'react-router-dom';
  import EditorialHero from '../components/EditorialHero';
  import BrandStory from '../components/BrandStory';
  import ParallaxGallery from '../components/ParallaxGallery';
  import { CONFIG } from '../config';

  export default function Home() {
    const navigate = useNavigate();

    return (
      <div>
        <EditorialHero />
        
        <BrandStory />

        <ParallaxGallery />

        {/* CTA Banner de entrada al Catálogo */}
        <section style={{
          padding: '80px 24px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, transparent 0%, rgba(90, 22, 35, 0.15) 100%)',
          borderTop: 'var(--border-glass)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: '300',
            color: '#fff',
            marginBottom: '20px'
          }}>
            ¿Lista para revelar tu <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>brillo único</span>?
          </h2>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '1rem',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px auto',
            lineHeight: '1.6'
          }}>
            Descubre nuestra línea completa de maquillaje, rubores, labiales y correctores seleccionados para realzar tu belleza.
          </p>
          <button 
            onClick={() => navigate('/catalogo')}
            style={{
              backgroundColor: 'var(--color-burgundy)',
              color: 'var(--color-white)',
              border: '1px solid var(--color-gold)',
              padding: '16px 36px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '1px',
              boxShadow: 'var(--shadow-gold)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
          >
            INGRESAR AL CATÁLOGO
          </button>
        </section>

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
  ```

- [ ] **Step 3: Modificar EditorialHero.jsx para que el botón de CTA use react-router-dom**
  
  Modificar [src/components/EditorialHero.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/EditorialHero.jsx) para redirigir a `/catalogo` cuando se haga clic en "EXPLORAR CATÁLOGO".
  
  En [src/components/EditorialHero.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/EditorialHero.jsx):
  Reemplazar el import y la acción del botón para redirigir con `useNavigate`.
  
  ```javascript
  import React, { useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useGSAP } from '@gsap/react';
  import gsap from 'gsap';

  export default function EditorialHero() {
    const containerRef = useRef();
    const navigate = useNavigate();

    // ... [código de animaciones sin cambios]
  ```
  
  Y en el botón:
  ```javascript
  <button 
    onClick={() => navigate('/catalogo')}
    // ...
  ```

---

### Task 4: Modificar el Header para soportar rutas e interactividad condicional

**Files:**
- Modify: [src/components/Header.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/Header.jsx)

**Interfaces:**
- Consumes: `cartCount`, `onCartClick`.
- Produces: Header dinámico con enlaces y visibilidad de carrito condicional.

- [ ] **Step 1: Modificar Header.jsx**
  
  Importar `Link` y `useLocation` de `react-router-dom`. Mostrar el icono del carrito únicamente en la ruta `/catalogo`.
  
  ```javascript
  import React from 'react';
  import { Link, useLocation } from 'react-router-dom';
  import { CONFIG } from '../config';

  export default function Header({ cartCount, onCartClick }) {
    const location = useLocation();
    const isCatalog = location.pathname === '/catalogo';

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
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
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
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link 
            to="/catalogo" 
            style={{
              color: isCatalog ? 'var(--color-gold)' : 'var(--color-text-light)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              letterSpacing: '1px',
              transition: 'color 0.2s'
            }}
          >
            CATÁLOGO
          </Link>

          {isCatalog && (
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
          )}
        </div>
      </header>
    );
  }
  ```

- [ ] **Step 2: Probar el Build final de producción**
  
  Ejecutar:
  ```bash
  bun run build
  ```
  Expected: Compilación exitosa, sin errores de linting u imports rotos.
