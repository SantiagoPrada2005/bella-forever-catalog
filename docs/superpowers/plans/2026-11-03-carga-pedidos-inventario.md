# Plan de Carga de Pedidos al Inventario y Sincronización

> **Estado**: En espera de aprobación del usuario antes de ejecutar cambios.  
> **Total unidades de los 2 pedidos**: **130 unidades** (Pedido 1: 82 unidades + Pedido 2: 48 unidades).  
> **Productos existentes a actualizar**: 9 productos (51 unidades).  
> **Productos nuevos a crear**: 25 productos (79 unidades) con datos e imágenes originales de Trendy.  
> **Stock total en base de datos**: Pasa de 112 a **242 unidades** en producción tras la carga.

---

## 1. Resumen de los 2 Pedidos de Proveedor

### Pedido 1: `Gmail - Tu pedido de Tinta Gloss Corazón ... y más 81 ítem(s) ha sido facturado.pdf`
- **Total Unidades**: **82 unidades** (Subtotal: \$410.000 COP)
- **Fecha**: 28/29 de Octubre 2026
- **Detalle de líneas**: 24 líneas de compra que suman exactamente 82 unidades.

### Pedido 2: `Tu pedido de Primer Masmelo Trend... y más 47 ítem(s) ha sido enviado.pdf`
- **Total Unidades**: **48 unidades** (Subtotal: \$403.000 COP)
- **Fecha**: 27 de Octubre 2026
- **Detalle de líneas**: 17 líneas de compra que suman exactamente 48 unidades.

**Total acumulado de ambos pedidos**: 82 + 48 = **130 unidades exactas**.

---

## 2. Diagnóstico del Error Previo de Cantidades (Suma de 10 unidades)

> [!CAUTION]
> **Causa Raíz Identificada:**  
> Al inspeccionar el esquema de base de datos de producción (`backups/backup-production-20261103-pre-orders.sql`), la columna `stock` en la tabla `Product` fue creada originalmente con:  
> `stock integer DEFAULT 10 NOT NULL`  
> Por tanto, en migraciones anteriores donde se creaba un producto o se hacía un cálculo de tono que dejaba el stock sin especificar o en cero, la base de datos aplicaba automáticamente el valor por defecto de 10 en lugar del stock real.
> 
> **Medidas de Seguridad en este Plan:**  
> 1. Todas las sentencias `INSERT` asignan explícitamente el valor numérico exacto de `stock`.  
> 2. Todas las actualizaciones `UPDATE` establecen `stock = <nuevo_valor_calculado_exacto>` en lugar de depender de acumuladores ciegos.  
> 3. Se ejecuta un script de aserción matemática que verifica que `stock_anterior + incoming_qty == stock_nuevo` para cada producto individual y que el stock global sume exactamente `112 + 130 = 242`.

---

## 3. Desglose de Productos Existentes (Actualización de Stock)

Los siguientes 9 productos ya existen en la base de datos de producción (`Product`). Se actualizará su stock sumando exactamente las unidades recibidas y pasando `inStock = 1`:

| Producto | Tono / Ref | Stock Actual (Prod) | Cantidad Pedido 1 | Cantidad Pedido 2 | Total Entrante | Stock Final |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Barra Multipropósito Mejillas y Labios** | Estándar (`BMT1497`) | 0 | - | 8 | +8 | **8** |
| **Base Aura Trendy** | Tono 02 (`BAT2272 #2`) | 2 (Tono 2.5: 0, Tono 3: 1) | 1 | - | +1 | **3** (se crea/asigna Tono 02 con 1) |
| **Brillo Mágico Doble Perfect Match Trendy** | Estándar (`BPM1426`) | 0 | - | 10 | +10 | **10** |
| **Brillo de Labios Aura Trendy** | Tono 05 (`BAT1878#5`) | 1 (01: 0, 02: 1) | - | 3 | +3 | **4** (se crea Tono 05 con 3) |
| **Brillo de Labios Lip Oil Pretty Things** | Tono 01 y Tono 04 (`BPT1963`) | 1 (Tono 01: 0) | - | 2 (T01) + 2 (T04) | +4 | **5** (T01: 2, T04: 2) |
| **Lip Balm Glitter Hamm Trendy** | Tono 02 y Tono 03 (`DYT2683`) | 1 (Tono 02: 0) | - | 1 (T02) + 1 (T03) | +2 | **3** (T02: 1, T03: 1) |
| **Rubor en Barra Trendy Blush Love** | Estándar (`BL07`) | 1 | - | 2 | +2 | **3** |
| **Tinta Gloss Corazón Trendy** | Estándar (`TGT1896`) | 0 | 20 | - | +20 | **20** |
| **Tinta con Escarcha Be Mine** | Estándar (`TEB1745`) | 0 | - | 1 | +1 | **1** |
| **TOTAL UNIDADES EN EXISTENTES** | | | **21** | **30** | **+51** | |

