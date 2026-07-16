'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../src/components/Header';
import EditorialHero from '../src/components/EditorialHero';
import BrandStory from '../src/components/BrandStory';
import ParallaxGallery from '../src/components/ParallaxGallery';
import { CONFIG } from '../src/config';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '70px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header cartCount={0} onCartClick={() => {}} />

      <main style={{ flex: '1 0 auto' }}>
        <EditorialHero />
      
      <BrandStory />

      <ParallaxGallery />

      {/* CTA Banner de entrada al Catálogo */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(90, 22, 35, 0.15) 100%)',
        borderTop: 'var(--border-glass)'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.5rem',
          fontWeight: '300',
          color: '#fff',
          marginBottom: '20px'
        }}>
          ¿Lista para revelar tu <span style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>brillo único</span>?
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
          marginBottom: '32px',
          maxWidth: '600px',
          margin: '0 auto 32px auto',
          lineHeight: '1.6'
        }}>
          Descubre nuestra línea completa de maquillaje, rubores, labiales y correctores seleccionados para realzar tu belleza.
        </p>
        
        <Link href="/catalogo" style={{ textDecoration: 'none' }}>
          <button 
            style={{
              backgroundColor: 'var(--color-burgundy)',
              color: 'var(--color-white)',
              border: '1px solid var(--color-gold)',
              padding: '16px 36px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '1px',
              boxShadow: 'var(--shadow-gold)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}
          >
            INGRESAR AL CATÁLOGO
          </button>
        </Link>
      </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        borderTop: 'var(--border-glass)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        backgroundColor: 'rgba(18, 9, 11, 0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-gold)', marginBottom: '8px', letterSpacing: '2px' }}>
          BELLA FOREVER
        </p>
        <p style={{ marginBottom: '6px' }}>📍 {CONFIG.defaultCity} (Valle del Cauca)</p>
        <p>
          By: <a href={`https://instagram.com/${CONFIG.instagramUser}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)', fontWeight: '600', textDecoration: 'none' }}>@{CONFIG.instagramUser}</a>
        </p>
      </footer>
    </div>
  );
}
