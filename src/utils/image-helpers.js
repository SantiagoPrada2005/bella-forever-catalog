/**
 * Image helpers: shared fallback chain for product image resolution.
 *
 * Fallback chain: selectedTone?.image → product.images[0]?.url → product.mainImage
 *
 * This is the canonical source of truth for image resolution across the entire app.
 * Components that need a display image should use this function rather than
 * building their own fallback logic inline.
 */

export function getProductImage(product, selectedTone) {
  return selectedTone?.image
    || product?.productImages?.[0]?.url
    || product?.images?.[0]?.url
    || product?.mainImage;
}
