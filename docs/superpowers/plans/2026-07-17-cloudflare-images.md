# Cloudflare Images Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans.

**Goal:** Migrate image upload/storage from AWS SDK (S3-compatible) to Workers-native R2 binding, and serve images through an optimized proxy route.

**Architecture:** Rewrite upload route to use R2 binding. Create image proxy route that serves from R2 with cache headers. Clean up AWS SDK and env vars.

**Tech Stack:** Next.js 15, Cloudflare Workers, R2 (via Workers binding), Drizzle ORM

## Global Constraints

- Must use native Workers R2 binding, not S3-compatible API
- Must access Cloudflare bindings via `globalThis[Symbol.for("__cloudflare-context__")].env`
- Must not introduce new dependencies
- Legacy image URLs (R2 public URLs) in DB must continue working
- Bucket name: `bella`

---

### Task 1: R2 Binding + Upload Route

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `app/api/upload/route.js`
- Modify: `src/lib/r2.js` (remove AWS SDK, keep only publicUrl helper)
- Delete: `src/lib/r2.js`

**Interfaces:**
- Consumes: existing bucket `bella`
- Produces: R2 binding `BELLA_IMAGES`, new upload endpoint that returns `/api/images/{key}`

- [ ] **Step 1: Add R2 bucket binding to wrangler.jsonc**

Add after the existing `d1_databases` entry:

```jsonc
"r2_buckets": [
  {
    "binding": "NEXT_INC_CACHE_R2_BUCKET",
    "bucket_name": "bella-forever-catalog-opennext-cache"
  },
  {
    "binding": "BELLA_IMAGES",
    "bucket_name": "bella"
  }
],
```

Get the bucket ID:
```bash
npx wrangler r2 bucket list
```

If `bella` doesn't appear, create it:
```bash
npx wrangler r2 bucket create bella
```

Once the bucket exists, get its ID:
```bash
npx wrangler r2 bucket info bella
```

Update `wrangler.jsonc` to include the `bucket_id` if needed (not required for R2, unlike D1).

- [ ] **Step 2: Rewrite upload route to use R2 binding**

Write `app/api/upload/route.js`:

```javascript
import { NextResponse } from 'next/server';

function getR2Bucket() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')];
  if (!ctx?.env?.BELLA_IMAGES) {
    throw new Error('R2 binding BELLA_IMAGES not found in Cloudflare env');
  }
  return ctx.env.BELLA_IMAGES;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${cleanFileName}`;

    const bucket = getR2Bucket();
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });

    const fileUrl = `/api/images/${key}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir archivo a R2:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la carga.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Delete old r2.js library**

```bash
rm src/lib/r2.js
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

---

### Task 2: Image Proxy Route

**Files:**
- Create: `app/api/images/[...path]/route.js`

**Interfaces:**
- Consumes: R2 binding `BELLA_IMAGES`
- Produces: GET handler that serves images from R2 with cache headers

- [ ] **Step 1: Create the catch-all route**

Create directory and file:
```bash
mkdir -p app/api/images/\[...path\]
```

Write `app/api/images/[...path]/route.js`:

```javascript
import { NextResponse } from 'next/server';

const CACHE_LONG = 'public, max-age=31536000, immutable';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function getR2Bucket() {
  const ctx = globalThis[Symbol.for('__cloudflare-context__')];
  if (!ctx?.env?.BELLA_IMAGES) {
    throw new Error('R2 binding BELLA_IMAGES not found in Cloudflare env');
  }
  return ctx.env.BELLA_IMAGES;
}

export async function GET(request, { params }) {
  try {
    const path = params.path.join('/');
    const bucket = getR2Bucket();
    const object = await bucket.get(path);

    if (!object) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const response = new NextResponse(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_LONG,
        'CDN-Cache-Control': CACHE_LONG,
      },
    });

    return response;
  } catch (error) {
    console.error('Error al servir imagen:', error);
    return NextResponse.json({ error: 'Error al servir imagen' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build and test**

```bash
npm run build
```

Deploy and verify:

```bash
npm run deploy
```

Test with an existing image URL from the DB (access via proxy):
```bash
# First, check what's in the DB
npx wrangler d1 execute bella-forever-db --remote --command="SELECT mainImage FROM Product LIMIT 1"
```

Then construct the proxy URL and test.

---

### Task 3: Update ImageUpload Component

**Files:**
- Modify: `src/components/ui/ImageUpload.jsx`

- [ ] **Step 1: Update ImageUpload to show preview correctly with relative URLs**

The component already works with any URL format (it just sets `src={value}`). The only change needed is to ensure the preview shows correctly with `/api/images/` URLs. The existing placeholder text says `https://ejemplo.com/imagen.jpg` — update it to be format-agnostic.

In `src/components/ui/ImageUpload.jsx`, change line 57:
```jsx
placeholder="URL de la imagen o sube un archivo"
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

---

### Task 4: Clean Up

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.dev.vars`

- [ ] **Step 1: Remove AWS SDK dependency**

```bash
npm uninstall @aws-sdk/client-s3
```

- [ ] **Step 2: Remove R2 env vars from .env.example**

Write `.env.example`:

```
# Cloudflare D1 database (SQLite) — no env vars needed, uses D1 binding
# Cloudflare R2 images — no env vars needed, uses R2 binding
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
npm run lint
```

- [ ] **Step 4: Deploy**

```bash
npm run deploy
```

- [ ] **Step 5: Verify all routes work**

```bash
curl -s -o /dev/null -w "%{http_code}" https://bella-forever-catalog.santiagopradamoreno.workers.dev/
curl -s -o /dev/null -w "%{http_code}" https://bella-forever-catalog.santiagopradamoreno.workers.dev/admin
curl -s -o /dev/null -w "%{http_code}" https://bella-forever-catalog.santiagopradamoreno.workers.dev/catalogo
```
