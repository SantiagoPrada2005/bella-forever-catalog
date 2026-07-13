import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';

export default function App() {
  const [cart, setCart] = useState([]);
  
  return (
    <div>
      {/* Fondos difuminados decorativos tipo makeup */}
      <div className="bg-makeup-blur bg-makeup-blur-1" />
      <div className="bg-makeup-blur bg-makeup-blur-2" />
      
      <Header cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onCartClick={() => console.log('cart clicked')} />
      <Hero />
    </div>
  );
}
