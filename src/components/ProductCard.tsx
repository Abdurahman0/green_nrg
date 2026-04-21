import React, { useState } from 'react';
import { Heart, Loader2, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useCart } from '@/lib/CartContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { dispatchCartFlyFromElement } from '@/lib/cartFly';
import { useI18n } from '@/lib/i18n';
import { getProductImage } from '@/lib/productMedia';
import { ImageOff } from 'lucide-react';
import { formatUZSParts } from '@/lib/money';
import { getProductPricing } from '@/lib/productSubsidy';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  compactBadges?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  compactBadges = false,
}) => {
  const { t, lang } = useI18n();
  const { items, addToCart, updateQuantity } = useCart();
  const { isFavorite, isTogglingFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isFav = isFavorite(product.id);
  const isFavPending = isTogglingFavorite(product.id);
  const productImage = getProductImage(product);
  const pricing = getProductPricing(product);
  const basePriceParts = formatUZSParts(pricing.basePrice, lang);
  const finalPriceParts = formatUZSParts(pricing.priceAfterSubsidy, lang);
  const recommendedBadgeText = t('product.recommendedBadge');
  const recommendedBadgeTextSize = lang === 'ru' ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]';

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    dispatchCartFlyFromElement(e.currentTarget, productImage);
    setIsAnimating(true);
    addToCart(product);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dispatchCartFlyFromElement(e.currentTarget, productImage);
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <div className="transform-gpu transition-transform duration-150 hover:-translate-y-1">
      <Card className="overflow-hidden border border-gray-100 shadow-sm bg-white group rounded-2xl">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transform-gpu transition-transform duration-300 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
              onClick={() => onClick?.(product)}
            />
          ) : (
            <button
              type="button"
              onClick={() => onClick?.(product)}
              className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-white text-primary flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2 px-3 text-center">
                <ImageOff size={20} />
                <span className="text-[11px] font-semibold">No product image</span>
              </div>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            disabled={isFavPending}
            aria-busy={isFavPending}
            className="absolute top-3 right-3 z-20 pointer-events-auto p-2 rounded-full bg-white/90 text-gray-500 hover:text-red-500 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-wait"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavPending ? (
              <Loader2 size={18} className="animate-spin text-primary" />
            ) : (
              <Heart
                size={18}
                fill={isFav ? '#ef4444' : 'none'}
                stroke={isFav ? '#ef4444' : 'currentColor'}
                color={isFav ? '#ef4444' : 'currentColor'}
              />
            )}
          </button>
          
          {!compactBadges && pricing.hasSubsidy ? (
            <div className="absolute left-3 top-3 flex flex-wrap gap-2 pr-14">
              <Badge className="h-6 rounded-full bg-emerald-50 text-emerald-700 shadow-sm">
                {t('product.subsidyBadge')}
              </Badge>
            </div>
          ) : null}

          {(product.category?.name ?? product.category_name ?? product.category__name) && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-primary rounded-md">
                {product.category?.name ?? product.category_name ?? product.category__name}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-3">
          <div className="mb-1.5 min-h-5 flex items-center">
            {pricing.isRecommended ? (
              <Badge className={cn(
                "inline-flex h-5 max-w-full items-center rounded-full bg-primary px-2.5 font-bold uppercase tracking-[0.05em] text-white shadow-sm",
                recommendedBadgeTextSize
              )}>
                <span className="whitespace-nowrap">{recommendedBadgeText}</span>
              </Badge>
            ) : (
              <Badge
                aria-hidden="true"
                className={cn(
                  "invisible inline-flex h-5 max-w-full items-center rounded-full bg-primary px-2.5 font-bold uppercase tracking-[0.05em] text-white shadow-sm",
                  recommendedBadgeTextSize
                )}
              >
                <span className="whitespace-nowrap">{recommendedBadgeText}</span>
              </Badge>
            )}
          </div>

          <h3 
            className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-primary transition-colors"
            onClick={() => onClick?.(product)}
          >
            {product.name}
          </h3>
          
          <div className="mt-2">
            <div className="flex min-w-0 flex-col min-h-[4rem]">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">{t('product.price')}</span>
              <div className="mt-0.5 space-y-0.5">
                {pricing.hasSubsidy ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-red-500 leading-none tabular-nums tracking-tight">
                      <span className="text-[10px] font-semibold line-through">{basePriceParts.amount}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{basePriceParts.currency}</span>
                    </div>
                    <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-primary leading-none tabular-nums tracking-tight">
                      <span className="font-extrabold text-[clamp(0.95rem,3.8vw,1.125rem)]">{finalPriceParts.amount}</span>
                      <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{finalPriceParts.currency}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-primary leading-none tabular-nums tracking-tight">
                      <span className="font-extrabold text-[clamp(0.95rem,3.8vw,1.125rem)]">{basePriceParts.amount}</span>
                      <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{basePriceParts.currency}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-2 h-10 flex items-center justify-end">
              {quantity > 0 ? (
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md text-primary hover:bg-primary/20"
                    onClick={handleDecrement}
                  >
                    <Minus size={14} />
                  </Button>
                  <div className="w-6 text-center font-bold text-primary text-sm tabular-nums">
                    {quantity}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md text-primary hover:bg-primary/20"
                    onClick={handleIncrement}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              ) : (
                <div className="shrink-0">
                  <Button
                    size="icon"
                    className={[
                      "rounded-xl h-10 w-10 shadow-md shadow-primary/10 transition-transform",
                      isAnimating ? "scale-95" : "scale-100",
                      "active:scale-95"
                    ].join(' ')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(e);
                    }}
                  >
                    <Plus size={20} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
