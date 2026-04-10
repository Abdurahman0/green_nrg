import React, { useState } from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion } from 'motion/react';
import { useCart } from '@/lib/CartContext';
import { useFavorites } from '@/lib/FavoritesContext';
import { dispatchCartFlyFromElement } from '@/lib/cartFly';
import { useI18n } from '@/lib/i18n';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick
}) => {
  const { t } = useI18n();
  const { items, addToCart, updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isFav = isFavorite(product.id);
  // Placeholder image based on category or name
  const getPlaceholderImage = (p: Product) => {
    const category = p.category__name?.toLowerCase() || '';
    if (category.includes('solar')) return 'https://picsum.photos/seed/solar/400/400';
    if (category.includes('storage') || category.includes('battery')) return 'https://picsum.photos/seed/battery/400/400';
    if (category.includes('inverter')) return 'https://picsum.photos/seed/tech/400/400';
    if (category.includes('ev')) return 'https://picsum.photos/seed/ev/400/400';
    return `https://picsum.photos/seed/${p.id}/400/400`;
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    dispatchCartFlyFromElement(e.currentTarget, getPlaceholderImage(product));
    setIsAnimating(true);
    addToCart(product);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    dispatchCartFlyFromElement(e.currentTarget, getPlaceholderImage(product));
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group rounded-2xl">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={getPlaceholderImage(product)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onClick={() => onClick?.(product)}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 bg-white/80 text-gray-400 hover:text-red-500"
          >
            <motion.div
              animate={{ scale: isFav ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={18} fill={isFav ? "#ef4444" : "none"} stroke={isFav ? "#ef4444" : "currentColor"} color={isFav ? "#ef4444" : "currentColor"} />
            </motion.div>
          </button>
          
          {product.category__name && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-primary rounded-md backdrop-blur-sm">
                {product.category__name}
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
              <span className="text-lg font-bold text-primary leading-none">
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-2 h-10 flex items-center justify-end">
              {quantity > 0 ? (
                <motion.div
                  layout
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-1"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md text-primary hover:bg-primary/20"
                    onClick={handleDecrement}
                  >
                    <Minus size={14} />
                  </Button>
                  <motion.div
                    key={quantity}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-6 text-center font-bold text-primary text-sm"
                  >
                    {quantity}
                  </motion.div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md text-primary hover:bg-primary/20"
                    onClick={handleIncrement}
                  >
                    <Plus size={14} />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: isAnimating ? [1, 0.8, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                  className="shrink-0"
                >
                  <Button
                    size="icon"
                    className="rounded-xl h-10 w-10 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(e);
                    }}
                  >
                    <Plus size={20} />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
