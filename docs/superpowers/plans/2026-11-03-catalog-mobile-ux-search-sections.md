# Optimización Móvil de Detalle de Producto, Buscador, Seccionamiento del Catálogo y WhatsApp Flotante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimizar la experiencia móvil del detalle de producto (`ProductModal` y `ProductGallery`) con *Sticky CTA Bar*, descripción editorial enriquecida y productos relacionados; incorporar búsqueda en tiempo real en `CategoryFilters`; seccionar el catálogo cuando se muestra la vista "Todos" en `ProductGrid`; y añadir un botón flotante de atención al cliente por WhatsApp (`3117887806`).

**Architecture:** Se mantiene la arquitectura *mobile-first* sobre React 19 y Astro SSR con estado reactivo libre de latencia en `CatalogClient.tsx`. Se actualiza `ProductGallery.tsx` para unificar la imagen del tono seleccionado con el resto de la galería y soportar gestos táctiles (*swipe*). Se rediseña `ProductModal.tsx` en 3 zonas (cabecera fija, cuerpo desplazable con descripción enriquecida + acordeones + carrusel de productos relacionados/destacados, y pie de compra fijo). Se extiende `CategoryFilters.tsx` con buscador instantáneo normalizado, se transforma `ProductGrid.tsx` para renderizar una banda de *Favoritos y Nuevos* seguida de secciones por categoría cuando `activeCategory === 'todos'`, y se crea `WhatsAppFloatingButton.tsx` con ocultamiento automático ante modales/drawers.

**Tech Stack:** Astro 7, React 19, TypeScript 6, GSAP (`@gsap/react`), CSS Custom Properties + Container Queries.

## Global Constraints

- **Mobile-First & Thumb-Zone:** El modal de producto en móvil (`< 768px`) debe mantener siempre visible la barra inferior de acción (*Sticky Footer*) con `padding-bottom: max(14px, env(safe-area-inset-bottom))`.
- **Sin cambios destructivos en Base de Datos:** Todas las mejoras de descripción, atributos por categoría y productos relacionados se derivan de `ProductWithRelations` existente.
- **Zero Em-Dashes:** Evitar `—` o `–` en textos de interfaz; utilizar puntuación estándar o `·`.
- **Accesibilidad y Movimiento:** Todos los controles interactivos tienen etiquetas ARIA claras y todas las animaciones respetan `@media (prefers-reduced-motion: reduce)`.
- **Número Oficial de WhatsApp:** Usar `CONFIG.whatsappNumber` (`+573117887806` / `3117887806`).

---

### Task 1: Estilos Mobile-First para Modal en 3 Zonas, Buscador, Secciones de Catálogo y Botón de WhatsApp en `src/index.css`

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: Clases CSS `.catalog-search-bar`, `.catalog-search-input`, `.catalog-featured-strip`, `.catalog-category-section`, `.product-modal-sheet`, `.product-modal-body`, `.product-modal-sticky-footer`, `.product-detail-accordion`, `.product-related-strip`, `.whatsapp-floating-btn`.

- [ ] **Step 1: Agregar los estilos responsive para el nuevo modal móvil, buscador, secciones de catálogo y botón flotante de WhatsApp en `src/index.css`**
- [ ] **Step 2: Verificar que el CSS y proyecto compilen sin errores**

---

### Task 2: Crear `src/components/ui/WhatsAppFloatingButton.tsx` e integrarlo en Inicio (`src/pages/index.astro`)

**Files:**
- Create: `src/components/ui/WhatsAppFloatingButton.tsx`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `CONFIG` de `../../config`.
- Produces: `WhatsAppFloatingButton({ isHidden, hasToastOffset, customMessage })`.

- [ ] **Step 1: Crear `src/components/ui/WhatsAppFloatingButton.tsx` con enlace a `3117887806`, icono oficial de WhatsApp, etiqueta de atención al cliente y ocultamiento suave cuando hay un modal/drawer abierto**
- [ ] **Step 2: Integrar `<WhatsAppFloatingButton />` en `src/pages/index.astro`**
- [ ] **Step 3: Ejecutar `npm run typecheck`**

