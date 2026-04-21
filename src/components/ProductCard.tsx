import React, { useState } from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
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
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isFav = isFavorite(product.id);
  const productImage = getProductImage(product);
  const pricing = getProductPricing(product);
  const basePriceParts = formatUZSParts(pricing.basePrice, lang);
  const finalPriceParts = formatUZSParts(pricing.priceAfterSubsidy, lang);
  const subsidyParts = formatUZSParts(pricing.subsidyAmount, lang);

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
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-500 hover:text-red-500 active:scale-95 transition-transform"
          >
            <Heart
              size={18}
              fill={isFav ? '#ef4444' : 'none'}
              stroke={isFav ? '#ef4444' : 'currentColor'}
              color={isFav ? '#ef4444' : 'currentColor'}
            />
          </button>
          
          {compactBadges ? (
            pricing.isRecommended ? (
              <div className="absolute bottom-3 left-3">
                <Badge className="h-6 rounded-full bg-primary text-white shadow-sm">
                  {t('product.recommendedBadge')}
                </Badge>
              </div>
            ) : null
          ) : (
            <div className="absolute left-3 top-3 flex flex-wrap gap-2 pr-14">
              {pricing.isRecommended ? (
                <Badge className="h-6 rounded-full bg-primary text-white shadow-sm">
                  {t('product.recommendedBadge')}
                </Badge>
              ) : null}
              {pricing.hasSubsidy ? (
                <Badge className="h-6 rounded-full bg-emerald-50 text-emerald-700 shadow-sm">
                  {t('product.subsidyBadge')}
                </Badge>
              ) : null}
            </div>
          )}

          {(product.category?.name ?? product.category_name ?? product.category__name) && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-primary rounded-md">
                {product.category?.name ?? product.category_name ?? product.category__name}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 
            className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-primary transition-colors"
            onClick={() => onClick?.(product)}
          >
            {product.name}
          </h3>
          
          <div className="mt-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">{t('product.price')}</span>
              {pricing.hasSubsidy ? (
                <div className="mt-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-red-500 leading-none tabular-nums tracking-tight">
                    <span className="text-xs font-semibold line-through">{basePriceParts.amount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{basePriceParts.currency}</span>
                  </div>
                  <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-primary leading-none tabular-nums tracking-tight">
                    <span className="font-extrabold text-[clamp(0.95rem,3.8vw,1.125rem)]">{finalPriceParts.amount}</span>
                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{finalPriceParts.currency}</span>
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                    <span>{t('product.subsidyAmount')}</span>
                    <span className="tabular-nums">{subsidyParts.amount}</span>
                  </div>
                </div>
              ) : (
                <span className="mt-0.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-primary leading-none tabular-nums tracking-tight">
                  <span className="font-extrabold text-[clamp(0.95rem,3.8vw,1.125rem)]">{basePriceParts.amount}</span>
                  <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{basePriceParts.currency}</span>
                </span>
              )}
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