---

## 4. Desglose de Productos Nuevos a Crear (25 Productos)

Se crearán con sus descripciones oficiales, categorías, precios sugeridos de venta, imágenes originales obtenidas de `proveedores/trendy` y sus tonos respectivos:

| # | Producto | Categoría | Ref / SKU | Precio Venta Sugerido | Tonos | Cantidad Pedido |
| :- | :--- | :--- | :--- | :---: | :--- | :---: |
| 1 | **Rubor Blush Stamp Trendy** | `rostro` | `STN-RBS1312` | \$20.000 | N/A | **2** |
| 2 | **Mini Rubor Mía Blush Trendy** | `rostro` | `MRM2730` | \$10.000 | Tono 01 (3), Tono 02 (3) | **6** |
| 3 | **Polvo Suelto Arenita Bob Esponja** | `rostro` | `STN-PSA2483` | \$15.000 | N/A | **2** |
| 4 | **Delineador Doble Cat Eye Trendy** | `ojos` | `ESTANDAR CE10` | \$15.000 | N/A | **2** |
| 5 | **Labial Red Velvet Trendy** | `labiales` | `STN-LRV2051` | \$10.000 | N/A | **3** |
| 6 | **Kit Labios Love Travel Trendy** | `labiales` | `STN-KLT2088` | \$10.000 | N/A | **3** |
| 7 | **Cosmetiquera Mármol Trendy** | `accesorios-de-maquillaje` | `STN-CMT649` | \$12.000 | N/A | **5** |
| 8 | **Brillo Lip Oil Sandía Trendy** | `labiales` | `BLS2258 #4` | \$8.000 | Tono Sandía | **5** |
| 9 | **Contorno en Crema Bronzer Stamp** | `rostro` | `BET1496` | \$20.000 | Tono 01 (1), Tono 02 (1) | **2** |
| 10 | **Brillos de los Recuerdos Intensamente** | `labiales` | `DY2099` | \$8.000 | Alegría (2), Ansiedad (2), Furia (2) | **6** |
| 11 | **Hidratante Mágico Aloe Vera Trendy** | `labiales` | `STN-HMA1460` | \$8.000 | N/A | **3** |
| 12 | **Sticker Festivalero Trendy** | `accesorios-de-maquillaje` | `STN-SFT2302` | \$5.000 | N/A | **1** |
| 13 | **Iluminador Donut Trendy** | `rostro` | `ESTANDAR HD26` | \$10.000 | N/A | **4** |
| 14 | **Rubor Cat Trendy** | `rostro` | `STN-CBT1500` | \$15.000 | N/A | **2** |
| 15 | **Grip Primer Buzz Pequeño Disney x Trendy** | `rostro` | `STN-DYT2547` | \$20.000 | N/A | **1** |
| 16 | **Kit de Labios Furia Intensamente Trendy** | `labiales` | `DY2098` | \$30.000 | N/A | **2** |
| 17 | **Toallas Desmaquillantes Pool Party Pequeñas** | `skincare` | `STN-TDP2729` | \$10.000 | N/A | **5** |
| 18 | **Kit x2 Almohaditas de Maquillaje Trendy** | `accesorios-de-maquillaje` | `AHM1142` | \$8.000 | N/A | **7** |
| 19 | **Polvos Sueltos Bakery Grande Trendy** | `rostro` | `STN-PSB1688` | \$20.000 | N/A | **2** |
| 20 | **Primer Masmelo Trendy** | `rostro` | `ESTANDAR PM02` | \$25.000 | N/A | **6** |
| 21 | **Rubor en Crema Beverly Hills Trendy** | `rostro` | `RBH1651` | \$15.000 | Tono 01 (1), Tono 02 (1) | **2** |
| 22 | **Lápiz para Cejas Beauty Glazed** | `ojos` | `B69` | \$10.000 | Tono 02 (1) | **1** |
| 23 | **Iluminador Horneado Chocolate Trendy** | `rostro` | `STN-ICT1768` | \$15.000 | N/A | **1** |
| 24 | **Iluminador Líquido Corporal Urban Trendy** | `rostro` | `STN-ICU2172` | \$12.000 | N/A | **1** |
| 25 | **Tinta Soda Trendy** | `labiales` | `STN-STT1328` | \$10.000 | N/A | **5** |
| | **TOTAL UNIDADES EN PRODUCTOS NUEVOS** | | | | | **79** |

