'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../src/components/Header';
import ImageUpload from '../../../../src/components/ui/ImageUpload';
import { getProductById, updateProduct } from '../../actions';
import { CONFIG } from '../../../../src/config';

export default function EditProduct({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    mainImage: '',
    isNew: false,
    isFeatured: false,
    inStock: true
  });

  const [tones, setTones] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const prod = await getProductById(id);
        if (!prod) {
          alert("Producto no encontrado");
          router.push('/admin');
          return;
        }
        setFormData({
          name: prod.name,
          price: prod.price.toString(),
          description: prod.description || '',
          category: prod.category,
          mainImage: prod.mainImage,
          isNew: prod.isNew,
          isFeatured: prod.isFeatured,
          inStock: prod.inStock
        });
        setTones(prod.tones || []);
      } catch (err) {
        console.error("Error al cargar producto", err);
        alert("Ocurrió un error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTone = () => {
    setTones(prev => [...prev, { name: '', hex: '#DDA3A9', image: formData.mainImage, inStock: true }]);
  };

  const handleRemoveTone = (index) => {
    setTones(prev => prev.filter((_, i) => i !== index));
  };

  const handleToneChange = (index, field, value) => {
    setTones(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.mainImage) {
      alert("Por favor completa los campos requeridos (Nombre, Precio e Imagen Principal)");
      return;
    }

    setSaving(true);
    try {
      await updateProduct(id, formData, tones);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al actualizar el producto");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '90px', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', paddingTop: '90px' }}>
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />

      <Header cartCount={0} onCartClick={() => {}} />

      <main style={{ flex: '1 0 auto', padding: '20px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => router.push('/admin')}
            style={{ background: 'none', border: 'none', color: 'var(--color-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: 0 }}
          >
            ← Volver al panel
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: '300', color: 'var(--color-white)', marginTop: '12px' }}>
            Editar Producto: {formData.name}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'var(--color-panel-dark)',
          border: 'var(--border-glass)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-premium)'
        }}>
          {/* Fila principal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
                Nombre del Producto *
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
                Precio (COP) *
              </label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
                Categoría *
              </label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff' }}
              >
                {CONFIG.categories.filter(c => c.id !== 'todos').map(c => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--color-panel-dark)', color: '#fff' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <ImageUpload
                label="Imagen Principal"
                value={formData.mainImage}
                onChange={(url) => setFormData(prev => ({ ...prev, mainImage: url }))}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
              Descripción
            </label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(215,176,106,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', resize: 'vertical' }}
            />
          </div>

          {/* Opciones booleanas */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '30px', borderBottom: '1px solid rgba(215,176,106,0.1)', paddingBottom: '20px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
              <input 
                type="checkbox" 
                name="isNew" 
                checked={formData.isNew} 
                onChange={handleChange}
                style={{ accentColor: 'var(--color-gold)' }}
              />
              Marcar como Nuevo
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
              <input 
                type="checkbox" 
                name="isFeatured" 
                checked={formData.isFeatured} 
                onChange={handleChange}
                style={{ accentColor: 'var(--color-gold)' }}
              />
              Destacar Producto
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
              <input 
                type="checkbox" 
                name="inStock" 
                checked={formData.inStock} 
                onChange={handleChange}
                style={{ accentColor: 'var(--color-gold)' }}
              />
              Disponible (En Stock)
            </label>
          </div>

          {/* Gestión de Tonos / Variantes */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: '300', color: 'var(--color-gold)' }}>
                Variantes de Tonos
              </h3>
              <button 
                type="button" 
                onClick={handleAddTone}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-gold)',
                  color: 'var(--color-gold)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                + Agregar Tono
              </button>
            </div>

            {tones.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Este producto no tiene variantes de tono (se mostrará como tono único).
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tones.map((tone, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 3fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(215,176,106,0.05)'
                  }}>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Nombre (ej. 01 Nude)" 
                        value={tone.name} 
                        onChange={(e) => handleToneChange(index, 'name', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(215,176,106,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <input 
                        type="color" 
                        value={tone.hex} 
                        onChange={(e) => handleToneChange(index, 'hex', e.target.value)}
                        style={{ width: '100%', height: '35px', padding: '2px', border: '1px solid rgba(215,176,106,0.1)', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <ImageUpload
                        value={tone.image}
                        onChange={(url) => handleToneChange(index, 'image', url)}
                        required
                        compact={true}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.8rem' }}>
                        <input 
                          type="checkbox" 
                          checked={tone.inStock} 
                          onChange={(e) => handleToneChange(index, 'inStock', e.target.checked)}
                          style={{ accentColor: 'var(--color-gold)' }}
                        />
                        Stock
                      </label>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTone(index)}
                      style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones del formulario */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => router.push('/admin')}
              disabled={saving}
              style={{
                background: 'none',
                border: '1px solid rgba(215, 176, 106, 0.3)',
                color: 'var(--color-gold)',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-bg-dark)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                boxShadow: 'var(--shadow-gold)',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
