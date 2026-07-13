import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function BrandStory() {
  const containerRef = useRef();
  const textRef = useRef();

  useGSAP(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    // Dividir el texto en palabras envueltas en spans
    const words = textElement.textContent.split(' ');
    textElement.innerHTML = words.map(word => `<span class="brand-word" style="opacity: 0.2; display: inline-block; margin-right: 8px;">${word}</span>`).join('');

    gsap.to('.brand-word', {
      opacity: 1,
      stagger: 0.05,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 60%',
        scrub: 0.5
      }
    });
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      style={{
        padding: '60px 24px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(90, 22, 35, 0.15) 50%, transparent 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderTop: 'var(--border-glass)',
        borderBottom: 'var(--border-glass)'
      }}
    >
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        textAlign: 'center',
        zIndex: 2,
        position: 'relative'
      }}>
        <span style={{
          color: 'var(--color-gold)',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: '16px'
        }}>
          Nuestra Filosofía
        </span>
        <p 
          ref={textRef}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontStyle: 'italic',
            lineHeight: '1.35',
            color: 'var(--color-white)',
            marginBottom: '16px',
            fontWeight: '300'
          }}
        >
          Tu dosis diaria de brillo y color
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          By Silvy Loaiza
        </p>
      </div>
    </section>
  );
}
