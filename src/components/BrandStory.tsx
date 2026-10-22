import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BotanicalCherryAccent } from './svg/BellaEditorialSvgs';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function BrandStory() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const textElement = textRef.current;
    if (!textElement || !containerRef.current) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const text = textElement.textContent || '';
      const words = text.trim().split(/\s+/);
      textElement.innerHTML = words
        .map(
          (word) =>
            `<span class="brand-word" style="opacity: 0.25; display: inline-block; margin-right: 0.28em;">${word}</span>`
        )
        .join('');

      gsap.to('.brand-word', {
        opacity: 1,
        stagger: 0.06,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 82%',
          end: 'bottom 58%',
          scrub: 0.5,
        },
      });
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      style={{
        padding: '36px 24px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(90, 22, 35, 0.14) 50%, transparent 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <BotanicalCherryAccent size={44} />
        <p
          ref={textRef}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 4.5vw, 2.65rem)',
            fontStyle: 'italic',
            lineHeight: '1.25',
            paddingBottom: '4px',
            color: 'var(--color-white)',
            margin: 0,
            fontWeight: '300',
          }}
        >
          Tu dosis diaria de brillo y color
        </p>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-gold)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: '600',
            margin: 0,
          }}
        >
          By Silvy Loaiza · Boutique de Maquillaje
        </p>
      </div>
    </section>
  );
}
