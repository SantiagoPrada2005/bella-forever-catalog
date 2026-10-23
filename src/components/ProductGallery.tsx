'use client';

import { useState } from 'react';
import type { ProductImage } from '../db/schema';

export interface ProductGalleryProps {
  images?: Array<Pick<ProductImage, 'url'> & Partial<Pick<ProductImage, 'altText'>>>;
  selectedToneImage?: string | null;
  productName?: string;
  fallbackImage?: string;
}

export default function ProductGallery({
  images = [],
  selectedToneImage,
  productName,
  fallbackImage,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const galleryImages =
    images && images.length > 0
      ? images
      : fallbackImage
        ? [{ url: fallbackImage, altText: productName }]
        : [];

  const mainSrc = selectedToneImage || galleryImages[activeIndex]?.url || fallbackImage;
  const hasGallery = !selectedToneImage && galleryImages.length > 1;

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'radial-gradient(circle at center, #FBF4F5 0%, #E8D2D5 100%)',
          border: '1px solid rgba(215, 176, 106, 0.25)',
          borderRadius: '14px',
          overflow: 'hidden',
          marginBottom: hasGallery ? '10px' : '0',
        }}
      >
        <img
          src={mainSrc}
          alt={productName || 'Producto'}
          width="520"
          height="520"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="eager"
        />
      </div>

      {hasGallery && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
          className="product-gallery-thumbs no-scrollbar"
        >
          {galleryImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              style={{
                flexShrink: 0,
                width: '56px',
                height: '56px',
                borderRadius: '10px',
                overflow: 'hidden',
                border:
                  index === activeIndex
                    ? '2px solid var(--catalog-accent, #D7B06A)'
                    : '1px solid var(--catalog-border-subtle, rgba(215, 176, 106, 0.18))',
                cursor: 'pointer',
                padding: 0,
                background: '#160A0D',
                transition: 'border-color 0.2s, opacity 0.2s',
                opacity: index === activeIndex ? 1 : 0.65,
              }}
            >
              <img
                src={img.url}
                alt={img.altText || `${productName || 'Producto'} imagen ${index + 1}`}
                width="56"
                height="56"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
