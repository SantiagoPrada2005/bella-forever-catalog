# Especificación Técnica: Gestión Dinámica de Categorías en Admin

## Visión General
Esta especificación define la arquitectura e implementación para la gestión dinámica de categorías de productos en el catálogo de Bella Forever. Permite a los administradores crear, editar y eliminar categorías desde el panel `/admin`, persistiendo los cambios en la base de datos Cloudflare D1 / SQLite vía Drizzle ORM y actualizando dinámicamente los selectores en administración y el catálogo público.

## 1. Esquema de Base de Datos (`src/db/schema.ts`)

Se añadirá la tabla `categories`:

```typescript
export const categories = sqliteTable('Category', {
  id: text('id').primaryKey(), // UUID o slug
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});
```

### Categoría por defecto y sembrado inicial
- Categoría por defecto para huérfanos: ID: `sin-categoria`, Nombre: `"Sin categoría"`, Slug: `"sin-categoria"`.
- Migración/Sembrado: Al inicializar o mediante script/función de verificación, se asegurará la existencia de las categorías iniciales (`Rubor`, `Labiales`, `Cejas`, `Pestañas`, `Correctores`, `Sin categoría`).

## 2. Acciones del Servidor (`app/admin/actions.js`)

Se expondrán las siguientes Server Actions:

1. `getCategories()`: Retorna todas las categorías ordenadas por nombre.
2. `createCategory(name)`:
   - Normaliza el slug a partir del nombre (ej. `"Labiales Mate"` -> `"labiales-mate"`).
   - Genera UUID y guarda en la tabla `categories`.
   - Revalida las rutas `/admin` y `/catalogo`.
3. `updateCategory(id, name)`:
   - Actualiza `name` y recalcula `slug` (excepto para `sin-categoria` cuyo slug se mantiene protegido).
   - Revalida `/admin` y `/catalogo`.
4. `deleteCategory(id)`:
   - Protege la categoría `sin-categoria` (no se puede eliminar).
   - Reasigna todos los productos asociados (`products.category == id` o `products.category == old_slug`) a la categoría `'sin-categoria'`.
   - Elimina el registro de la tabla `categories`.
   - Revalida `/admin` y `/catalogo`.

## 3. Componentes de Interfaz de Usuario (UI)

### 3.1 Dashboard de Administración (`app/admin/AdminDashboardClient.jsx`)
- Pestañas/Tabs superiores en `/admin` para alternar entre:
  - **Productos** (Vista actual)
  - **Categorías** (Nueva vista)
- **Vista de Categorías**:
  - Formulario superior para añadir nueva categoría (input `Nombre`, botón `Guardar`).
  - Tabla o lista de categorías con:
    - Nombre de la categoría.
    - Slug.
    - Conteo de productos asociados.
    - Acciones: **Editar** (modo edición inline o modal simple) y **Eliminar** (con confirmación).

### 3.2 Formularios de Producto (`app/admin/nuevo/NewProductClient.jsx` y `app/admin/editar/[id]/`)
- Reemplazar la lista estática `CONFIG.categories` por la llamada asíncrona a `getCategories()`.
- Renderizar dinámicamente las opciones `<option value={cat.slug}>{cat.name}</option>`.

### 3.3 Catálogo Público (`app/catalogo/CatalogClient.jsx`)
- Cargar categorías mediante `getCategories()` o prop del servidor.
- Generar dinámicamente las pestañas de filtro (incluyendo `"Todos"` como primera opción).

## 4. Plan de Verificación

1. **Pruebas de Base de Datos / Migración**:
   - Generar y aplicar la migración Drizzle `drizzle-kit generate` o migración manual D1.
   - Verificar la presencia de la tabla `Category`.
2. **Pruebas de Funcionalidad Admin**:
   - Crear una nueva categoría (ej. `"Iluminadores"`).
   - Crear o editar un producto asignándole la nueva categoría `"Iluminadores"`.
   - Editar el nombre de la categoría `"Iluminadores"` a `"Iluminadores & Bronzer"`.
   - Eliminar una categoría con productos y comprobar que los productos pasan a `"Sin categoría"`.
3. **Pruebas en Catálogo**:
   - Navegar a `/catalogo` y verificar que la pestaña de la nueva categoría aparece y filtra correctamente los productos.
