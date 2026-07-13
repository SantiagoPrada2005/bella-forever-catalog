# Especificación de Diseño: Luxury Dark Mode para Bella Forever

Este documento detalla el diseño visual, la arquitectura de componentes y el flujo interactivo para rediseñar la tienda catálogo "Bella Forever" en una versión de alta gama, con estética oscura, elegante y premium.

## 1. Identidad Visual y Design Tokens

Para lograr un aspecto "costoso" y profesional, se elimina el blanco plano y se implementa una paleta de colores de alto contraste inspirada en boutiques de cosmética de lujo:

### Paleta de Colores
*   **Fondo Base (`--color-bg-dark`):** `#0A0405` (Negro carbón mate con una tonalidad cálida de borgoña de fondo).
*   **Fondo de Paneles (`--color-panel-dark`):** `#12090B` (Borgoña oscuro profundo para tarjetas, drawers y modales).
*   **Acento Borgoña (`--color-burgundy`):** `#5A1623` (El color principal de branding para elementos destacados y botones).
*   **Dorado Satinado (`--color-gold`):** `#D7B06A` (Color premium para precios, bordes delgados, badges y detalles de tipografía).
*   **Dorado Hover (`--color-gold-hover`):** `#E8C17F` (Brillo dorado interactivo).
*   **Rosa Maquillaje / Destellos (`--color-pastel-pink`):** `#F6D6D9` (Utilizado para manchas de brillo difuminadas en el fondo y etiquetas de "Nuevo").
*   **Texto Principal (`--color-text-light`):** `#FCF9F9` (Blanco hueso para máxima legibilidad).
*   **Texto Secundario (`--color-text-muted`):** `#A39092` (Rosa grisáceo cálido para descripciones y subtítulos).

### Tipografía
*   **Títulos & Logotipos:** `'Cormorant Garamond', serif` (Tipografía Serif elegante de alto contraste con cursivas para acentos estilizados).
*   **Cuerpo & Componentes de UI:** `'Outfit', sans-serif` (Tipografía Sans-serif geométrica, moderna y limpia).

---

## 2. Flujo Visual de Secciones (Layout Editorial)

La estructura de la página principal (`src/App.jsx`) se reorganiza bajo un formato editorial que rompe el flujo lineal del catálogo clásico:

1.  **Navegación Flotante (`Header.jsx`):** Esmerilado translúcido con efecto blur (`rgba(18, 9, 11, 0.85)` y `backdrop-filter`), logo centrado y contador de carrito estilizado con destello dorado.
2.  **Héroe Asimétrico (`EditorialHero.jsx`):**
    *   Izquierda: Mensaje principal en Serif cursiva gigante ("Revela tu brillo natural") con botones de acción magnéticos.
    *   Derecha: Composición de fotos de producto superpuestas que sobresalen de sus bordes con desplazamientos parallax.
3.  **Sección Narrativa (`BrandStory.jsx`):**
    *   Un bloque de respiro que muestra el lema de Silvy Loaiza: *"Tu dosis diaria de brillo y color"* en letra serif cursiva gigante sobre un fondo de mancha difuminada rosa que parpadea levemente.
4.  **Carrusel Destacado (`FeaturedCarousel.jsx`):**
    *   Un carrusel de desplazamiento horizontal suave para productos marcados como `isFeatured` o `isNew`. Fichas de producto más grandes con bordes dorados delgados y detalles premium.
5.  **Catálogo General:**
    *   Filtros de categoría tipo píldora en borgoña y dorado.
    *   Una cuadrícula limpia de 3 columnas para el catálogo general de productos.
6.  **Footer Elegante:**
    *   Un cierre oscuro con enlaces a Instagram, mapa del local de Roldanillo y créditos de autoría.

---

## 3. Arquitectura de Archivos y Componentes

Se estructurará el código en los siguientes archivos:

### Componentes Nuevos
*   `[NEW]` [EditorialHero.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/EditorialHero.jsx) — El nuevo héroe asimétrico con animaciones GSAP integradas.
*   `[NEW]` [FeaturedCarousel.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/FeaturedCarousel.jsx) — El slider horizontal táctil para destacar lanzamientos importantes.
*   `[NEW]` [BrandStory.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/BrandStory.jsx) — Sección de frase de marca.

### Componentes Modificados
*   `[MODIFY]` [index.css](file:///Users/santiago/proyectos/bella-catalog/src/index.css) — Reemplazo de variables de color por el esquema Luxury Dark, importación de fuentes de Google Fonts y adición de clases utilitarias para shimmer y blur.
*   `[MODIFY]` [App.jsx](file:///Users/santiago/proyectos/bella-catalog/src/App.jsx) — Integración y renderizado secuencial de los nuevos componentes asimétricos manteniendo la lógica del carrito.
*   `[MODIFY]` [Header.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/Header.jsx) — Rediseño visual esmerilado translúcido con logotipo dorado.
*   `[MODIFY]` [ProductCard.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ProductCard.jsx) — Incorporación del brillo satinado (shimmer diagonal) en la imagen y animación magnética en el botón "Agregar".
*   `[MODIFY]` [ProductModal.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/ProductModal.jsx) — Rediseño a ventana modal oscura de alto contraste con efectos de entrada fluidos (GSAP scale-in).
*   `[MODIFY]` [CartDrawer.jsx](file:///Users/santiago/proyectos/bella-catalog/src/components/CartDrawer.jsx) — Drawer lateral oscuro translúcido con Checkout de WhatsApp integrado y tipografía premium.

---

## 4. Animaciones e Interacciones (GSAP y CSS)

Para transmitir esa percepción costosa y elaborada, aplicaremos micro-interacciones de alta calidad:

*   **Efecto Magnético (Magnet Hook / GSAP):** Los botones principales ("Agregar al pedido", "Confirmar pedido", "Ver Catálogo") tendrán una atracción física sutil hacia el cursor. Al pasar cerca (dentro de 60-80px), el botón se desplazará levemente hacia el ratón usando GSAP con un suavizado `power2.out`, regresando de forma elástica al salir.
*   **Brillo Satinado (Satin Shimmer):** Las tarjetas de producto tendrán una capa interna de degradado lineal dorado traslúcido (`linear-gradient(90deg, transparent, rgba(215, 176, 106, 0.15), transparent)`). Al hacer hover en la tarjeta, este destello cruzará diagonalmente la imagen de izquierda a derecha.
*   **Scroll Reveal (GSAP ScrollTrigger):** Las secciones y tarjetas del catálogo se revelarán suavemente (fade-in + desplazamiento vertical de 20px) a medida que entren al viewport durante el scroll.

---

## 5. Plan de Verificación

*   **Verificación de Compilación:** Ejecutar `bun run build` para asegurar que el bundle de Vite se compila sin errores.
*   **Ajuste Responsivo:** Probar el comportamiento del carrusel horizontal y el héroe asimétrico en pantallas de móviles (iPhone/Android simulados) y escritorios.
*   **Prueba de Checkout:** Confirmar que al realizar clic en "Confirmar pedido por WhatsApp", el mensaje generado para WhatsApp Web incluye el total, los tonos seleccionados y se abre en una nueva pestaña.
