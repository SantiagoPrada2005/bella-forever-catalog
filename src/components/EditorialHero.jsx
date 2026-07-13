import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function EditorialHero() {
  const containerRef = useRef();
  const navigate = useNavigate();

  useGSAP(() => {
    // Animación de textos
    gsap.fromTo('.hero-fade-up', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, stagger: 0.15, duration: 1.2, ease: 'power3.out' }
    );
    
    // Revelado por máscara
    gsap.fromTo('.hero-text-mask-span', 
      { y: '100%' }, 
      { y: '0%', stagger: 0.12, duration: 1.2, ease: 'power4.out', delay: 0.2 }
    );

    // Animación inicial de imágenes
    gsap.fromTo('.hero-img-left',
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 0.9, scale: 1, y: 0, duration: 1.4, delay: 0.2, ease: 'power2.out' }
    );
    gsap.fromTo('.hero-img-right',
      { opacity: 0, scale: 0.95, y: -20 },
      { opacity: 1, scale: 1, y: 0, duration: 1.4, delay: 0.4, ease: 'power2.out' }
    );

    // Parallax de imágenes al hacer scroll
    gsap.to('.hero-img-left', {
      y: -50,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.hero-img-right', {
      y: 50,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }, { scope: containerRef });



  return (
    <section 
      ref={containerRef}
      style={{
        marginTop: '70px',
        padding: '80px 24px 60px 24px',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '40px',
        alignItems: 'center'
      }} className="editorial-hero-grid">
        <style>{`
          @media (min-width: 768px) {
            .editorial-hero-grid {
              grid-template-columns: 1.2fr 1fr !important;
            }
          }
        `}</style>
        
        <div style={{ zIndex: 2 }}>
          <span className="hero-fade-up" style={{
            color: 'var(--color-gold)',
            fontSize: '0.85rem',
            fontWeight: '600',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '12px'
          }}>
            Boutique de Belleza
          </span>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            lineHeight: '1.05',
            color: 'var(--color-white)',
            marginBottom: '20px',
            fontWeight: '300'
          }}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span className="hero-text-mask-span" style={{ display: 'inline-block' }}>Revela tu</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span className="hero-text-mask-span" style={{ display: 'inline-block', fontStyle: 'italic', color: 'var(--color-gold)' }}>brillo natural</span>
            </span>
          </h1>
          <p className="hero-fade-up" style={{
            color: 'var(--color-text-muted)',
            fontSize: '1.05rem',
            lineHeight: '1.6',
            marginBottom: '32px',
            maxWidth: '520px'
          }}>
            Cosméticos seleccionados para una belleza elegante, femenina y de alta tendencia. Encuentra tu dosis diaria de color e inspírate.
          </p>
          <div className="hero-fade-up">
            <button 
              onClick={() => navigate('/catalogo')}
              style={{
                backgroundColor: 'var(--color-burgundy)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-gold)',
                padding: '14px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                letterSpacing: '1px',
                boxShadow: 'var(--shadow-gold)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
            >
              EXPLORAR CATÁLOGO
            </button>
          </div>
        </div>

        {/* Composición asimétrica de imágenes */}
        <div style={{
          position: 'relative',
          height: '320px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Imagen izquierda (atrás) */}
          <div className="hero-img-left" style={{
            position: 'absolute',
            left: '5%',
            bottom: '10%',
            width: '55%',
            height: '240px',
            borderRadius: 'var(--radius-premium)',
            overflow: 'hidden',
            border: 'var(--border-glass)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
            zIndex: 1
          }}>
            <img 
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop" 
              alt="Bella Makeup" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Imagen derecha (delante) */}
          <div className="hero-img-right" style={{
            position: 'absolute',
            right: '5%',
            top: '5%',
            width: '50%',
            height: '220px',
            borderRadius: 'var(--radius-premium)',
            overflow: 'hidden',
            border: '1px solid var(--color-gold)',
            boxShadow: '0 25px 45px rgba(0,0,0,0.7)',
            zIndex: 2
          }}>
            <img 
              src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop" 
              alt="Bella Eyelash Kit" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
