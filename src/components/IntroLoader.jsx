import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function IntroLoader({ onComplete }) {
  const containerRef = useRef();
  const logoRef = useRef();

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: onComplete
    });

    // Revelado suave del logo
    tl.fromTo(logoRef.current, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    // Retener logo por un instante
    tl.to({}, { duration: 0.8 });

    // Deslizar panel completo hacia arriba de manera premium
    tl.to(containerRef.current, {
      yPercent: -100,
      duration: 1,
      ease: 'power4.inOut'
    });
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: 'var(--color-bg-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      <div 
        ref={logoRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center'
        }}
      >
        <img 
          src="/isotipo.png" 
          alt="Bella Forever Isotipo" 
          style={{ height: '70px', objectFit: 'contain' }} 
        />
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: '300',
          color: 'var(--color-gold)',
          letterSpacing: '4px',
          textTransform: 'uppercase'
        }}>
          Bella Forever
        </h1>
      </div>
    </div>
  );
}