---

## 5. Paso a Paso de Ejecución

### Fase 1: Sincronización Local con Producción
- [x] Respaldo de producción generado: `backups/backup-production-20261103-pre-orders.sql`.
- [x] Respaldo previo de base local SQLite: `backups/local-backup-pre-clone-20261103.sqlite`.
- [ ] Aplicar el dump de producción sobre la base de datos local miniflare D1 (`.wrangler/state/v3/d1/...sqlite`).
- [ ] Verificar que la base local cuenta con exactamente 78 productos y 112 unidades en stock total antes de las modificaciones.

### Fase 2: Gestión de Imágenes de Trendy
- [ ] Copiar las imágenes originales de los 25 nuevos productos desde `proveedores/trendy/imagenes/` hacia `public/images/products/`.
- [ ] Descargar imágenes de alta resolución directamente del CDN de Trendy para los productos de edición especial (como Rubor Cat, Kit Labios Furia, Almohaditas y Urban Iluminador).
- [ ] Ejecutar optimización de imágenes (`pnpm images:optimize`) para asegurar tiempos de carga rápidos.

### Fase 3: Script de Migración Local (`drizzle/0009_load_supplier_orders_inventory.sql`)
- [ ] Escribir la migración SQL transaccional con IDs UUID v4, relaciones con categorías existentes y `stock` exacto.
- [ ] Crear los registros en `Product` para los 25 productos nuevos.
- [ ] Crear los registros en `Tone` para los productos con variantes.
- [ ] Ejecutar los `UPDATE` para los 9 productos existentes.
- [ ] Aplicar la migración en local: `pnpm wrangler d1 execute bella-forever-db --local --file=drizzle/0009_load_supplier_orders_inventory.sql`.

### Fase 4: Verificación Rigurosa de Cantidades y Consistencia
- [ ] Ejecutar script de verificación automatizado en local:
  - Total productos: 78 + 25 = 103.
  - Total stock: 112 + 130 = 242.
  - Verificar cada uno de los 34 productos individualmente comparando contra las líneas de compra de los PDFs.
  - Verificar que `inStock` sea `1` para todos los productos y tonos con stock > 0.
- [ ] Ejecutar `pnpm build` para validar que Astro compila sin errores de tipos ni rutas.
- [ ] Presentar reporte de verificación en consola al usuario.

### Fase 5: Despliegue a Producción (Solo tras confirmación explícita)
- [ ] Confirmación del usuario recibida.
- [ ] Aplicar migración en base de datos remota:  
  `pnpm wrangler d1 execute bella-forever-db --remote --file=drizzle/0009_load_supplier_orders_inventory.sql`
- [ ] Desplegar la aplicación y assets actualizados a Cloudflare:  
  `pnpm deploy`
- [ ] Validar en producción el conteo final de productos y stock remoto.

---

## 6. Plan de Verificación

### Pruebas Automatizadas
1. **Verificación de Inventario Matemático**:
   ```bash
   uv run python3 -c "
   import sqlite3
   # Verificación de que cada producto tiene exactamente la suma de unidades esperada
   "
   ```
2. **Chequeo de Compilación y Tipado**:
   ```bash
   pnpm check
   pnpm build
   ```
3. **Comprobación de Integridad de Imágenes**:
   Verificar que cada `mainImage` referenciada en la tabla `Product` existe físicamente en `public/images/products/`.

### Verificación Manual para el Usuario
- Ingresar al catálogo local (`http://localhost:4321`) y al panel de administración.
- Comprobar que los productos nuevos aparecen en sus respectivas categorías (Rostro, Labiales, Ojos, Skincare, Accesorios).
- Comprobar que los tonos se muestran correctamente en los selectores de productos con variantes.

