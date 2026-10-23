# Rediseño Editorial Luminoso de `/catalogo` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la ruta `/catalogo` con una estética *mobile-first* de estudio editorial luminoso (fusión Glossier + AMUSE), eliminando la plantilla oscura genérica y las fugas de rendimiento en las tarjetas de producto.

**Architecture:** Se introduce un ámbito de tokens CSS luminosos (`.theme-catalog-studio`) en `src/index.css` que gobierna toda la página `/catalogo` bajo la regla *Page Theme Lock*. Se desacopla `CatalogClient.tsx` extrayendo `CatalogHeroSpotlight.tsx` (Hero Split Glossier + vitrina interactiva AMUSE) y `CatalogEditorialInterlude.tsx` (bloque de filosofía intercalado en la grilla), mientras se refactorizan `CategoryFilters.tsx`, `ProductGrid.tsx`, `ProductCard.tsx`, `ProductModal.tsx`, `Header.tsx`, `CartDrawer.tsx` y `CartToast.tsx` para usar clases declarativas, Container Queries y prioridad de carga LCP.

**Tech Stack:** Astro 7, React 19, TypeScript 6, GSAP (`@gsap/react`), CSS Custom Properties + Container Queries (`@container`, `cqi`).

## Global Constraints

- **Mobile-First:** Todos los estilos base se definen para `< 768px` (`375px - 430px`) y escalan progresivamente en `@media (min-width: 768px)` y `@media (min-width: 1024px)`.
- **Page Theme Lock:** Toda la ruta `/catalogo` opera bajo `.theme-catalog-studio` (`#FBF6F7` base, `#F4ECEE` tarjeta, `#F7E2E5` blush editorial, `#24070E` tinta, `#8C1D32` acento único carmesí).
- **Zero Em-Dashes:** Prohibido el carácter `—` o `–` en cualquier texto o comentario visible; usar exclusivamente guion simple `-` o puntuación estándar.
- **Performance & Motion:** Cero listeners globales `window.addEventListener('mousemove')` en tarjetas; toda animación respeta `@media (prefers-reduced-motion: reduce)`.
- **LCP Priority (`optimize-image-priority`):** La imagen principal del Hero Spotlight lleva `fetchPriority="high"` sin `loading="lazy"`; las imágenes de productos secundarios en el Hero usan `fetchPriority="low"` + `loading="lazy"`, y la grilla inferior usa `loading="lazy"` sin `fetchPriority="low"`.

---

### Task 1: Sistema de Tokens y Estilos Mobile-First (`.theme-catalog-studio`) en `src/index.css`

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: Clases CSS `.theme-catalog-studio`, `.catalog-header`, `.catalog-hero-frame`, `.catalog-spotlight-card`, `.catalog-filters-bar`, `.catalog-filter-pill`, `.catalog-studio-grid`, `.studio-product-card`, `.catalog-interlude`, `.studio-modal-sheet`, `.catalog-footer`.

- [x] **Step 1: Agregar el sistema de diseño `.theme-catalog-studio` y componentes responsive/container-queries al final de `src/index.css`**
- [x] **Step 2: Verificar que no existan errores de sintaxis CSS con `npm run build`**

---

### Task 2: Crear `CatalogHeroSpotlight.tsx` (Fusión Glossier Split + AMUSE Interactive Spotlight)

**Files:**
- Create: `src/components/CatalogHeroSpotlight.tsx`

**Interfaces:**
- Consumes: `ProductWithRelations`, `Tone` de `../db/schema`; `getProductImage` de `../utils/image-helpers`; `CONFIG` de `../config`.
- Produces: `CatalogHeroSpotlight({ products, onProductClick, onAddToCart })`.

- [x] **Step 1: Implementar `src/components/CatalogHeroSpotlight.tsx` con soporte mobile-first, selector de tonos AMUSE, cambio entre productos destacados y prioridad LCP**
- [x] **Step 2: Verificar tipos con `npm run typecheck`**

---

### Task 3: Crear `CatalogEditorialInterlude.tsx` (Bloque Editorial Glossier en la Grilla)

**Files:**
- Create: `src/components/CatalogEditorialInterlude.tsx`

**Interfaces:**
- Produces: `CatalogEditorialInterlude({ onExploreCategory })`.

- [x] **Step 1: Implementar `src/components/CatalogEditorialInterlude.tsx` con píldora superior, dúo de mini-recortes fotográficos de textura y manifiesto tipográfico con acentos en `Cormorant Garamond` cursiva**
- [x] **Step 2: Verificar tipos con `npm run typecheck`**

---

### Task 4: Refactorizar `CategoryFilters.tsx`, `ProductCard.tsx` y `ProductGrid.tsx`

**Files:**
- Modify: `src/components/CategoryFilters.tsx`
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/components/ProductGrid.tsx`

**Interfaces:**
- Consumes: `CatalogEditorialInterlude` en `ProductGrid.tsx`.
- Produces:
  - `CategoryFilters`: barra sticky con píldoras limpias y contador de productos.
  - `ProductCard`: tarjeta de estudio libre de listeners `mousemove` globales, con container query (`product-card-cq`), badge superior derecho, swatches táctiles con anillo activo y CTA en una línea.
  - `ProductGrid`: grilla mobile-first de 2 columnas en móvil / 3 en tablet / 4 en desktop con el interludio inyectado tras los primeros 4 productos y estado vacío interactivo.

- [x] **Step 1: Actualizar `src/components/CategoryFilters.tsx`**
- [x] **Step 2: Actualizar `src/components/ProductCard.tsx`**
- [x] **Step 3: Actualizar `src/components/ProductGrid.tsx`**
- [x] **Step 4: Ejecutar `npm run typecheck`**

---

### Task 5: Alinear `Header.tsx`, `ProductModal.tsx`, `ProductGallery.tsx`, `CartToast.tsx`, `CartDrawer.tsx` y `CatalogClient.tsx` al Tema Studio

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/ProductGallery.tsx`
- Modify: `src/components/ProductModal.tsx`
- Modify: `src/components/ui/CartToast.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Modify: `src/components/CatalogClient.tsx`
- Modify: `src/pages/catalogo/index.astro`

**Interfaces:**
- Consumes: `CatalogHeroSpotlight`, `CategoryFilters`, `ProductGrid`, `ProductModal`, `CartDrawer`, `CartToast`.
- Produces: Experiencia completa de `/catalogo` bajo `.theme-catalog-studio`, sin `FeaturedCarousel` duplicado y con coherencia cromática absoluta (*Page Theme Lock*).

- [x] **Step 1: Adaptar `Header.tsx`, `ProductGallery.tsx`, `ProductModal.tsx`, `CartToast.tsx` y `CartDrawer.tsx` para responder al tema luminoso de `/catalogo` y eliminar em-dashes**
- [x] **Step 2: Actualizar `CatalogClient.tsx` y `src/pages/catalogo/index.astro`**
- [x] **Step 3: Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`**
