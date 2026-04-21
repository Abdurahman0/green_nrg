import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (productId: string) => boolean;
  isTogglingFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<string>>(new Set());
  const pendingTogglesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const hydrateFavorites = async () => {
      try {
        const [bootstrap, favoriteRows] = await Promise.all([
          api.getBootstrap(),
          api.getFavorites(),
        ]);
        if (!isMounted) return;

        const fromRows = favoriteRows.map((row) => row.product);
        const source = fromRows.length > 0 ? fromRows : bootstrap.favorites;
        setFavorites(new Set(source));
      } catch (error) {
        console.error(error);
      }
    };

    hydrateFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const isFavorite = (productId: string) => favorites.has(productId);
  const isTogglingFavorite = (productId: string) => pendingFavoriteIds.has(productId);

  const toggleFavorite = async (productId: string) => {
    if (pendingTogglesRef.current.has(productId)) {
      return;
    }

    pendingTogglesRef.current.add(productId);
    setPendingFavoriteIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
    const wasFavorite = favorites.has(productId);

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      await api.toggleFavorite({ product: productId });
    } catch (error) {
      console.error(error);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
    } finally {
      pendingTogglesRef.current.delete(productId);
      setPendingFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, isTogglingFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
