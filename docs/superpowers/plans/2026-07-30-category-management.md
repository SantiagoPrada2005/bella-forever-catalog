# Category Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full dynamic category management in the `/admin` dashboard and integrate dynamic categories into product forms and the public catalog.

**Architecture:** Add a `Category` table in Drizzle ORM (`src/db/schema.ts`), implement Server Actions in `app/admin/actions.js` for CRUD operations and orphan product re-assignment to "Sin categoría", add a Category tab in `AdminDashboardClient.jsx`, and fetch dynamic categories in admin forms and `CatalogClient.jsx`.

**Tech Stack:** Next.js 15 (App Router, Server Actions), Drizzle ORM (SQLite / D1), React 19, Tailwind/CSS.

## Global Constraints
- Target database: Cloudflare D1 via Drizzle ORM (`src/db/schema.ts` and `src/lib/db.ts`).
- Route revalidation: Must revalidate `/admin` and `/catalogo` after category mutations.
- Protected category: `sin-categoria` ("Sin categoría") cannot be deleted or have its slug altered.

---

### Task 1: Database Schema Update & Migration

**Files:**
- Modify: `src/db/schema.ts:1-37`
- Create: `drizzle/0001_add_categories.sql` (or generated migration file)

**Interfaces:**
- Consumes: Drizzle ORM sqliteTable
- Produces: `categories` table export (`id`, `name`, `slug`, `createdAt`, `updatedAt`)

- [ ] **Step 1: Update schema in `src/db/schema.ts`**

Add `categories` table definition:

```typescript
export const categories = sqliteTable('Category', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});
```

- [ ] **Step 2: Generate Drizzle migration or SQL schema file**

Run: `npx drizzle-kit generate` or create migration script.

- [ ] **Step 3: Verify schema compilation with oxlint**

Run: `pnpm run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit schema changes**

```bash
git add src/db/schema.ts drizzle/
git commit -m "schema: add Category table to Drizzle schema"
```

---

### Task 2: Implement Category Server Actions

**Files:**
- Modify: `app/admin/actions.js`

**Interfaces:**
- Consumes: `categories`, `products` from `src/db/schema.ts`
- Produces: `getCategories()`, `createCategory(name)`, `updateCategory(id, name)`, `deleteCategory(id)`

- [ ] **Step 1: Implement `getCategories()` and initial seed logic**

Add `getCategories` to `app/admin/actions.js`:

```javascript
export async function getCategories() {
  const db = getDb();
  let result = await db.select().from(categories).all();
  if (result.length === 0) {
    const now = new Date().toISOString();
    const defaultCats = [
      { id: 'sin-categoria', name: 'Sin categoría', slug: 'sin-categoria', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Rubor', slug: 'rubor', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Labiales', slug: 'labiales', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Cejas', slug: 'cejas', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Pestañas', slug: 'pestanas', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), name: 'Correctores', slug: 'correctores', createdAt: now, updatedAt: now },
    ];
    await db.insert(categories).values(defaultCats).run();
    result = await db.select().from(categories).all();
  }
  return result;
}
```

- [ ] **Step 2: Implement `createCategory`, `updateCategory`, `deleteCategory`**

```javascript
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function createCategory(name) {
  const db = getDb();
  const now = new Date().toISOString();
  const slug = slugify(name);
  const id = crypto.randomUUID();

  await db.insert(categories).values({
    id,
    name,
    slug,
    createdAt: now,
    updatedAt: now,
  }).run();

  revalidatePath('/admin');
  revalidatePath('/catalogo');
  return { id, slug };
}

export async function updateCategory(id, name) {
  const db = getDb();
  const now = new Date().toISOString();
  const slug = id === 'sin-categoria' ? 'sin-categoria' : slugify(name);

  await db.update(categories)
    .set({ name, slug, updatedAt: now })
    .where(eq(categories.id, id))
    .run();

  revalidatePath('/admin');
  revalidatePath('/catalogo');
}

export async function deleteCategory(id) {
  if (id === 'sin-categoria') {
    throw new Error('No se puede eliminar la categoría por defecto');
  }
  const db = getDb();
  const targetCat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!targetCat) return;

  // Reassign products to 'sin-categoria'
  await db.update(products)
    .set({ category: 'sin-categoria' })
    .where(eq(products.category, targetCat.slug))
    .run();

  await db.delete(categories)
    .where(eq(categories.id, id))
    .run();

  revalidatePath('/admin');
  revalidatePath('/catalogo');
}
```

- [ ] **Step 3: Run lint to verify syntax**

Run: `pnpm run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit Server Actions**

```bash
git add app/admin/actions.js
git commit -m "feat: add category CRUD server actions"
```

---

### Task 3: Category Management Tab in Admin Dashboard

**Files:**
- Modify: `app/admin/AdminDashboardClient.jsx`

**Interfaces:**
- Consumes: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` from `app/admin/actions.js`
- Produces: UI tab switcher ("Productos" | "Categorías") and Category Management view

- [ ] **Step 1: Add Category tab state and loading logic in `AdminDashboardClient.jsx`**

Add active tab state (`activeTab`: `'products'` | `'categories'`) and category list state with `fetchCategories` helper.

- [ ] **Step 2: Add category creation form and list table with Edit/Delete capabilities**

Render interactive list of categories with inline editing mode (input field + Guardar/Cancelar) and deletion confirmation.

- [ ] **Step 3: Verify build and lint**

Run: `pnpm run lint && pnpm run build`
Expected: Successful build.

- [ ] **Step 4: Commit Admin Dashboard changes**

```bash
git add app/admin/AdminDashboardClient.jsx
git commit -m "feat: add category management tab to admin dashboard"
```

---

### Task 4: Integrate Dynamic Categories in Product Forms

**Files:**
- Modify: `app/admin/nuevo/NewProductClient.jsx`
- Modify: `app/admin/editar/[id]/page.jsx` or edit component

**Interfaces:**
- Consumes: `getCategories()` from `app/admin/actions.js`
- Produces: Dynamic `<select>` element populated with actual categories from D1

- [ ] **Step 1: Load categories in `NewProductClient.jsx`**

Fetch categories on mount (`useEffect` + `getCategories`) and map options dynamically.

- [ ] **Step 2: Load categories in Edit Product form**

Ensure category selector in the Edit Product screen loads categories dynamically from DB.

- [ ] **Step 3: Verify linting and build**

Run: `pnpm run lint && pnpm run build`
Expected: Clean build.

- [ ] **Step 4: Commit form updates**

```bash
git add app/admin/nuevo/ app/admin/editar/
git commit -m "feat: dynamic category selector in product creation and edit forms"
```

---

### Task 5: Dynamic Categories in Public Catalog

**Files:**
- Modify: `app/catalogo/CatalogClient.jsx`
- Modify: `app/catalogo/page.jsx` (if passing initial categories from server)

**Interfaces:**
- Consumes: `getCategories()`
- Produces: Dynamic filter tabs in `/catalogo`

- [ ] **Step 1: Fetch categories server-side or client-side for `CatalogClient.jsx`**

Update `CatalogClient.jsx` to receive or fetch categories dynamically and render category tabs based on DB entries plus "Todos".

- [ ] **Step 2: Test full build and deployment readiness**

Run: `pnpm run build`
Expected: OpenNext Cloudflare build success.

- [ ] **Step 3: Commit catalog updates**

```bash
git add app/catalogo/
git commit -m "feat: dynamic category filter tabs in public catalog"
```
