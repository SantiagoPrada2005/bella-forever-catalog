import React, { useEffect, useState } from 'react';
import Header from '../Header';
import { 
  getProducts, 
  deleteProduct, 
  toggleProductStock, 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../lib/api-client';
import { CONFIG } from '../../config';

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for category management
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [prods, cats] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        if (isMounted) {
          setProducts(prods);
          setCategories(cats);
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Error al obtener productos", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error al obtener categorías", err);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      setLoading(true);
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (err) {
        console.error("Error al eliminar producto", err);
        alert("Error al eliminar el producto");
        setLoading(false);
      }
    }
  };

  const handleToggleStock = async (id, currentStock) => {
    try {
      const nextStock = !currentStock;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: nextStock } : p));
      await toggleProductStock(id, nextStock);
    } catch (err) {
      console.error("Error al actualizar stock", err);
      alert("Error al actualizar el stock");
      fetchProducts();
    }
  };


  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSubmitting(true);
    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Error al crear la categoría");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;
    setCatSubmitting(true);
    try {
      await updateCategory(editingCat.id, editingCat.name.trim());
      setEditingCat(null);
      await fetchCategories();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la categoría");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.id === 'sin-categoria') {
      alert("No se puede eliminar la categoría por defecto");
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Los productos asociados pasarán a "Sin categoría".`)) {
      try {
        await deleteCategory(cat.id);
        await fetchCategories();
        await fetchProducts();
      } catch (err) {
        console.error(err);
        alert("Error al eliminar la categoría");
      }
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
          
          <a href="/admin/nuevo" style={{ textDecoration: 'none' }}>
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
            }}>
              + NUEVO PRODUCTO
            </button>
          </a>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(215, 176, 106, 0.2)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('products')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'products' ? '2px solid var(--color-gold)' : '2px solid transparent',
              color: activeTab === 'products' ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Productos ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'categories' ? '2px solid var(--color-gold)' : '2px solid transparent',
              color: activeTab === 'categories' ? 'var(--color-gold)' : 'var(--color-text-muted)',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Categorías ({categories.length})
          </button>
        </div>

        {activeTab === 'products' ? (
          <>
            {loading && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                Cargando catálogo...
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: 'var(--border-glass)', borderRadius: '16px', background: 'rgba(18, 9, 11, 0.4)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '20px' }}>No hay productos en el catálogo.</p>
                <a href="/admin/nuevo">
                  <button style={{ background: 'none', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                    Crear tu primer producto
                  </button>
                </a>
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
                            <a href={`/admin/editar/${product.id}`} style={{ textDecoration: 'none' }}>
                              <button style={{
                                background: 'none',
                                border: '1px solid rgba(215, 176, 106, 0.4)',
                                color: 'var(--color-gold)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}>
                                Editar
                              </button>
                            </a>
                            
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
          </>
        ) : (
          <div>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--color-panel-dark)', padding: '20px', borderRadius: '12px', border: 'var(--border-glass)' }}>
              <input 
                type="text" 
                placeholder="Nombre de la nueva categoría (ej. Iluminadores)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={catSubmitting}
                style={{
                  flex: '1',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(215, 176, 106, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              />
              <button 
                type="submit"
                disabled={catSubmitting || !newCatName.trim()}
                style={{
                  backgroundColor: 'var(--color-burgundy)',
                  color: 'var(--color-white)',
                  border: '1px solid var(--color-gold)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: catSubmitting || !newCatName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: catSubmitting || !newCatName.trim() ? 0.6 : 1
                }}
              >
                + AGREGAR CATEGORÍA
              </button>
            </form>

            <div style={{
              overflowX: 'auto',
              background: 'var(--color-panel-dark)',
              border: 'var(--border-glass)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-premium)',
              padding: '10px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: 'var(--border-glass)', color: 'var(--color-gold)' }}>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Nombre</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Slug</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500' }}>Productos</th>
                    <th style={{ padding: '16px 12px', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const prodCount = products.filter(p => p.category === cat.slug).length;
                    const isEditing = editingCat?.id === cat.id;

                    return (
                      <tr key={cat.id} style={{ borderBottom: '1px solid rgba(215, 176, 106, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                          {isEditing ? (
                            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                value={editingCat.name} 
                                onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid var(--color-gold)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  color: '#fff'
                                }}
                              />
                              <button type="submit" style={{ background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                Guardar
                              </button>
                              <button type="button" onClick={() => setEditingCat(null)} style={{ background: 'none', border: '1px solid #666', color: '#ccc', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </form>
                          ) : (
                            cat.name
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {cat.slug}
                        </td>
                        <td style={{ padding: '12px', color: '#fff' }}>
                          {prodCount}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {cat.id === 'sin-categoria' ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sistema</span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              {!isEditing && (
                                <button 
                                  onClick={() => setEditingCat({ id: cat.id, name: cat.name })}
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(215, 176, 106, 0.4)',
                                    color: 'var(--color-gold)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Editar
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteCategory(cat)}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(255, 51, 51, 0.4)',
                                  color: '#ff5555',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
