import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import IntroLoader from './components/IntroLoader';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import { CONFIG } from './config';

export default function App() {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bella_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bella_cart', JSON.stringify(cart));
  }, [cart]);

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

  const handleUpdateQuantity = (key, delta) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.key === key) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleCheckout = () => {
    const numberFormatter = new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      maximumFractionDigits: CONFIG.currency.precision
    });

    let message = `¡Hola, ${CONFIG.brandName}! 💄✨ Me gustaría realizar el siguiente pedido:\n\n🛍️ *Detalle de mi compra:*\n`;

    cart.forEach((item) => {
      const itemTotal = numberFormatter.format(item.price * item.quantity);
      const toneStr = item.toneName ? ` (${item.toneName})` : '';
      message += `• ${item.quantity} x ${item.productName}${toneStr} — ${itemTotal}\n`;
    });

    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n💵 *Total a pagar:* ${numberFormatter.format(totalValue)} ${CONFIG.currency.code}\n`;
    message += `\n👇 ¿Me confirmas disponibilidad para coordinar el pago y el envío a ${CONFIG.defaultCity}? 🌸`;

    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = CONFIG.whatsappNumber.replace('+', '').replace(/\s+/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  return (
    <>
      {!isIntroComplete && <IntroLoader onComplete={() => setIsIntroComplete(true)} />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)' }}>
        <div className="bg-makeup-blur bg-makeup-blur-1" />
        <div className="bg-makeup-blur bg-makeup-blur-2" />

        <Header
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
        />

        <main style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/catalogo" 
              element={
                <Catalog 
                  cart={cart}
                  isCartOpen={isCartOpen}
                  setIsCartOpen={setIsCartOpen}
                  handleAddToCart={handleAddToCart}
                  handleUpdateQuantity={handleUpdateQuantity}
                  handleCheckout={handleCheckout}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </>
  );
}
