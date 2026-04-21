import React, { useMemo, useState } from 'react';
import { X, Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { Product } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'motion/react';
import { useFavorites } from '@/lib/FavoritesContext';
import { useI18n } from '@/lib/i18n';
import { getProductImages } from '@/lib/productMedia';
import { formatUZSParts } from '@/lib/money';
import { getProductPricing } from '@/lib/productSubsidy';

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
  const productImages = useMemo(() => getProductImages(product, 3), [product]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const pricing = getProductPricing(product);
  const basePriceParts = formatUZSParts(pricing.basePrice, lang);
  const finalPriceParts = formatUZSParts(pricing.priceAfterSubsidy, lang);
  const subsidyParts = formatUZSParts(pricing.subsidyAmount, lang);
  const activeImageSrc = productImages[activeImageIndex] ?? productImages[0];
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
          {activeImageSrc ? (
            <img
              src={activeImageSrc}
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
          {productImages.length > 1 ? (
            <div className="mb-5 -mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {productImages.slice(0, 3).map((src, idx) => (
                <button
                  key={`${src}_${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Image ${idx + 1}`}
                  className={[
                    'h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all',
                    idx === activeImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-primary/20',
                  ].join(' ')}
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {product.category?.name ?? product.category_name ?? product.category__name ?? 'Category'}
            </Badge>
            {pricing.isRecommended ? (
              <Badge className="bg-amber-50 text-amber-700 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                {t('product.recommendedBadge')}
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">
            {product.name}
          </h1>

          <div className="mb-8">
            {pricing.hasSubsidy ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-red-500 leading-none tabular-nums tracking-tight">
                  <span className="text-lg font-semibold line-through">{basePriceParts.amount}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{basePriceParts.currency}</span>
                </div>
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-primary leading-none tabular-nums tracking-tight">
                  <span className="text-3xl font-black">{finalPriceParts.amount}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-primary/80">{finalPriceParts.currency}</span>
                </span>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  <span>{t('product.subsidyAmount')}</span>
                  <span className="tabular-nums">{subsidyParts.amount}</span>
                </div>
              </div>
            ) : (
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-primary leading-none tabular-nums tracking-tight">
                <span className="text-3xl font-black">{basePriceParts.amount}</span>
                <span className="text-xs font-black uppercase tracking-widest text-primary/80">{basePriceParts.currency}</span>
              </span>
            )}
          </div>

          {pricing.hasSubsidy ? (
            <div className="mb-10 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/90 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                    {t('product.basePrice')}
                  </p>
                  <p className="mt-1 text-sm font-black text-gray-900 tabular-nums">
                    {basePriceParts.amount} {basePriceParts.currency}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                    {t('product.subsidyAmount')}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700 tabular-nums">
                    {subsidyParts.amount} {subsidyParts.currency}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                    {t('product.priceAfterSubsidy')}
                  </p>
                  <p className="mt-1 text-sm font-black text-primary tabular-nums">
                    {finalPriceParts.amount} {finalPriceParts.currency}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

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
            <span className="text-xl font-black">{finalPriceParts.amount}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{finalPriceParts.currency}</span>
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
