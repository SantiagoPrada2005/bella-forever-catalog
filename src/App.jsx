import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryFilters from './components/CategoryFilters';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import productsData from './data/products.json';

export default function App() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductTone, setSelectedProductTone] = useState(null);

  const handleAddToCart = (product, selectedTone) => {
    setCart((prev) => {
      const itemKey = `${product.id}_${selectedTone?.id || 'default'}`;
      const existing = prev.find(item => item.key === itemKey);
      if (existing) {
        return prev.map(item => item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        key: itemKey,
        productId: product.id,
        toneId: selectedTone?.id || null,
        productName: product.name,
        toneName: selectedTone?.name || '',
        price: product.price,
        quantity: 1,
        image: selectedTone?.image || product.mainImage
      }];
    });
  };

  const handleProductCardClick = (product, tone) => {
    setSelectedProduct(product);
    setSelectedProductTone(tone);
  };

  const filteredProducts = activeCategory === 'todos' 
    ? productsData 
    : productsData.filter(p => p.category === activeCategory);

  return (
    <div>
      {/* Fondos difuminados decorativos tipo makeup */}
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />
      
      <Header 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        onCartClick={() => console.log('cart clicked', cart)} 
      />
      <Hero />
      <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <ProductGrid 
        products={filteredProducts} 
        onProductClick={handleProductCardClick} 
        onAddToCart={handleAddToCart} 
      />
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          initialTone={selectedProductTone}
          onClose={() => {
            setSelectedProduct(null);
            setSelectedProductTone(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
