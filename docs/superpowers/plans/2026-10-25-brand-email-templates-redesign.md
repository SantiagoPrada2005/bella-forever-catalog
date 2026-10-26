# Rediseño de Plantillas de Email: Identidad Visual Bella Forever y Galería de Productos

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar las plantillas de correo electrónico transaccionales (`brand-layout`, `welcome`, `order-confirmation`) para elevar la identidad visual de Bella Forever al nivel de una boutique de belleza premium, incorporando el isotipo oficial, logotipo, banners editoriales y miniaturas fotográficas de los productos con soporte universal para clientes de correo.

**Architecture:** Se actualiza la capa de presentación de emails (`src/lib/email/templates/`) manteniendo la separación de responsabilidades: un helper de resolución de URLs absolutas asegura que imágenes relativas (`/api/images/...` o `/images/...`) se transformen en URLs públicas completas (`https://bella-forever.com/...`); el layout base incorpora encabezados con isotipo PNG de alta resolución, divisores dorados y paleta de marca (`#5A1623`, `#D7B06A`, `#FAF7F5`); y la confirmación de pedidos implementa una tabla rica con thumbnails de 64x64px, swatches de color de tono y barra de estado de preparación.

**Tech Stack:** Astro v7, Cloudflare Workers Email Sending API, TypeScript 6, HTML para email (tablas MSO-compliant y estilos CSS en línea), PNG/WebP assets en CDN/dominio propio.

---

## User Review Required

> [!IMPORTANT]
> **Compatibilidad universal de imágenes en clientes de correo:**
> - Los clientes de correo (especialmente Outlook para Windows de escritorio) no descargan imágenes con rutas relativas (`/images/...`) ni soportan formatos WebP de forma universal sin fallback.
> - Todas las imágenes se servirán con URL absoluta de producción (`https://bella-forever.com/...`) y generaremos una versión PNG del logo (`public/logo.png`) junto con el isotipo existente (`public/isotipo.png`) para garantizar nitidez y carga inmediata en Gmail, Apple Mail, Outlook y Android.
> - Si un producto no tiene fotografía cargada, la plantilla mostrará un fallback estilizado con el monograma "BF" sobre fondo rosa pastel y borde dorado.

---

## Open Questions

> [!NOTE]
> 1. **Banner editorial en bienvenida**: Para el correo de bienvenida, utilizaremos el banner editorial principal de la marca (`https://bella-forever.com/images/og-bella-forever.jpg`). ¿Deseas algún mensaje promocional específico (ej. "Envío gratis en tu primer pedido por WhatsApp" o "Asesoría de tono personalizada")?
> 2. **Barra de estado de pedido**: En la confirmación de pedido incluiremos una barra de progreso visual con 3 etapas: `✓ Pedido Recibido` ➔ `Preparando en Bodega` ➔ `Listo para Despacho`. ¿Te parece adecuada esta nomenclatura para tus clientes?

---

## Proposed Changes

```
public/
└── logo.png                          [NEW] Versión PNG universal del logo para email
src/
└── lib/
    └── email/
        ├── client.ts                 [MODIFY] Enriquecer items con imageUrl y toneHex en sendOrderNotification
        └── templates/
            ├── brand-layout.ts       [MODIFY] Header con Isotipo FB, divisor dorado y footer de lujo
            ├── welcome.ts            [MODIFY] Banner editorial, tarjetas de categorías y diseño boutique
            └── order-confirmation.ts [MODIFY] Thumbnails de productos, swatches de tonos y status tracker
```

---

### Componente 1: Assets y Helper de URLs Absolutas

#### [NEW] `public/logo.png`
- Conversión de `public/logo.webp` a `public/logo.png` mediante `sips` para compatibilidad universal con clientes de correo que no soportan WebP.

#### [MODIFY] [src/lib/email/templates/brand-layout.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/brand-layout.ts)
- Creación de función utilitaria exportable `toAbsoluteUrl(path: string | null | undefined): string`:
  - Si ya es URL completa (`https://...`), la retorna tal cual.
  - Si es relativa (`/api/images/...` o `images/...`), antepone `https://bella-forever.com`.
  - Si está vacía o indefinida, retorna cadena vacía o fallback.
- Header renovado:
  - Isotipo "FB" circular de 64x64px (`https://bella-forever.com/isotipo.png`) con borde dorado fino (`#D7B06A`).
  - Título tipográfico en serif clásico en dorado (`#D7B06A`) y fondo borgoña (`#5A1623`).
  - Tagline de marca en mayúsculas espaciadas: `✨ TU DOSIS DIARIA DE BRILLO Y COLOR ✨`.
- Footer renovado:
  - Iconos de redes sociales, enlace de WhatsApp en botón sutil, ubicación boutique en Roldanillo y sello de calidad.

---

### Componente 2: Rediseño de Plantilla de Bienvenida

#### [MODIFY] [src/lib/email/templates/welcome.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/welcome.ts)
- Inclusión de Banner Hero Editorial a todo el ancho del contenedor (`https://bella-forever.com/images/og-bella-forever.jpg` con bordes redondeados).
- Bloque de bienvenida personalizada con tipografía serif refinada y acentos en dorado.
- Grid visual de categorías destacadas de Bella Forever:
  - 🍒 **Rubor y Destellos**: Acabado satinado y saludable.
  - 💄 **Labiales y Tintas**: Fórmulas hidratantes y larga duración.
  - 👁️ **Cejas y Pestañas**: Definición y volumen profesional.
- Botón de llamado a la acción destacado en borgoña y dorado: `"Explorar Catálogo Exclusivo"`.
- Tarjeta de asesoría personalizada con enlace directo a WhatsApp para consulta de tonos con Silvia.

