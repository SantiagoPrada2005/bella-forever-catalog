import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const GALLERIES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop",
    title: "Labiales Satinados",
    speed: -30,
    width: '100%',
    aspect: '1'
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
    title: "Rubores Premium",
    speed: -15,
    width: '85%',
    aspect: '0.8'
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
    title: "Paletas de Sombras",
    speed: -45,
    width: '90%',
    aspect: '1.2'
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1631730359575-38e4755d772b?q=80&w=800&auto=format&fit=crop",
    title: "Cejas Perfectas",
    speed: -20,
    width: '100%',
    aspect: '0.9'
  }
];

export default function ParallaxGallery() {
  const containerRef = useRef();
  const navigate = useNavigate();

  useGSAP(() => {
    const items = gsap.utils.toArray('.parallax-item');
    items.forEach((item) => {
      const speed = parseFloat(item.dataset.speed) || -20;
      gsap.to(item, {
        yPercent: speed,
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // Animación de entrada inicial
    gsap.fromTo('.gallery-title',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      style={{
        padding: '80px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        overflow: 'hidden'
      }}
    >
      <h2 
        className="gallery-title"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.5rem',
          textAlign: 'center',
          fontWeight: '300',
          color: 'var(--color-white)',
          marginBottom: '60px'
        }}
      >
        Explora la <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Colección</span>
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '40px 30px',
        alignItems: 'start'
      }} className="parallax-grid">
        <style>{`
          @media (max-width: 600px) {
            .parallax-grid {
              grid-template-columns: 1fr !important;
              gap: 50px 0 !important;
            }
          }
        `}</style>
        
        {GALLERIES.map((item, idx) => (
          <div 
            key={item.id}
            className="parallax-item"
            data-speed={item.speed}
            onClick={() => navigate('/catalogo')}
            style={{
              width: item.width,
              margin: idx % 2 === 0 ? '0 auto 0 0' : '80px 0 0 auto',
              cursor: 'pointer',
              position: 'relative',
              borderRadius: 'var(--radius-premium)',
              overflow: 'hidden',
              border: 'var(--border-glass)',
              boxShadow: 'var(--shadow-premium)',
              transition: 'border-color 0.3s ease, transform 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(215, 176, 106, 0.12)';
            }}
          >
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: item.aspect,
              overflow: 'hidden'
            }}>
              <img 
                src={item.image} 
                alt={item.title} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              
              {/* Overlay oscuro y título */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'linear-gradient(to top, rgba(10, 4, 5, 0.9) 0%, rgba(10, 4, 5, 0) 100%)',
                padding: '24px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>Bella Forever</span>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#fff', fontWeight: '400', marginTop: '4px' }}>{item.title}</h4>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)' }}>Explorar →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
