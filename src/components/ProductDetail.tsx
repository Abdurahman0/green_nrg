import React from 'react';
import { X, Heart, ShoppingCart, Shield, Zap, Clock, Star, Share2 } from 'lucide-react';
import { Product } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'motion/react';
import { useFavorites } from '@/lib/FavoritesContext';
import { useI18n } from '@/lib/i18n';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const { t } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      {/* Header Actions */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button 
          onClick={onClose}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm text-gray-900 border border-gray-100"
        >
          <X size={20} />
        </button>
        <div className="flex gap-3">
          <button className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm text-gray-900 border border-gray-100">
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => toggleFavorite(product.id)}
            className="p-3 rounded-2xl shadow-sm backdrop-blur-md border transition-all bg-white/80 border-gray-100 text-gray-900 hover:border-red-300 hover:shadow-red-500/10"
          >
            <motion.div
              animate={{ scale: isFav ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={20} fill={isFav ? "#ef4444" : "none"} stroke={isFav ? "#ef4444" : "currentColor"} color={isFav ? "#ef4444" : "currentColor"} />
            </motion.div>
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Hero Image */}
        <div className="relative aspect-square bg-gray-50">
          <img 
            src={`https://picsum.photos/seed/${product.id}/800/800`} 
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 pb-32 -mt-10 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {product.category__name || t('product.premiumSolution')}
            </Badge>
            <div className="flex items-center gap-1 text-primary text-xs font-bold">
              <Star size={14} fill="currentColor" />
              <span>4.9 (124 reviews)</span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-3xl font-black text-primary">
              ${product.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 line-through font-medium">
              ${(product.price * 1.2).toLocaleString()}
            </span>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Zap, label: t('product.feature.highEfficiency'), sub: t('product.feature.sub.efficiency') },
              { icon: Shield, label: t('product.feature.warranty'), sub: t('product.feature.sub.warranty') },
              { icon: Clock, label: t('product.feature.delivery'), sub: t('product.feature.sub.delivery') },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center gap-1">
                <item.icon size={20} className="text-primary mb-1" />
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-tight">{item.label}</span>
                <span className="text-[10px] text-gray-500 font-medium">{item.sub}</span>
              </div>
            ))}
          </div>

          {/* Description Placeholder */}
          <div className="space-y-4 mb-10">
            <h3 className="text-lg font-bold text-gray-900">{t('product.description')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('product.desc.text').replace('{name}', product.name)}
            </p>
            <ul className="space-y-3">
              {[
                t('product.desc.b1'),
                t('product.desc.b2'),
                t('product.desc.b3'),
                t('product.desc.b4')
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Specifications Placeholder */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{t('product.specifications')}</h3>
            <div className="space-y-2">
              {[
                { label: t('product.spec.model'), value: `GRN-${product.id}X` },
                { label: t('product.spec.material'), value: 'Monocrystalline Silicon' },
                { label: t('product.spec.weight'), value: '18.5 kg' },
                { label: t('product.spec.dimensions'), value: '1722 x 1134 x 30 mm' },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-50 text-sm">
                  <span className="text-gray-500 font-medium">{spec.label}</span>
                  <span className="text-gray-900 font-bold">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Sticky Bottom Action */}
      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-4 items-center pb-safe-area-bottom">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('product.totalPrice')}</span>
          <span className="text-xl font-black text-gray-900">${product.price.toLocaleString()}</span>
        </div>
        <Button 
          className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
          onClick={() => {
            onAddToCart(product);
            onClose();
          }}
        >
          <ShoppingCart className="mr-2" size={20} />
          {t('product.addToOrder')}
        </Button>
      </div>
    </motion.div>
  );
};
