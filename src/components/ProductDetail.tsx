import React from 'react';
import { X, Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { Product } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'motion/react';
import { useFavorites } from '@/lib/FavoritesContext';
import { useI18n } from '@/lib/i18n';
import { getProductImage } from '@/lib/productMedia';
import { formatUZSParts } from '@/lib/money';

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
  const { t, lang } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);
  const productImage = getProductImage(product);
  const priceParts = formatUZSParts(product.price, lang);
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col min-h-0"
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

      <ScrollArea className="flex-1 min-h-0">
        {/* Hero Image */}
        <div className="relative aspect-square bg-gray-50">
          {productImage ? (
            <img 
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-white text-primary flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ImageOff size={28} />
                <span className="text-xs font-semibold">No product image</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 pb-32 -mt-10 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {product.category?.name ?? product.category_name ?? product.category__name ?? 'Category'}
            </Badge>
          </div>

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
            {product.name}
          </h1>

          <div className="mb-8">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-primary leading-none tabular-nums tracking-tight">
              <span className="text-3xl font-black">{priceParts.amount}</span>
              <span className="text-xs font-black uppercase tracking-widest text-primary/80">{priceParts.currency}</span>
            </span>
          </div>

          {product.description ? (
            <div className="space-y-4 mb-10">
              <h3 className="text-lg font-bold text-gray-900">{t('product.description')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {/* Sticky Bottom Action */}
      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-4 items-center pb-safe-area-bottom">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('product.totalPrice')}</span>
          <span className="flex flex-wrap items-baseline gap-x-1 text-gray-900 leading-none tabular-nums tracking-tight">
            <span className="text-xl font-black">{priceParts.amount}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{priceParts.currency}</span>
          </span>
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
