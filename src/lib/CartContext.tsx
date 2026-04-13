import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type PersistedCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category__name?: string;
  description?: string;
  image_url?: string;
  primary_image_url?: string;
};

const CART_STORAGE_KEY = 'green_nrg_cart_v1';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const readCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const items: CartItem[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as Record<string, unknown>;
      const id = typeof rec.id === 'string' ? rec.id : '';
      const name = typeof rec.name === 'string' ? rec.name : '';
      const quantity = Math.max(1, Math.floor(toNumber(rec.quantity)));
      const price = toNumber(rec.price);
      if (!id || !name) continue;

      items.push({
        id,
        name,
        price,
        quantity,
        category__name: typeof rec.category__name === 'string' ? rec.category__name : undefined,
        description: typeof rec.description === 'string' ? rec.description : undefined,
        image_url: typeof rec.image_url === 'string' ? rec.image_url : undefined,
        primary_image_url:
          typeof rec.primary_image_url === 'string' ? rec.primary_image_url : undefined,
      });
    }
    return items;
  } catch {
    return [];
  }
};

const writeCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedCartItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category__name: item.category__name,
      description: item.description,
      image_url: item.image_url,
      primary_image_url: item.primary_image_url,
    }));
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => readCartFromStorage());

  // Persist cart for Telegram-only usage (cart survives reloads / reopening the WebApp).
  useEffect(() => {
    writeCartToStorage(items);
  }, [items]);

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
