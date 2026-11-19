import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { formatCop } from '../utils/currency';
import { getProductImage } from '../utils/image-helpers';
import { CONFIG } from '../config';
import ProductGallery from './ProductGallery';
import { trackEvent } from '../lib/analytics';
import type { ProductWithRelations, Tone } from '../db/schema';

export interface ProductModalProps {
  product: ProductWithRelations | null;
  allProducts?: ProductWithRelations[];
  initialTone?: Tone | null;
  onClose: () => void;
  onAddToCart: (product: ProductWithRelations, tone: Tone | null) => void;
  onSelectProduct?: (product: ProductWithRelations, tone?: Tone | null) => void;
  onToneChange?: (product: ProductWithRelations, tone: Tone) => void;
}

interface CategoryEditorialMeta {
  label: string;
  finishBadge: string;
  ritualTip: string;
  benefits: string[];
}

function generateInfiniteRecommendations(
  currentProductId: string,
  allProducts: ProductWithRelations[],
  seedOffset: number,
  limit: number = 14
): ProductWithRelations[] {
  const eligible = allProducts.filter((p) => p.id !== currentProductId && p.inStock);
  if (eligible.length === 0) return [];

  // Agrupar por categoría para garantizar variedad
  const byCategory: Record<string, ProductWithRelations[]> = {};
  for (const item of eligible) {
    const cat = item.category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  const categoryKeys = Object.keys(byCategory);
  if (categoryKeys.length === 0) return [];

  // Mezclar el orden de las categorías según el seed para que no empiece siempre la misma
  const sortedCategories = [...categoryKeys].sort((a, b) => {
    const valA = (a.charCodeAt(0) * 19 + seedOffset) % 73;
    const valB = (b.charCodeAt(0) * 19 + seedOffset) % 73;
    return valA - valB;
  });

  // Para cada categoría, ordenar sus productos con una función de dispersión pseudoaleatoria
  const listsByCategory: ProductWithRelations[][] = sortedCategories.map((catKey) => {
    const list = [...byCategory[catKey]];
    return list.sort((a, b) => {
      const hashA = (a.name.length * 37 + (a.tones?.length || 0) * 13 + a.price + seedOffset * 11) % 101;
      const hashB = (b.name.length * 37 + (b.tones?.length || 0) * 13 + b.price + seedOffset * 11) % 101;
      return hashA - hashB;
    });
  });

  // Entrelazado Round-Robin entre categorías para asegurar diversidad continua
  const roundRobin: ProductWithRelations[] = [];
  let maxLen = 0;
  for (const list of listsByCategory) {
    if (list.length > maxLen) maxLen = list.length;
  }

  for (let step = 0; step < maxLen; step++) {
    for (const list of listsByCategory) {
      if (step < list.length) {
        roundRobin.push(list[step]);
      }
    }
  }

  if (roundRobin.length === 0) return [];

  // Desplazamiento rotativo circular
  const rotationIndex = Math.abs(seedOffset) % roundRobin.length;
  const rotated = [
    ...roundRobin.slice(rotationIndex),
    ...roundRobin.slice(0, rotationIndex),
  ];

  return rotated.slice(0, Math.min(limit, rotated.length));
}

function getCategoryEditorialMeta(category: string): CategoryEditorialMeta {
  const key = category.toLowerCase().trim();
  switch (key) {
    case 'rubor':
      return {
        label: 'Rubor & Mejillas',
        finishBadge: 'Efecto Piel Luminosa',
        ritualTip:
          'Aplica con toques suaves sobre los pómulos y difumina hacia las sienes con brocha o yema de los dedos para un rubor fresco y modulable.',
        benefits: [
          'Pigmentación modulable de larga duración',
          'Textura suave que se funde sin marcar poros',
          'Ideal para clima cálido en el Valle del Cauca',
        ],
      };
    case 'labiales':
      return {
        label: 'Labios & Gloss',
        finishBadge: 'Color & Confort',
        ritualTip:
          'Desliza desde el centro del labio hacia las comisuras.Aplica una capa para un velo natural o dos capas para máxima intensidad.',
        benefits: [
          'Fórmula confortable que no reseca los labios',
          'Color vibrante desde la primera pasada',
          'Empaque práctico para retocar en cualquier momento',
        ],
      };
    case 'cejas':
      return {
        label: 'Diseño de Cejas',
        finishBadge: 'Definición Natural',
        ritualTip:
          'Peina las cejas hacia arriba y rellena los espacios con trazos cortos siguiendo la dirección natural del vello.',
        benefits: [
          'Fijación limpia sin sensación acartonada',
          'Acabado natural de estudio fotográfico',
          'Resistente a la humedad y al sudor',
        ],
      };
    case 'pestanas':
      return {
        label: 'Mirada & Pestañas',
        finishBadge: 'Impacto & Volumen',
        ritualTip:
          'Aplica desde la raíz con movimientos en zigzag hacia las puntas para separar, alargar y elevar cada pestaña.',
        benefits: [
          'Realza y abre la mirada al instante',
          'Fórmula ligera que no baja el rizo',
          'Fácil aplicación sin grumos',
        ],
      };
    case 'correctores':
    case 'rostro':
      return {
        label: 'Rostro & Perfección',
        finishBadge: 'Cobertura Uniforme',
        ritualTip:
          'Deposita pequeñas cantidades en ojeras o zonas a iluminar y difumina a toquecitos con esponja húmeda o brocha.',
        benefits: [
          'Cobertura versátil de acabado segunda piel',
          'Textura ligera que no se cuartea en líneas de expresión',
          'Unifica el tono con luminosidad natural',
        ],
      };
    default:
      return {
        label: category,
        finishBadge: 'Curaduría de Estudio',
        ritualTip:
          'Combina esta pieza con tu rutina diaria para lograr un acabado pulido, luminoso y duradero.',
        benefits: [
          'Seleccionado bajo estándares de calidad Bella Forever',
          'Textura pensada para todo tipo de piel',
          'Disponibilidad inmediata en Roldanillo',
        ],
      };
  }
}

export default function ProductModal({
  product,
  allProducts = [],
  initialTone,
  onClose,
  onAddToCart,
  onSelectProduct,
  onToneChange,
}: ProductModalProps) {
  const modalOverlay = useRef<HTMLDivElement>(null);
  const modalContent = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const relatedTrackRef = useRef<HTMLDivElement>(null);

  const [selectedTone, setSelectedTone] = useState<Tone | null>(
    initialTone || (product?.tones && product.tones.length > 0 ? product.tones[0] ?? null : null)
  );
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [addedRelatedId, setAddedRelatedId] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<'ritual' | 'shipping' | null>('ritual');
  const [manualCycleCount, setManualCycleCount] = useState(0);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectionSyncKey = `${product?.id ?? ''}:${initialTone?.id ?? ''}`;
  const [lastSelectionSyncKey, setLastSelectionSyncKey] = useState(selectionSyncKey);
  if (selectionSyncKey !== lastSelectionSyncKey) {
    setLastSelectionSyncKey(selectionSyncKey);
    setSelectedTone(
      initialTone || (product?.tones && product.tones.length > 0 ? product.tones[0] ?? null : null)
    );
  }

  // Hacer scroll suave al tope del modal cuando cambia el producto activo
  useEffect(() => {
    if (!product) return;
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (relatedTrackRef.current) {
      relatedTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [product]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      if (relatedTimerRef.current) clearTimeout(relatedTimerRef.current);
    };
  }, [onClose]);

  useGSAP(
    () => {
      if (!modalOverlay.current || !modalContent.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const isMobile = !window.matchMedia('(min-width: 768px)').matches;
        const tl = gsap.timeline();

        tl.fromTo(modalOverlay.current, { opacity: 0 }, { opacity: 1, duration: 0.24 });

        if (isMobile) {
          tl.fromTo(
            modalContent.current,
            { y: '100%' },
            { y: '0%', duration: 0.42, ease: 'power3.out' },
            '-=0.14'
          );
        } else {
          tl.fromTo(
            modalContent.current,
            { scale: 0.96, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.32, ease: 'power3.out' },
            '-=0.14'
          );
        }
      });
    },
    { scope: modalOverlay }
  );

  const handleClose = () => {
    if (!modalOverlay.current || !modalContent.current) {
      onClose();
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onClose();
      return;
    }
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    if (isMobile) {
      gsap.to(modalContent.current, { y: '100%', duration: 0.25, ease: 'power3.in' });
    } else {
      gsap.to(modalContent.current, { scale: 0.96, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
    gsap.to(modalOverlay.current, { opacity: 0, duration: 0.24, onComplete: onClose });
  };

  if (!product) return null;

  const formattedPrice = formatCop(product.price);
  const editorialMeta = getCategoryEditorialMeta(product.category);

  const hasTones = Boolean(product.tones && product.tones.length > 0);
  const availableTonesCount = product.tones
    ? product.tones.filter((t) => Boolean(t.inStock) && t.stock > 0).length
    : 0;
  const isToneAvailable = selectedTone
    ? Boolean(selectedTone.inStock) && selectedTone.stock > 0
    : true;
  const isAvailable = Boolean(product.inStock) && (hasTones ? isToneAvailable : product.stock > 0);
  const currentStock = selectedTone ? selectedTone.stock : product.stock;
  const isLowStock = isAvailable && currentStock > 0 && currentStock <= 3;

  // Bucle continuo de recomendaciones con distribución equilibrada entre categorías
  const baseProductIdHash = product
    ? product.id.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0)
    : 0;
  const effectiveSeed = (baseProductIdHash + manualCycleCount * 7) % 997;

  const relatedProducts = generateInfiniteRecommendations(
    product.id,
    allProducts,
    effectiveSeed,
    14
  );

  const handleCycleRecommendations = () => {
    setManualCycleCount((prev) => prev + 1);
    if (relatedTrackRef.current) {
      relatedTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const cleanWhatsappPhone = CONFIG.whatsappNumber.replace(/[^0-9]/g, '') || '573117887806';
  const whatsappQueryText = `Hola Bella Forever, quiero consultar por el producto *${product.name}*${
    selectedTone?.name ? ` en el tono *${selectedTone.name}*` : ''
  } (${formattedPrice}).`;
  const productWhatsappUrl = `https://wa.me/${cleanWhatsappPhone}?text=${encodeURIComponent(
    whatsappQueryText
  )}`;

  const handlePrimaryAdd = () => {
    if (!isAvailable || isJustAdded) return;
    onAddToCart(product, selectedTone);
    setIsJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setIsJustAdded(false);
    }, 1500);
  };

  return (
    <div
      ref={modalOverlay}
      onClick={handleClose}
      className="bottom-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
    >
      <div
        ref={modalContent}
        onClick={(e) => e.stopPropagation()}
        className="product-modal-sheet"
      >
        {/* ZONA 1: Cabecera Fija Compacta */}
        <div className="product-modal-header">
          <span className="catalog-pill-tag">{editorialMeta.label}</span>

          <div
            onClick={handleClose}
            aria-hidden="true"
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(215, 176, 106, 0.34)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar detalles del producto"
            className="product-modal-close-btn"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ZONA 2: Cuerpo Desplazable con Galería, Tonos, Descripción Enriquecida y Relacionados */}
        <div ref={scrollBodyRef} className="product-modal-scroll no-scrollbar">
          <div className="product-modal-main-grid">
            {/* Columna Izquierda: Galería Unificada con Swipe Móvil */}
            <div>
              <ProductGallery
                key={`${product.id}-${selectedTone?.id || 'default'}`}
                images={product.productImages || []}
                fallbackImage={product.mainImage}
                selectedToneImage={selectedTone?.image}
                selectedToneName={selectedTone?.name}
                productName={product.name}
                isNew={product.isNew}
                isFeatured={product.isFeatured}
              />
            </div>

            {/* Columna Derecha: Información Editorial, Swatches y Detalles */}
            <div className="product-modal-info-col">
              {/* Título y Precio */}
              <div>
                <h2
                  id="studio-modal-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.65rem, 5.6vw, 2.25rem)',
                    fontWeight: 500,
                    color: 'var(--catalog-ink, #FCF9F9)',
                    lineHeight: 1.12,
                    margin: '0 0 8px 0',
                  }}
                >
                  {product.name}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--catalog-accent, #D7B06A)',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {formattedPrice}
                  </p>

                  {isLowStock ? (
                    <span className="studio-product-card__badge">
                      Últimas {currentStock} unidades
                    </span>
                  ) : isAvailable ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#8CE5B1',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#3CD079',
                        }}
                      />
                      Disponible para entrega
                    </span>
                  ) : (
                    <span className="studio-product-card__badge">Agotado</span>
                  )}
                </div>
              </div>

              {/* Chips de Atributos de Estudio (Sin emojis, solo tipografía limpia y SVG) */}
              <div className="product-detail-chips">
                <span className="product-detail-chip">{editorialMeta.finishBadge}</span>
                {hasTones && (
                  <span className="product-detail-chip">
                    {availableTonesCount}{' '}
                    {availableTonesCount === 1 ? 'tono disponible' : 'tonos disponibles'}
                  </span>
                )}
                <span className="product-detail-chip">Entrega en {CONFIG.defaultCity}</span>
              </div>

              {/* Selector de Tonos Táctil Mejorado */}
              {hasTones && product.tones && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--catalog-surface-card, #160A0D)',
                    border: '1px solid var(--catalog-border-subtle, rgba(215, 176, 106, 0.2))',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      gap: '8px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--catalog-ink-muted, #C9B1B6)',
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Tono seleccionado:{' '}
                      <span style={{ color: 'var(--catalog-accent, #D7B06A)', fontWeight: 700 }}>
                        {selectedTone?.name}
                      </span>
                    </p>
                    {!isToneAvailable && (
                      <span style={{ fontSize: '0.7rem', color: '#F29B9B', fontWeight: 600 }}>
                        Tono agotado
                      </span>
                    )}
                  </div>

                  <div className="amuse-swatch-list" style={{ gap: '10px' }}>
                    {product.tones.map((tone) => {
                      const isSelected = selectedTone?.id === tone.id;
                      const toneReady = Boolean(tone.inStock) && tone.stock > 0;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          title={`${tone.name}${!toneReady ? ' (Agotado)' : ''}`}
                          aria-label={`Seleccionar tono ${tone.name}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setSelectedTone(tone);
                            onToneChange?.(product, tone);
                          }}
                          className={`amuse-swatch-btn ${isSelected ? 'is-active' : ''} ${
                            !toneReady ? 'is-out' : ''
                          }`}
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: tone.hex,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Descripción Editorial Mejorada */}
              <div className="product-detail-description-box">
                <p
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--catalog-accent, #D7B06A)',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Sobre esta pieza
                </p>
                <p
                  style={{
                    color: 'var(--catalog-ink, #FCF9F9)',
                    fontSize: '0.9rem',
                    lineHeight: 1.62,
                    margin: 0,
                  }}
                >
                  {product.description}
                </p>
              </div>

              {/* Acordeones Interactivos: Ritual de Uso y Envío */}
              <div className="product-detail-accordions">
                <div className="product-detail-accordion-item">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'ritual' ? null : 'ritual'))
                    }
                    aria-expanded={openAccordion === 'ritual'}
                    className="product-detail-accordion-trigger"
                  >
                    <span>Modo de uso y beneficios</span>
                    <span style={{ color: 'var(--catalog-accent, #D7B06A)' }}>
                      {openAccordion === 'ritual' ? '−' : '+'}
                    </span>
                  </button>
                  {openAccordion === 'ritual' && (
                    <div className="product-detail-accordion-content">
                      <p style={{ margin: '0 0 8px 0' }}>{editorialMeta.ritualTip}</p>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '4px' }}>
                        {editorialMeta.benefits.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="product-detail-accordion-item">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'shipping' ? null : 'shipping'))
                    }
                    aria-expanded={openAccordion === 'shipping'}
                    className="product-detail-accordion-trigger"
                  >
                    <span>Entrega en {CONFIG.defaultCity} y asesoría</span>
                    <span style={{ color: 'var(--catalog-accent, #D7B06A)' }}>
                      {openAccordion === 'shipping' ? '−' : '+'}
                    </span>
                  </button>
                  {openAccordion === 'shipping' && (
                    <div className="product-detail-accordion-content">
                      <p style={{ margin: 0 }}>
                        Arma tu pedido en el catálogo y coordina tu entrega rápida en{' '}
                        <strong>{CONFIG.defaultCity}</strong> y municipios cercanos con pago contra
                        entrega o transferencia.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enlace directo de consulta por WhatsApp para este producto */}
              <a
                href={productWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent({
                    name: 'contact_whatsapp',
                    source: 'product_modal',
                    productName: product.name,
                    product: {
                      id: product.id,
                      toneId: selectedTone?.id || null,
                      name: product.name,
                      price: product.price,
                      category: product.category,
                      tone: selectedTone?.name || null,
                    },
                  })
                }
                className="product-whatsapp-inline-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.359 4.984L2 22l5.188-1.359c1.453.797 3.109 1.234 4.843 1.234 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.828 14.125c-.25.703-1.438 1.344-2.016 1.422-.531.078-1.203.109-1.938-.125-.453-.141-1.031-.328-1.766-.641-3.109-1.344-5.141-4.469-5.297-4.672-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.312.609-.391.812-.391.203 0 .406.008.578.016.188.008.438-.07.688.531.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.297.5-.156.172-.328.391-.469.531-.156.156-.312.328-.141.625.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.312 2.375 1.469.297.156.469.125.641-.078.172-.203.734-.859.938-1.156.203-.297.406-.25.672-.156.266.094 1.703.805 1.984.945.281.141.469.219.547.344.078.125.078.719-.172 1.422z" />
                </svg>
                <span>Consultar por este producto en WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Sección de Productos Relacionados / Destacados dentro del Modal */}
          {relatedProducts.length > 0 && (
            <div className="product-related-section">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'var(--catalog-ink, #FCF9F9)',
                    margin: 0,
                  }}
                >
                  Completa tu look ·{' '}
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: '1.15rem',
                      color: 'var(--catalog-accent, #D7B06A)',
                    }}
                  >
                    Recomendados para ti
                  </span>
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCycleRecommendations}
                    aria-label="Ver otras opciones de productos recomendados"
                    className="product-related-refresh-btn"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>Explorar más</span>
                  </button>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--catalog-ink-muted, #C9B1B6)',
                    }}
                  >
                    Desliza
                  </span>
                </div>
              </div>

              <div ref={relatedTrackRef} className="product-related-track no-scrollbar">
                {relatedProducts.map((rel) => {
                  const relDefaultTone =
                    rel.tones && rel.tones.length > 0 ? rel.tones[0] ?? null : null;
                  const relImage = getProductImage(rel, relDefaultTone);
                  const relWasAdded = addedRelatedId === rel.id;

                  return (
                    <div
                      key={rel.id}
                      className="product-related-card"
                      onClick={() => {
                        setSelectedTone(relDefaultTone);
                        setIsJustAdded(false);
                        if (onSelectProduct) {
                          onSelectProduct(rel, relDefaultTone);
                        }
                      }}
                    >
                      <div className="product-related-card__media">
                        <img
                          src={relImage}
                          alt={rel.name}
                          width="160"
                          height="160"
                          loading="lazy"
                        />
                      </div>

                      <span className="product-related-card__category">
                        {rel.category}
                      </span>

                      <p
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          color: 'var(--catalog-ink, #FCF9F9)',
                          margin: 0,
                          lineHeight: 1.25,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.45em',
                        }}
                      >
                        {rel.name}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginTop: 'auto',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--catalog-accent, #D7B06A)',
                          }}
                        >
                          {formatCop(rel.price)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(rel, relDefaultTone);
                            setAddedRelatedId(rel.id);
                            if (relatedTimerRef.current) clearTimeout(relatedTimerRef.current);
                            relatedTimerRef.current = setTimeout(() => {
                              setAddedRelatedId(null);
                            }, 1200);
                          }}
                          aria-label={`Agregar ${rel.name} al pedido`}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(215, 176, 106, 0.45)',
                            backgroundColor: relWasAdded
                              ? 'var(--catalog-cta-bg-hover, #872336)'
                              : 'rgba(90, 22, 35, 0.55)',
                            color: relWasAdded ? 'var(--catalog-accent, #D7B06A)' : '#FCF9F9',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {relWasAdded ? 'Listo' : 'Sumar'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Tarjeta interactiva de bucle continuo para cargar nuevas sugerencias */}
                <div
                  className="product-related-cycle-card"
                  onClick={handleCycleRecommendations}
                  role="button"
                  tabIndex={0}
                  aria-label="Cargar más recomendaciones y variar productos"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCycleRecommendations();
                    }
                  }}
                >
                  <div className="product-related-cycle-card__icon" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--catalog-accent, #D7B06A)',
                      margin: 0,
                      lineHeight: 1.25,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Descubrir más
                  </p>
                  <p
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--catalog-ink-muted, #C9B1B6)',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    Nuevas sugerencias del catálogo
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ZONA 3: Barra Inferior Fija (Sticky CTA Bar) en Móvil y Desktop */}
        <div className="product-modal-sticky-footer">
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--catalog-accent, #D7B06A)',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {formattedPrice}
            </p>
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--catalog-ink-muted, #C9B1B6)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedTone?.name ? `Tono: ${selectedTone.name}` : editorialMeta.label}
            </p>
          </div>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={handlePrimaryAdd}
            aria-label={
              isJustAdded
                ? 'Producto agregado al pedido'
                : isAvailable
                  ? 'Agregar al pedido'
                  : 'Agotado'
            }
            className="catalog-spotlight-cta"
            style={{
              width: 'auto',
              flex: '1 1 auto',
              maxWidth: '280px',
              padding: '13px 20px',
              fontSize: '0.8rem',
            }}
          >
            {isAvailable
              ? isJustAdded
                ? 'Agregado al pedido'
                : 'Agregar al pedido'
              : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
}
