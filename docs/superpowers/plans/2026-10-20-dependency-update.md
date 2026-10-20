# Plan de Actualización Integral de Dependencias

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Actualizar todas las dependencias del proyecto (Astro, Cloudflare adapter, React, Three.js, Drizzle, Wrangler, Oxlint) a sus versiones más recientes y estables, mitigando 34 vulnerabilidades y manteniendo total compatibilidad con el runtime de Cloudflare Workers.

**Architecture:** Actualización por capas desacopladas (Framework Core -> UI/Hydration -> Database/Dev Tools -> Verificación cruzada). Se respeta el límite de ejecución de Cloudflare Workers (`nodejs_compat` Node 22) conteniendo `@types/node` en la línea 22.x LTS para evitar fugas de tipos incompatibles con Edge.

**Tech Stack:** Astro 7.4.x, @astrojs/cloudflare 14.4.x, @astrojs/react 7.1.x, React 19.3.x, Three.js 0.186.x, Drizzle ORM 0.45.x, Wrangler 4.151.x, TypeScript 7.0.x, Oxlint.

## Global Constraints

- Gestor de paquetes mandatorio: `pnpm` (lockfile `pnpm-lock.yaml`).
- Entorno local: Node.js `v24.15.0`.
- Runtime de producción: Cloudflare Pages / Workers SSR con `compatibility_date: 2026-07-17` y flag `nodejs_compat`.
- Todos los cambios deben pasar sin errores: `pnpm run lint`, `pnpm run typecheck`, `pnpm run build` y `pnpm run cf-typegen`.

---

## User Review Required

> [!IMPORTANT]
> **Actualización Mayor en `@astrojs/react` (v6.0.4 → v7.1.0):**
> La versión 7.0+ migra internamente a `@vitejs/plugin-react` v6 impulsado por **Oxc** para transformaciones JSX y Fast Refresh ultrarrápidas, y fija el piso mínimo de Node.js en `>= 22.22.0`. Nuestro entorno local corre Node `v24.15.0`, por lo que cumple holgadamente. No se requieren cambios en `astro.config.mjs` porque no se utilizaba la opción obsoleta `babel`.

> [!NOTE]
> **Alineación de tipos `@types/node`:**
> `pnpm outdated` propone saltar a `@types/node@26.6.5`. Sin embargo, Cloudflare Workers opera con la capa de emulación Node.js v22 (`nodejs_compat`). Para evitar incorporar definiciones de APIs inexistentes en el runtime de Cloudflare (violando la separación de capas de ejecución), actualizaremos `@types/node` al último parche de la serie 22 (`^22.20.5`).

> [!TIP]
> **Resolución de Vulnerabilidades de Seguridad:**
> El comando `pnpm audit` reporta actualmente 34 vulnerabilidades (en `undici`, `devalue`, etc.). La actualización conjunta de `astro`, `@astrojs/cloudflare`, `@astrojs/react` y `wrangler` actualiza estos paquetes anidados y subsana las alertas de seguridad.

---

## Matriz de Dependencias

| Dependencia | Tipo | Versión Actual | Versión Objetivo | Categoría |
|---|---|---|---|---|
| `astro` | prod | `^7.2.9` | `^7.4.1` | Minor (Core) |
| `@astrojs/cloudflare` | prod | `^14.2.5` | `^14.4.1` | Minor (Adapter) |
| `@astrojs/react` | prod | `^6.0.4` | `^7.1.0` | **Major** (Integration) |
| `@astrojs/sitemap` | prod | `^3.2.1` | `^3.7.4` | Patch (SEO) |
| `react` | prod | `^19.2.8` | `^19.3.1` | Patch (UI) |
| `react-dom` | prod | `^19.2.8` | `^19.3.1` | Patch (UI) |
| `@types/react` | dev | `^19.2.18` | `^19.3.0` | Patch (Types) |
| `@types/react-dom` | dev | `^19.2.5` | `^19.3.0` | Patch (Types) |
| `drizzle-orm` | prod | `^0.45.2` | `^0.45.4` | Patch (ORM) |
| `drizzle-kit` | dev | `^0.31.10` | `^0.31.11` | Patch (Migrations) |
| `three` | prod | `^0.185.1` | `^0.186.1` | Minor (3D) |
| `@react-three/fiber` | prod | `^9.7.0` | `^9.8.2` | Minor (3D) |
| `@react-three/drei` | prod | `^10.7.8` | `^10.7.9` | Patch (3D) |
| `wrangler` | dev | `^4.127.1` | `^4.151.1` | Minor (Cloudflare CLI) |
| `oxlint` | dev | `^1.80.0` | `^1.88.0` | Minor (Linter) |
| `@types/node` | dev | `^22.13.9` | `^22.20.5` | Patch (Workers Compat) |

