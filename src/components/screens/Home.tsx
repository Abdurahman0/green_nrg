import React, { useEffect, useState } from 'react';
import { Search, Bell, Star, ShieldCheck, Leaf } from 'lucide-react';
import { api } from '@/services/api';
import { BootstrapData, CatalogData, Product, Review } from '@/types';
import { ProductCard } from '../ProductCard';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface HomeProps {
  onNavigate: (tab: any) => void;
  onProductClick: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onProductClick }) => {
  const { t } = useI18n();
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, c, r] = await Promise.all([
          api.getBootstrap(),
          api.getCatalog(),
          api.getReviews()
        ]);
        setBootstrap(b);
        setCatalog(c);
        setReviews(r);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const username = bootstrap?.user?.username?.trim() || 'User';
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white sticky top-0 z-30">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{t('home.welcomeBack')}</p>
          <h1 className="text-2xl font-bold text-gray-900">{username}!</h1>
        </div>
        <div className="flex gap-3">
          <button className="p-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-primary/10 hover:text-primary transition-all">
            <Bell size={20} />
          </button>
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
            {userInitial}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('home.search')}
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm text-gray-800 placeholder:text-gray-500 shadow-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* Trust Section */}
      <section className="px-6 mb-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Leaf, label: t('home.eco'), color: 'bg-primary/10 text-primary' },
            { icon: ShieldCheck, label: t('home.certified'), color: 'bg-primary/10 text-primary' },
            { icon: Star, label: t('home.premium'), color: 'bg-primary/10 text-primary' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn("p-4 rounded-2xl", item.color)}>
                <item.icon size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="px-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{t('home.featured')}</h2>
          <Button variant="ghost" size="sm" className="text-primary font-semibold" onClick={() => onNavigate('catalog')}>
            {t('home.seeMore')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {catalog?.products.slice(0, 4).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={onProductClick}
            />
          ))}
        </div>
      </section>

      {/* Reviews Preview */}
      <section className="px-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{t('home.reviewsTitle')}</h2>
          <Button variant="ghost" size="sm" className="text-primary font-semibold" onClick={() => onNavigate('profile')}>
            {t('home.allReviews')}
          </Button>
        </div>
        <div className="space-y-4">
          {reviews.slice(0, 2).map((review) => (
            <div key={review.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
                  {review.user[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{review.user}</h4>
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
