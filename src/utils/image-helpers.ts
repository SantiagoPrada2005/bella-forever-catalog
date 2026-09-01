import type { ProductWithRelations, Tone } from '../db/schema';

export function getProductImage(
  product?: Partial<ProductWithRelations> | null,
  selectedTone?: Partial<Tone> | null
): string {
  if (selectedTone?.image) return selectedTone.image;
  if (product?.productImages && product.productImages.length > 0 && product.productImages[0]?.url) {
    return product.productImages[0].url;
  }
  if (product?.mainImage) return product.mainImage;
  return '';
}
