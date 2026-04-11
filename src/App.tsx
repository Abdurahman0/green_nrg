/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BottomNav, TabType } from './components/BottomNav';
import { Home } from './components/screens/Home';
import { Catalog } from './components/screens/Catalog';
import { Favorites } from './components/screens/Favorites';
import { Orders } from './components/screens/Orders';
import { Profile } from './components/screens/Profile';
import { ProductDetail } from './components/ProductDetail';
import { Checkout } from './components/screens/Checkout';
import { SplashScreen } from './components/SplashScreen';
import { CartProvider, useCart } from './lib/CartContext';
import { FavoritesProvider } from './lib/FavoritesContext';
import { Product } from './types';
import { ShoppingCart } from 'lucide-react';
import { Badge } from './components/ui/badge';
import { CART_FLY_EVENT, CartFlyDetail } from './lib/cartFly';
import { I18nProvider } from './lib/i18n';
import { DebugPanel } from './components/DebugPanel';
import { DebugProvider } from './lib/DebugContext';
import {
  ensureTelegramWebAppScript,
  getTelegramInitData,
  initializeTelegramWebApp,
} from './lib/telegramWebApp';

interface CartFlyItem {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  image?: string;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [cartFlyItems, setCartFlyItems] = useState<CartFlyItem[]>([]);
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const { totalItems, addToCart } = useCart();

  useEffect(() => {
    let timer: number | null = null;
    let attempts = 0;
    const tryBootstrapTelegram = () => {
      ensureTelegramWebAppScript();
      initializeTelegramWebApp();
      attempts += 1;
      if ((getTelegramInitData() || attempts >= 10) && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    tryBootstrapTelegram();
    timer = window.setInterval(tryBootstrapTelegram, 300);
    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onCartFly = (event: Event) => {
      const customEvent = event as CustomEvent<CartFlyDetail>;
      const cartButton = cartButtonRef.current;
      if (!cartButton) return;

      const rect = cartButton.getBoundingClientRect();
      const id = Date.now() + Math.random();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;

      setCartFlyItems(prev => [
        ...prev,
        {
          id,
          startX: customEvent.detail.x,
          startY: customEvent.detail.y,
          targetX,
          targetY,
          image: customEvent.detail.image
        }
      ]);

      setTimeout(() => {
        setCartFlyItems(prev => prev.filter(item => item.id !== id));
      }, 700);
    };

    window.addEventListener(CART_FLY_EVENT, onCartFly);
    return () => {
      window.removeEventListener(CART_FLY_EVENT, onCartFly);
    };
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            onNavigate={setActiveTab} 
            onProductClick={setSelectedProduct}
          />
        );
      case 'catalog':
        return (
          <Catalog 
            onProductClick={setSelectedProduct}
            onAddToCart={addToCart}
          />
        );
      case 'favorites':
        return (
          <Favorites 
            onProductClick={setSelectedProduct}
            onNavigate={setActiveTab}
          />
        );
      case 'orders':
        return <Orders />;
      case 'profile':
        return <Profile onNavigate={setActiveTab} />;
      default:
        return <Home onNavigate={setActiveTab} onProductClick={setSelectedProduct} />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20">
      <DebugPanel />
      <AnimatePresence>
        {isAppLoading && <SplashScreen />}
      </AnimatePresence>

      <main className="max-w-lg mx-auto min-h-screen relative">
        <div className="pointer-events-none fixed inset-0 z-70">
          <AnimatePresence>
            {cartFlyItems.map((item) => (
              <motion.div
                key={item.id}
                className="absolute h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-xl"
                initial={{
                  x: item.startX - 20,
                  y: item.startY - 20,
                  scale: 0.95,
                  opacity: 0.95
                }}
                animate={{
                  x: item.targetX - 14,
                  y: item.targetY - 14,
                  scale: 0.35,
                  opacity: 0.2
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    <ShoppingCart size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {renderScreen()}

        {/* Floating Cart Trigger */}
        {totalItems > 0 && !showCheckout && (
          <motion.button
            ref={cartButtonRef}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCheckout(true)}
            className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-40 border-4 border-white"
          >
            <ShoppingCart size={24} />
            <Badge className="absolute -top-1 -right-1 bg-primary text-white border-2 border-white px-1.5 min-w-5 h-5 flex items-center justify-center shadow-lg">
              {totalItems}
            </Badge>
          </motion.button>
        )}

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
          />
        )}
        {showCheckout && (
          <Checkout 
            onBack={() => setShowCheckout(false)} 
            onSuccess={() => {
              setShowCheckout(false);
              setActiveTab('orders');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <DebugProvider>
        <CartProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </CartProvider>
      </DebugProvider>
    </I18nProvider>
  );
}
