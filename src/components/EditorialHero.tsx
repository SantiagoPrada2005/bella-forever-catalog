import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { BellaSunburstSeal } from './svg/BellaEditorialSvgs';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export default function EditorialHero() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '.hero-poster-card',
        { opacity: 0, y: 24, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
      );

      gsap.fromTo(
        '.hero-reveal-item',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.85, delay: 0.15, ease: 'power3.out' }
      );
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="editorial-section-shell">
      <div className="editorial-poster-card poster-blush hero-poster-card">
        {/* Retrato Editorial Izquierdo / Superior en Móvil */}
        <div className="poster-blush__photo-frame">
          <img
            src="/images/studio-hero-blush.webp"
            alt="Retrato editorial aplicando rubor en barra Bella Forever"
            width="760"
            height="768"
            loading="eager"
            fetchPriority="high"
          />
          <div className="poster-blush__photo-scrim">
            <span className="poster-micro-tag">Tono Dulce</span>
            <span className="poster-micro-tag">Alto Brillo</span>
            <span className="poster-micro-tag">Fórmula Sedosa</span>
          </div>
        </div>

        {/* Columna Derecha / Inferior en Móvil: Identidad + Tipografía + Pill CTA */}
        <div className="poster-blush__content">
          <div className="poster-blush__meta-top hero-reveal-item">
            <span className="poster-micro-tag" style={{ fontSize: '0.74rem', letterSpacing: '0.18em' }}>
              #BELLABLUSH
            </span>
            <BellaSunburstSeal
              size={46}
              className="bella-sunburst-seal--spin"
              style={{ color: 'var(--color-gold)' }}
            />
          </div>

          <div className="hero-reveal-item">
            <h1 className="poster-blush__headline">
              NUEVO
              <br />
              POCKET
              <span className="poster-blush__headline-serif">BLUSH</span>
            </h1>
            <p className="poster-blush__subtext">
              Texturas sedosas, pigmentación luminosa y tonos seleccionados para realzar tu brillo natural cada día.
            </p>
          </div>

          <div className="hero-reveal-item" style={{ paddingTop: '4px' }}>
            <a href="/catalogo" className="editorial-pill-btn editorial-pill-btn--alabaster">
              EXPLORAR CATÁLOGO
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