---

### Task 3: Mejorar `src/components/ProductGallery.tsx` (Galería Unificada + Swipe Móvil)

**Files:**
- Modify: `src/components/ProductGallery.tsx`

**Interfaces:**
- Consumes: `ProductImage` de `../db/schema`.
- Produces: `ProductGallery({ images, selectedToneImage, selectedToneName, productName, fallbackImage, isNew, isFeatured, lowStockCount })`.

- [ ] **Step 1: Actualizar `src/components/ProductGallery.tsx` para que la imagen del tono seleccionado conviva con las fotos adicionales del producto sin ocultar las miniaturas, agregando soporte de swipe táctil horizontal, contador `1 / N` y badges de estado**
- [ ] **Step 2: Ejecutar `npm run typecheck`**

---

### Task 4: Rediseñar `src/components/ProductModal.tsx` (Optimización Móvil, Descripción Editorial, Acordeones, Consulta WhatsApp y Productos Relacionados/Destacados)

**Files:**
- Modify: `src/components/ProductModal.tsx`

**Interfaces:**
- Consumes: `ProductGallery`, `ProductWithRelations`, `Tone`, `CONFIG`, `formatCop`, `getProductImage`.
- Produces: `ProductModal({ product, allProducts, categories, initialTone, onClose, onAddToCart, onSelectProduct })`.

- [ ] **Step 1: Refactorizar `src/components/ProductModal.tsx` con layout móvil de 3 zonas (Header fijo, Cuerpo scrollable con galería, selector de tonos táctil, descripción enriquecida + chips + acordeones + botón de consulta por WhatsApp + carrusel de productos relacionados/destacados, y Sticky Footer de compra)**
- [ ] **Step 2: Soportar cambio fluido de producto dentro del modal (`onSelectProduct`) haciendo scroll suave al inicio del cuerpo del modal**
- [ ] **Step 3: Ejecutar `npm run typecheck`**

---

### Task 5: Incorporar Buscador en Tiempo Real en `src/components/CategoryFilters.tsx`

**Files:**
- Modify: `src/components/CategoryFilters.tsx`

**Interfaces:**
- Produces: `CategoryFilters({ categories, products, activeCategory, searchQuery, filteredCount, onCategoryChange, onSearchChange })`.

- [ ] **Step 1: Actualizar `src/components/CategoryFilters.tsx` agregando el campo de búsqueda instantánea con botón para limpiar texto, accesibilidad y conteo dinámico de resultados**
- [ ] **Step 2: Ejecutar `npm run typecheck`**

---

### Task 6: Seccionar el Catálogo en Vista "Todos" y Soportar Búsqueda en `src/components/ProductGrid.tsx` y `src/components/CatalogClient.tsx`

**Files:**
- Modify: `src/components/ProductGrid.tsx`
- Modify: `src/components/CatalogClient.tsx`

**Interfaces:**
- Consumes: `CategoryFilters`, `ProductGrid`, `ProductModal`, `WhatsAppFloatingButton`.
- Produces: Catálogo completo con filtrado por búsqueda + categoría, vista "Todos" seccionada (banda horizontal de *Favoritos y Nuevos* + secciones por categoría con botón *"Ver todo"*), modal conectado a productos relacionados y botón flotante de WhatsApp sincronizado con el estado de los modales.

- [ ] **Step 1: Actualizar `src/components/ProductGrid.tsx` para renderizar la vista seccionada cuando `activeCategory === 'todos'` y no hay búsqueda activa, o la vista de resultados enfocada cuando se filtra por categoría/búsqueda**
- [ ] **Step 2: Actualizar `src/components/CatalogClient.tsx` para gestionar `searchQuery`, pasar `allProducts` y `onSelectProduct` a `ProductModal`, e incluir `WhatsAppFloatingButton`**
- [ ] **Step 3: Ejecutar `npm run typecheck`, `npm run lint` y `npm run build` para validar toda la implementación**
