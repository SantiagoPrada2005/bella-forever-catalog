import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LiquidGlossDrops,
  BotanicalCherryAccent,
  EditorialCornerFrame,
  BellaSunburstSeal,
} from './svg/BellaEditorialSvgs';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function ParallaxGallery() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const blocks = gsap.utils.toArray<HTMLElement>('.editorial-campaign-block');
      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      gsap.to('.poster-gloss__svg-drops', {
        y: -18,
        rotation: 4,
        ease: 'none',
        scrollTrigger: {
          trigger: '.poster-gloss-split',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="editorial-section-shell"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      {/* Póster 2: Split Editorial "VELVET GLOSS" (Inspirado en CHOCOLATE GLOSS de SOLEIL) */}
      <article className="editorial-poster-card poster-gloss-split editorial-campaign-block">
        {/* Panel A: Producto con Micro-Tipografía en las 4 Esquinas */}
        <div className="poster-gloss__product-panel">
          <div className="editorial-corner-row" style={{ color: 'var(--surface-editorial-alabaster)' }}>
            <span>SODA POP KIT</span>
            <span>BELLA GLOSS</span>
          </div>

          <div className="poster-gloss__product-frame">
            <img
              src="/images/studio-soda-pop-kit.webp"
              alt="Kit Soda Pop de brillo y mascarilla labial Bella Forever"
              width="768"
              height="768"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="editorial-corner-row" style={{ color: 'var(--surface-editorial-alabaster)' }}>
            <span>ALTO BRILLO</span>
            <span>LABIOS SEDOSOS</span>
          </div>
        </div>

        {/* Panel B: Retrato Editorial + Gotas SVG de Gloss Orgánicas */}
        <div className="poster-gloss__model-panel">
          <img
            src="/images/studio-velvet-gloss.webp"
            alt="Aplicación de labial líquido y gloss Bella Forever"
            width="860"
            height="768"
            loading="lazy"
            decoding="async"
            className="poster-gloss__model-img"
          />
          <div className="poster-gloss__scrim" />

          {/* SVG Orgánico generado en pen.dev: Gotas líquidas de gloss y crema */}
          <div className="poster-gloss__svg-drops">
            <LiquidGlossDrops size={136} />
          </div>

          <div className="poster-gloss__overlay-content">
            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.85rem, 5vw, 2.85rem)',
                fontWeight: 300,
                letterSpacing: '0.06em',
                color: 'var(--surface-editorial-alabaster)',
                lineHeight: 1.02,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              VELVET
            </h2>
            <div className="poster-gloss__bottom-bar">
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
                  lineHeight: 1.1,
                  paddingBottom: '4px',
                  color: 'var(--color-gold)',
                }}
              >
                GLOSS
              </span>
              <a href="/catalogo?categoria=labiales" className="editorial-pill-btn editorial-pill-btn--alabaster">
                VER LABIALES Y GLOSS VELVET
              </a>
            </div>
          </div>
        </div>
      </article>

      {/* Bento Asimétrico de 2 Celdas: Mirada & Labios (100% ancho en móvil, sin márgenes desalineados) */}
      <div className="editorial-bento-duo editorial-campaign-block">
        <a
          href="/catalogo"
          className="editorial-bento-card"
          style={{ textDecoration: 'none', backgroundColor: '#29060A' }}
        >
          <img
            src="/images/studio-gold-eyes-pose.webp"
            alt="Kit de Pestañas Gold Eyes Bella Forever"
            width="920"
            height="768"
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 10%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,4,5,0.28) 0%, rgba(10,4,5,0) 32%, rgba(10,4,5,0.08) 58%, rgba(10,4,5,0.88) 100%)',
            }}
          />
          <EditorialCornerFrame
            topLeft="GOLD EYES"
            topRight="PESTAÑINA DÚO"
            bottomLeft=""
            bottomRight=""
          />
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.65rem, 4vw, 2.2rem)',
                  fontWeight: 400,
                  color: 'var(--surface-editorial-alabaster)',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Mirada &amp; <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Pestañas</span>
              </h3>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(251, 244, 245, 0.86)',
                  marginTop: '4px',
                }}
              >
                Tratamiento fortalecedor y pestañina de precisión.
              </p>
            </div>
            <BellaSunburstSeal size={34} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
          </div>
        </a>

        <a
          href="/catalogo"
          className="editorial-bento-card"
          style={{ textDecoration: 'none', backgroundColor: '#613B36' }}
        >
          <img
            src="/images/studio-lip-plump-pose.webp"
            alt="Lip Plump Voluminizador de Labios Bella Forever"
            width="920"
            height="768"
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 10%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,4,5,0.28) 0%, rgba(10,4,5,0) 32%, rgba(10,4,5,0.08) 58%, rgba(10,4,5,0.88) 100%)',
            }}
          />
          <EditorialCornerFrame
            topLeft="LIP PLUMP"
            topRight="EFECTO VOLUMEN"
            bottomLeft=""
            bottomRight=""
          />
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.65rem, 4vw, 2.2rem)',
                  fontWeight: 400,
                  color: 'var(--surface-editorial-alabaster)',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Volumen &amp; <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Labios</span>
              </h3>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(251, 244, 245, 0.86)',
                  marginTop: '4px',
                }}
              >
                Hidratación profunda y acabado espejo al instante.
              </p>
            </div>
            <BotanicalCherryAccent size={36} style={{ flexShrink: 0 }} />
          </div>
        </a>
      </div>

      {/* Póster 3: Campaña "BELLA" con Superposición Serif y Panel Alabastro (Inspirado en SOLEIL SALE) */}
      <article className="editorial-poster-card poster-collection-split editorial-campaign-block">
        <div className="poster-collection__visual">
          <img
            src="/images/studio-collection-silk.webp"
            alt="Colección completa de maquillaje Bella Forever"
            width="1140"
            height="768"
            loading="lazy"
            decoding="async"
            className="poster-collection__visual-img"
          />
          <div className="poster-collection__visual-scrim" />

          <div
            style={{
              position: 'relative',
              zIndex: 3,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="poster-micro-tag" style={{ color: 'var(--color-pastel-pink)' }}>
              EDICIÓN SELECTA
            </span>
            <BotanicalCherryAccent size={42} />
          </div>

          <h2 className="poster-collection__giant-word">BELLA</h2>

          <div
            style={{
              position: 'relative',
              zIndex: 3,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="poster-micro-tag" style={{ color: 'var(--color-gold)' }}>
              #BELLAFOREVER
            </span>
            <span className="poster-micro-tag" style={{ color: 'var(--surface-editorial-alabaster)' }}>
              #BELLACOLECCION
            </span>
          </div>
        </div>

        <div className="poster-collection__callout">
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              lineHeight: 1.5,
              color: 'var(--color-burgundy)',
              margin: 0,
            }}
          >
            TODO LO QUE NECESITAS PARA BRILLAR
            <br />
            DISPONIBLE AHORA
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                fontWeight: 400,
                letterSpacing: '0.08em',
                color: 'var(--color-ink-burgundy)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              CATÁLOGO
            </h3>
            <a href="/catalogo" className="editorial-pill-btn editorial-pill-btn--pink">
              VER COLECCIÓN COMPLETA
            </a>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-burgundy)',
            }}
          >
            BELLAFOREVER · ROLDANILLO
          </span>
        </div>
      </article>
    </section>
  );
}