*(Nota: `@gsap/react`, `gsap`, `astro-robots-txt` y `typescript` ya se encuentran en su última versión).*

---

## Proposed Changes

### Layer 1: Core Framework & Adapter

Actualizar `astro`, `@astrojs/cloudflare` y `@astrojs/sitemap`. La versión 14.4 de `@astrojs/cloudflare` requiere explícitamente `astro@^7.4.0+`.

#### [MODIFY] package.json

```diff
   "dependencies": {
-    "@astrojs/cloudflare": "^14.2.5",
+    "@astrojs/cloudflare": "^14.4.1",
     "@astrojs/react": "^6.0.4",
-    "@astrojs/sitemap": "^3.2.1",
+    "@astrojs/sitemap": "^3.7.4",
     "@gsap/react": "^2.1.2",
     "@react-three/drei": "^10.7.8",
     "@react-three/fiber": "^9.7.0",
-    "astro": "^7.2.9",
+    "astro": "^7.4.1",
```

---

### Layer 2: React & UI Ecosystem

Actualizar el ecosistema React, la integración de Astro y las dependencias 3D a sus versiones más recientes.

#### [MODIFY] package.json

```diff
-    "@astrojs/react": "^6.0.4",
+    "@astrojs/react": "^7.1.0",
-    "@react-three/drei": "^10.7.8",
+    "@react-three/drei": "^10.7.9",
-    "@react-three/fiber": "^9.7.0",
+    "@react-three/fiber": "^9.8.2",
-    "react": "^19.2.8",
+    "react": "^19.3.1",
-    "react-dom": "^19.2.8",
+    "react-dom": "^19.3.1",
-    "three": "^0.185.1"
+    "three": "^0.186.1"
   },
   "devDependencies": {
-    "@types/react": "^19.2.18",
+    "@types/react": "^19.3.0",
-    "@types/react-dom": "^19.2.5",
+    "@types/react-dom": "^19.3.0",
```

---

### Layer 3: Database, Tooling & Platform

Actualizar Drizzle, Wrangler, Oxlint y tipos de Node.

#### [MODIFY] package.json

```diff
-    "drizzle-orm": "^0.45.2",
+    "drizzle-orm": "^0.45.4",
   },
   "devDependencies": {
-    "@types/node": "^22.13.9",
+    "@types/node": "^22.20.5",
-    "drizzle-kit": "^0.31.10",
+    "drizzle-kit": "^0.31.11",
-    "oxlint": "^1.80.0",
+    "oxlint": "^1.88.0",
     "typescript": "^7.0.2",
-    "wrangler": "^4.127.1"
+    "wrangler": "^4.151.1"
   }
```

---

## Tasks

### Task 1: Actualización del Framework Core y Adapter

**Files:**
- Modify: `package.json:17-23`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Instalar actualizaciones de Astro y adaptadores**
  Ejecutar:
  ```bash
  pnpm add astro@^7.4.1 @astrojs/cloudflare@^14.4.1 @astrojs/sitemap@^3.7.4
  ```

- [ ] **Step 2: Verificar compatibilidad del build inicial**
  Ejecutar:
  ```bash
  pnpm run build
  ```
  Esperado: Build exitoso sin advertencias de peerDependencies desalineadas.

---

