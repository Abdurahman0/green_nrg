import React, { useEffect, useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import { Product } from '@/types';
import { ProductCard } from '../ProductCard';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useFavorites } from '@/lib/FavoritesContext';
import { useI18n } from '@/lib/i18n';

interface FavoritesProps {
  onProductClick: (product: Product) => void;
  onNavigate: (tab: any) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onProductClick, onNavigate }) => {
  const { t } = useI18n();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getCatalog();
        setAllProducts(data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter products that are favorited
  const favoriteProducts = allProducts.filter(product => favorites.has(product.id));

  return (
    <div className="pb-24">
      <header className="p-6 bg-white sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900">{t('favorites.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('favorites.subtitle')}</p>
      </header>

      <div className="px-6 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {favoriteProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={onProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <Heart size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('favorites.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
              {t('favorites.emptyDesc')}
            </p>
            <Button 
              className="mt-8 rounded-2xl px-8 h-12 font-bold"
              onClick={() => onNavigate('catalog')}
            >
              {t('favorites.explore')}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
