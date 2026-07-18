# Cloudflare Images: Migración a R2 binding nativo + proxy de imágenes

## Objetivo
Migrar el manejo de imágenes del catálogo Bella Forever de AWS SDK (S3-compatible) a Workers-native R2 binding, y agregar un proxy que permita transformaciones de imágenes on-the-fly.

## Estado actual
- Upload via `@aws-sdk/client-s3` (`PutObjectCommand`) al bucket R2 `bella`
- 4 env vars requeridas: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- Imágenes servidas directamente desde R2 public URL sin optimización
- Sin transformaciones (no redimension, no WebP)

## Arquitectura nueva

```
ImageUpload Component → POST /api/upload → env.BELLA_IMAGES.put() → URL: /api/images/{key}

Display → <img src="/api/images/{key}?w=400&q=80">
  → Image Proxy Route → env.BELLA_IMAGES.get(key)
    → Si hay params de transform: fetch con cf.image (redimension, WebP, calidad)
    → Si no: blob directo con Cache-Control óptimo
```

## Componentes

### 1. Binding R2 en wrangler.jsonc
- Agregar `r2_buckets` entry: `BELLA_IMAGES` → bucket `bella`
- Elimina necesidad de las 4 env vars R2

### 2. Upload route (`app/api/upload/route.js`)
- Reemplazar `PutObjectCommand` por `env.BELLA_IMAGES.put(key, await file.arrayBuffer())`
- Cambiar URL retornada de R2 public URL → `/api/images/uploads/{key}`
- Mantener mismo endpoint y formato de request/respuesta

### 3. Image proxy route (`app/api/images/[...path]/route.js`)
- Ruta dinámica que captura el path completo
- Obtiene binding R2 desde Cloudflare context
- Lee objeto de R2: `env.BELLA_IMAGES.get(key)`
- Si hay query params (`w`, `q`, `fmt`): fetch a R2 public URL con `cf.image` transforms
- Si no: devuelve blob directo con `Cache-Control: public, max-age=31536000, immutable`
- Maneja errores: 404 si no existe, 500 si falla

### 4. Limpieza
- `npm uninstall @aws-sdk/client-s3`
- Eliminar credenciales R2 de `.env.example` y `.dev.vars`

### 5. URLs existentes en DB
- URLs legacy (R2 public URLs) se mantienen intactas en la DB
- Nuevas subidas usan formato `/api/images/uploads/{key}`
- El componente `ImageUpload` se actualiza para mostrar preview correcto con ambos formatos

## Transformaciones (cf.image)

| Contexto | Parámetros | Ejemplo URL |
|----------|-----------|-------------|
| Thumbnail admin | `?w=50&q=60` | `/api/images/uploads/foo.jpg?w=50&q=60` |
| Card catálogo | `?w=400&q=80` | `/api/images/uploads/foo.jpg?w=400&q=80` |
| Modal producto | `?w=800&q=90` | `/api/images/uploads/foo.jpg?w=800&q=90` |
| Sin params | — | `/api/images/uploads/foo.jpg` |

Nota: `cf.image` requiere el add-on Cloudflare Image Resizing (pago) para aplicar transformaciones. Sin él, el proxy sirve el original con cache headers óptimos. La arquitectura está preparada para activarlo sin cambios de código.

## Cambios de archivos

| Archivo | Acción |
|---------|--------|
| `wrangler.jsonc` | Agregar R2 binding `BELLA_IMAGES` → `bella` |
| `app/api/upload/route.js` | Reescribir: usar R2 binding en vez de AWS SDK |
| `app/api/images/[...path]/route.js` | Crear: image proxy route |
| `src/components/ui/ImageUpload.jsx` | Actualizar: mostrar preview con URLs `/api/images/` |
| `src/lib/r2.js` | Eliminar (código muerto) |
| `package.json` | Remover `@aws-sdk/client-s3` |
| `.env.example` | Eliminar vars R2 |
| `.dev.vars` | Eliminar vars R2 |

## Orden de implementación
1. Agregar binding R2 en wrangler.jsonc
2. Reescribir upload route
3. Crear image proxy route
4. Actualizar ImageUpload component
5. Limpiar dependencias y env vars
6. Build + deploy + verificar