### Task 2: Actualización de React, Integración Astro-React y 3D

**Files:**
- Modify: `package.json:18-34`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Instalar paquetes de React, @astrojs/react y Three.js**
  Ejecutar:
  ```bash
  pnpm add @astrojs/react@^7.1.0 react@^19.3.1 react-dom@^19.3.1 three@^0.186.1 @react-three/fiber@^9.8.2 @react-three/drei@^10.7.9
  pnpm add -D @types/react@^19.3.0 @types/react-dom@^19.3.0
  ```

- [ ] **Step 2: Verificar tipado estricto con TypeScript**
  Ejecutar:
  ```bash
  pnpm run typecheck
  ```
  Esperado: `tsc --noEmit` completa con código de salida 0.

---

### Task 3: Actualización de Drizzle, Wrangler, Oxlint y Node Types

**Files:**
- Modify: `package.json:25-39`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Instalar Drizzle, Wrangler, Oxlint y @types/node**
  Ejecutar:
  ```bash
  pnpm add drizzle-orm@^0.45.4
  pnpm add -D drizzle-kit@^0.31.11 wrangler@^4.151.1 oxlint@^1.88.0 @types/node@^22.20.5
  ```

- [ ] **Step 2: Regenerar tipos de Cloudflare Workers**
  Ejecutar:
  ```bash
  pnpm run cf-typegen
  ```
  Esperado: `cloudflare-env.d.ts` regenerado con éxito contra Wrangler 4.151.x.

---

### Task 4: Suite Completa de Verificación y Auditoría

**Files:**
- Inspect: Todo el proyecto

- [ ] **Step 1: Ejecutar Oxlint**
  Ejecutar:
  ```bash
  pnpm run lint
  ```
  Esperado: 0 errores.

- [ ] **Step 2: Ejecutar Typecheck exhaustivo**
  Ejecutar:
  ```bash
  pnpm run typecheck
  ```
  Esperado: 0 errores.

- [ ] **Step 3: Ejecutar Astro Build en modo producción Cloudflare**
  Ejecutar:
  ```bash
  pnpm run build
  ```
  Esperado: Generación exitosa de bundles de servidor y cliente en `dist/`.

- [ ] **Step 4: Ejecutar auditoría de seguridad para confirmar reducción de CVEs**
  Ejecutar:
  ```bash
  pnpm audit
  ```
  Esperado: Mitigación de vulnerabilidades de severidad alta en dependencias internas.

- [ ] **Step 5: Prueba de ejecución de preview local**
  Ejecutar de forma transitoria:
  ```bash
  pnpm run preview -- --port 4321
  ```
  Esperado: Wrangler arranca el simulador de Pages/Workers sin excepciones en tiempo de inicio.

---

### Task 5: Consolidación y Commit de Git

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- (Si aplica) `cloudflare-env.d.ts`

- [ ] **Step 1: Revisar diff de git**
  Ejecutar:
  ```bash
  git diff --stat
  ```

- [ ] **Step 2: Crear commit semántico**
  Ejecutar:
  ```bash
  git add package.json pnpm-lock.yaml cloudflare-env.d.ts
  git commit -m "chore(deps): update dependencies to latest stable versions"
  ```

---

## Verification Plan

### Automated Verification
```bash
# 1. Verificación de sintaxis y linting
pnpm run lint

# 2. Verificación de contratos y tipos TypeScript
pnpm run typecheck

# 3. Regeneración de tipos de bindings de Cloudflare
pnpm run cf-typegen

# 4. Compilación completa para producción Cloudflare Pages
pnpm run build
```

### Manual Verification
1. **Arranque en desarrollo:** Iniciar `pnpm run dev` y navegar a la página principal del catálogo (`http://localhost:4321/`).
2. **Hidratación de React:** Abrir la consola del navegador, interactuar con el carrito (`CartDrawer`), los filtros del catálogo y verificar que no haya advertencias de hidratación (`client:load`).
3. **Persistencia local:** Añadir un producto al carrito, recargar y constatar que el estado se recupere normalmente.