---

### Componente 3: Rediseño de Confirmación de Pedido con Imágenes de Productos

#### [MODIFY] [src/lib/email/templates/order-confirmation.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/templates/order-confirmation.ts)
- **Barra de Estado del Pedido**:
  - Componente visual que ilustra el avance:
    `[ ✓ Pedido Recibido ] ── [ En Preparación ] ── [ En Camino ]`
- **Tabla Enriquecida de Productos con Imágenes**:
  - Cada fila contiene:
    1. **Miniatura del Producto**: `img` de 64x64px (`object-fit: cover; border-radius: 10px; border: 1px solid #EFE4DC;`), con fallback a caja con monograma "BF" en rosa maquillaje (`#F6D6D9`).
    2. **Detalles del Producto**: Nombre en negrita, categoría y badge de tono con círculo de color (`toneHex`) si está disponible.
    3. **Cantidad**: Badge circular o centrado.
    4. **Precio Unitario y Subtotal**: En formato estándar COP (`formatCop`).
- **Resumen Financiero**:
  - Subtotal de productos.
  - Envío (con nota: "Coordinado por WhatsApp").
  - Total destacado con tipografía dorada y fondo suave.
- **Tarjeta de Envío**:
  - Icono de entrega, nombre del cliente, dirección, ciudad y teléfono con botón de llamada/WhatsApp.
- **Botón de Contacto**:
  - Botón verde WhatsApp oficial con icono y enlace prellenado con el `#` de pedido.

---

### Componente 4: Conexión de Datos de Productos

#### [MODIFY] [src/lib/email/client.ts](file:///Users/santiago/proyectos/bella-catalog/src/lib/email/client.ts)
- Enriquecer el mapeo en `sendOrderNotification`:
  - Pasar `imageUrl: i.imageUrl` (resuelto con `toAbsoluteUrl`).
  - Buscar `toneHex` si el tono está registrado o extraerlo para pintarlo en la miniatura.

---

## Plan de Tareas Detallado

### Task 1: Generar Assets de Imagen para Email
- [ ] **Step 1:** Generar `public/logo.png` desde `public/logo.webp` usando `sips`.
- [ ] **Step 2:** Verificar la existencia y dimensiones de `public/logo.png` e `public/isotipo.png`.

### Task 2: Rediseñar el Layout Base de Marca
- [ ] **Step 1:** Actualizar `src/lib/email/templates/brand-layout.ts` con la función `toAbsoluteUrl`, el nuevo header con isotipo circular, bordes dorados, paleta borgoña y footer enriquecido.
- [ ] **Step 2:** Ejecutar `pnpm typecheck` para asegurar tipado estricto.

### Task 3: Rediseñar la Plantilla de Bienvenida
- [ ] **Step 1:** Actualizar `src/lib/email/templates/welcome.ts` incorporando el banner editorial `og-bella-forever.jpg`, tarjetas visuales de categorías y botón de acción.
- [ ] **Step 2:** Ejecutar `pnpm typecheck`.

### Task 4: Rediseñar la Plantilla de Pedido con Imágenes y Swatches
- [ ] **Step 1:** Modificar la interfaz `OrderItemEmailData` en `order-confirmation.ts` para soportar `imageUrl`, `toneName` y `toneHex`.
- [ ] **Step 2:** Implementar la tabla de productos con miniaturas 64x64px, swatches de color, status tracker y tarjeta de envío.
- [ ] **Step 3:** Actualizar `src/lib/email/client.ts` para mapear las imágenes absolutas y datos de tono en `sendOrderNotification`.

### Task 5: Validación y Pruebas en Vivo
- [ ] **Step 1:** Ejecutar `pnpm typecheck`, `pnpm check` y `pnpm lint`.
- [ ] **Step 2:** Iniciar el servidor local y despachar correos de prueba actualizados a `santiagopradamoreno@gmail.com` y `silvana1isabella2501@gmail.com`.
- [ ] **Step 3:** Verificar recepción con imágenes y formato visual en clientes de correo.

---

## Verification Plan

### Automated Tests
- Ejecutar verificación de tipos:
  ```bash
  pnpm typecheck
  ```
- Ejecutar verificación diagnóstica de Astro:
  ```bash
  pnpm check
  ```
- Ejecutar linter:
  ```bash
  pnpm lint
  ```
- Compilación de producción:
  ```bash
  pnpm build
  ```

### Manual Verification
- Enviar correo de prueba con la nueva plantilla de bienvenida:
  ```bash
  curl -X POST http://localhost:4321/api/email/send \
    -H "Content-Type: application/json" \
    -d '{
      "to": ["santiagopradamoreno@gmail.com", "silvana1isabella2501@gmail.com"],
      "from": "welcome@bella-forever.com",
      "template": "welcome",
      "templateData": { "name": "Santiago y Silvana", "email": "santiagopradamoreno@gmail.com" }
    }'
  ```
- Enviar correo de prueba con la nueva plantilla de confirmación de pedido (con imágenes de productos):
  ```bash
  curl -X POST http://localhost:4321/api/email/send \
    -H "Content-Type: application/json" \
    -d '{
      "to": ["santiagopradamoreno@gmail.com", "silvana1isabella2501@gmail.com"],
      "from": "pedidos@bella-forever.com",
      "template": "order-confirmation",
      "templateData": { ... }
    }'
  ```
- Verificar en la bandeja de entrada que el logotipo, el banner y las imágenes de los productos se muestren con proporciones perfectas y acabados estéticos.
