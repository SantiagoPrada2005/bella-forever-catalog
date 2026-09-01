'use client';

import React, { useState } from 'react';

/**
 * ProductGallery — Client Component
 *
 * Renders a main image with a thumbnail strip below. Supports:
 * - Clicking thumbnails to swap the main image
 * - Tone image override (selectedToneImage wins over gallery)
 * - Mobile: max 5 visible thumbnails with overflow scroll
 * - Desktop: show all thumbnails
 * - Lazy loading for images after the first
 */
export default function ProductGallery({ images = [], selectedToneImage, productName, fallbackImage }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Normalizar lista de imágenes con fallback a mainImage
  const galleryImages = images && images.length > 0
    ? images
    : (fallbackImage ? [{ url: fallbackImage, altText: productName }] : []);

  // Si hay imagen específica del tono, prevalece; si no, la de la galería o el fallback
  const mainSrc = selectedToneImage || galleryImages[activeIndex]?.url || fallbackImage;
  const hasGallery = !selectedToneImage && galleryImages.length > 1;

  const handleThumbnailClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Main image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          backgroundColor: '#1a0f12',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: hasGallery ? '12px' : '0',
        }}
      >
        <img
          src={mainSrc}
          alt={productName || 'Producto'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="eager"
        />
      </div>

      {/* Thumbnail strip — only shown when there's a gallery AND no tone is selected */}
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
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              style={{
                flexShrink: 0,
                width: '60px',
                height: '60px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: index === activeIndex
                  ? '2px solid var(--color-gold)'
                  : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                padding: 0,
                background: 'none',
                transition: 'border-color 0.2s, opacity 0.2s',
                opacity: index === activeIndex ? 1 : 0.65,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (index !== activeIndex) {
                  e.currentTarget.style.opacity = '0.65';
                }
              }}
            >
              <img
                src={img.url}
                alt={img.altText || `${productName || 'Producto'} imagen ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </button>
          ))}

          {/* Mobile: limit to 5 visible thumbnails, scroll for more */}
          <style>{`
            @media (max-width: 767px) {
              .product-gallery-thumbs {
                max-width: calc(60px * 5 + 8px * 4);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
