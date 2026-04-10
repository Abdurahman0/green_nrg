import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateFavorites = async () => {
      try {
        const [bootstrap, favoriteRows] = await Promise.all([
          api.getBootstrap(),
          api.getFavorites(),
        ]);
        if (!isMounted) return;

        setUserId(bootstrap.user.id);
        setFavorites(new Set(favoriteRows.map((row) => row.product)));
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

  const toggleFavorite = async (productId: string) => {
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
      const resolvedUserId = userId ?? (await api.getBootstrap()).user.id;
      if (!userId) setUserId(resolvedUserId);

      const response = await api.toggleFavorite({
        user: resolvedUserId,
        product: productId,
      });

      if (response.length > 1) {
        setFavorites(new Set(response.map((row) => row.product)));
      }
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
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
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
