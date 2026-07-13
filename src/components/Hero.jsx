import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Hero() {
  const containerRef = useRef();

  useGSAP(() => {
    gsap.fromTo('.hero-animate', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, stagger: 0.15, duration: 1.2, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      style={{
        marginTop: '70px',
        background: 'linear-gradient(135deg, var(--color-burgundy) 0%, #3d0d16 100%)',
        color: 'var(--color-white)',
        padding: '90px 24px 70px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '4px solid var(--color-gold)'
      }}
    >
      {/* Sutil destello de fondo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(215, 176, 106, 0.1) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="hero-animate" style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '3.5rem',
          fontWeight: '300',
          letterSpacing: '3px',
          marginBottom: '12px',
          color: 'var(--color-gold)',
          textTransform: 'uppercase'
        }}>
          Bella Forever
        </h1>
        <p className="hero-animate" style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          fontStyle: 'italic',
          marginBottom: '28px',
          opacity: 0.95,
          fontWeight: '300'
        }}>
          ✨ Tu dosis diaria de brillo y color ✨
        </p>
        <div className="hero-animate" style={{
          width: '80px',
          height: '2px',
          backgroundColor: 'var(--color-gold)',
          margin: '0 auto'
        }}></div>
      </div>
    </section>
  );
}
