'use client';

import { useState, useRef, type TouchEvent } from 'react';
import type { ProductImage } from '../db/schema';

export interface ProductGalleryProps {
  images?: Array<Pick<ProductImage, 'url'> & Partial<Pick<ProductImage, 'altText'>>>;
  selectedToneImage?: string | null;
  selectedToneName?: string | null;
  productName?: string;
  fallbackImage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export default function ProductGallery({
  images = [],
  selectedToneImage,
  selectedToneName,
  productName,
  fallbackImage,
  isNew = false,
  isFeatured = false,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  // Construimos una lista unificada y sin duplicados donde la imagen del tono seleccionado encabeza la galería
  const unifiedImages: Array<{ url: string; altText: string }> = [];
  const seenUrls = new Set<string>();

  const pushUnique = (url?: string | null, altText?: string | null) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    unifiedImages.push({
      url,
      altText: altText || productName || 'Producto Bella Forever',
    });
  };

  if (selectedToneImage) {
    pushUnique(
      selectedToneImage,
      `${productName || 'Producto'}${selectedToneName ? ` - Tono ${selectedToneName}` : ''}`
    );
  }

  if (fallbackImage) {
    pushUnique(fallbackImage, productName);
  }

  for (const img of images) {
    pushUnique(img.url, img.altText || productName);
  }

  const safeIndex = activeIndex < unifiedImages.length ? activeIndex : 0;
  const mainSlide = unifiedImages[safeIndex] ?? {
    url: selectedToneImage || fallbackImage || '',
    altText: productName || 'Producto',
  };
  const hasMultiple = unifiedImages.length > 1;

  const handlePrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev - 1 + unifiedImages.length) % unifiedImages.length);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev + 1) % unifiedImages.length);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || !hasMultiple) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 36) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'radial-gradient(circle at center, #FBF4F5 0%, #E8D2D5 100%)',
          border: '1px solid rgba(215, 176, 106, 0.28)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: hasMultiple ? '10px' : '0',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.38)',
        }}
      >
        <img
          key={mainSlide.url}
          src={mainSlide.url}
          alt={mainSlide.altText}
          width="520"
          height="520"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="eager"
        />

        {/* Badges de estado sobre la esquina superior izquierda */}
        {(isNew || isFeatured) && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              gap: '6px',
              zIndex: 2,
            }}
          >
            {isNew && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(18, 6, 9, 0.82)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(215, 176, 106, 0.55)',
                  color: 'var(--catalog-accent, #D7B06A)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Nuevo
              </span>
            )}
            {isFeatured && !isNew && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(90, 22, 35, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(215, 176, 106, 0.55)',
                  color: '#FCF9F9',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Favorito
              </span>
            )}
          </div>
        )}

        {/* Controles táctiles y contador cuando hay múltiples fotos */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 6, 9, 0.72)',
                border: '1px solid rgba(215, 176, 106, 0.35)',
                color: '#FCF9F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
                zIndex: 2,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente imagen"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 6, 9, 0.72)',
                border: '1px solid rgba(215, 176, 106, 0.35)',
                color: '#FCF9F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
                zIndex: 2,
              }}
            >
              ›
            </button>
            <span
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 6, 9, 0.76)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                color: '#FCF9F9',
                fontSize: '0.68rem',
                fontWeight: 600,
                zIndex: 2,
              }}
            >
              {safeIndex + 1} / {unifiedImages.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
          className="product-gallery-thumbs no-scrollbar"
        >
          {unifiedImages.map((img, index) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver foto ${index + 1} de ${productName || 'producto'}`}
              style={{
                flexShrink: 0,
                width: '58px',
                height: '58px',
                borderRadius: '10px',
                overflow: 'hidden',
                border:
                  index === safeIndex
                    ? '2px solid var(--catalog-accent, #D7B06A)'
                    : '1px solid var(--catalog-border-subtle, rgba(215, 176, 106, 0.18))',
                cursor: 'pointer',
                padding: 0,
                background: '#160A0D',
                transition: 'border-color 0.2s, opacity 0.2s, transform 0.2s',
                opacity: index === safeIndex ? 1 : 0.65,
              }}
            >
              <img
                src={img.url}
                alt={img.altText}
                width="58"
                height="58"
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
