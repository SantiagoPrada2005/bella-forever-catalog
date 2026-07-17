'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../src/components/Header';
import { getProducts, deleteProduct, toggleProductStock } from './actions';
import { CONFIG } from '../../src/config';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error("Error al obtener productos", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id, name) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      setLoading(true);
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (e) {
        alert("Error al eliminar el producto");
        setLoading(false);
      }
    }
  };

  const handleToggleStock = async (id, currentStock) => {
    try {
      const nextStock = !currentStock;
      // Actualización optimista de UI
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: nextStock } : p));
      await toggleProductStock(id, nextStock);
    } catch (e) {
      alert("Error al actualizar el stock");
      fetchProducts();
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision
    }).format(value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '90px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header cartCount={0} onCartClick={() => {}} />

      <main style={{ flex: '1 0 auto', padding: '20px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: '300', color: 'var(--color-white)' }}>
              Panel de Administración
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Gestiona los productos y variantes visibles en tu catálogo.
            </p>
          </div>
          
          <Link href="/admin/nuevo" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: 'var(--color-burgundy)',
              color: 'var(--color-white)',
              border: '1px solid var(--color-gold)',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: 'var(--shadow-gold)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy-light)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-burgundy)'}>
              + NUEVO PRODUCTO
            </button>
          </Link>
        </div>

        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Cargando catálogo...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', border: 'var(--border-glass)', borderRadius: '16px', background: 'rgba(18, 9, 11, 0.4)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '20px' }}>No hay productos en el catálogo.</p>
            <Link href="/admin/nuevo">
              <button style={{ background: 'none', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                Crear tu primer producto
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            background: 'var(--color-panel-dark)',
            border: 'var(--border-glass)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-premium)',
            padding: '10px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-glass)', color: 'var(--color-gold)' }}>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Imagen</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Nombre</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Categoría</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Precio</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Stock</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500' }}>Tags</th>
                  <th style={{ padding: '16px 12px', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(215, 176, 106, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px' }}>
                      <img 
                         src={product.mainImage} 
                         alt={product.name} 
                         style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.1)' }} 
                      />
                    </td>
                    <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                      {product.name}
                      {product.tones?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {product.tones.map(t => (
                            <span 
                              key={t.id} 
                              title={t.name}
                              style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.hex, border: '1px solid rgba(255,255,255,0.4)' }}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {product.category}
                    </td>
                    <td style={{ padding: '12px', color: '#fff' }}>
                      {formatPrice(product.price)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={product.inStock} 
                          onChange={() => handleToggleStock(product.id, product.inStock)}
                          style={{ accentColor: 'var(--color-gold)' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: product.inStock ? '#4BB543' : '#ff3333' }}>
                          {product.inStock ? 'Disponible' : 'Agotado'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {product.isFeatured && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-burgundy)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-gold)' }}>
                            Destacado
                          </span>
                        )}
                        {product.isNew && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#1c150c', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(217,176,106,0.3)' }}>
                            Nuevo
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '10px' }}>
                        <Link href={`/admin/editar/${product.id}`} style={{ textDecoration: 'none' }}>
                          <button style={{
                            background: 'none',
                            border: '1px solid rgba(215, 176, 106, 0.4)',
                            color: 'var(--color-gold)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                            e.currentTarget.style.color = 'var(--color-bg-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-gold)';
                          }}>
                            Editar
                          </button>
                        </Link>
                        
                        <button 
                          onClick={() => handleDelete(product.id, product.name)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255, 51, 51, 0.4)',
                            color: '#ff5555',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ff3333';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#ff5555';
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
