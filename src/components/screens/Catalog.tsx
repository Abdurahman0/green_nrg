import React, { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, List, ImageOff, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { CatalogData, Category, Product, CatalogSort } from '@/types';
import { ProductCard } from '../ProductCard';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { dispatchCartFlyFromElement } from '@/lib/cartFly';
import { useI18n } from '@/lib/i18n';
import { getProductImage } from '@/lib/productMedia';
import { formatUZSParts } from '@/lib/money';
import { StylishDropdown } from '@/components/ui/stylish-dropdown';
import { getProductPricing } from '@/lib/productSubsidy';

interface CatalogProps {
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onProductClick, onAddToCart }) => {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<CatalogSort>('price_asc');
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories once on mount
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Re-fetch products whenever selectedCategory changes
  // 'all' → no filter param; any other value → pass as category code/uuid
  useEffect(() => {
    let isMounted = true;
    const isFirst = selectedCategory === 'all';

    const load = async () => {
      if (isFirst) setLoading(true); else setCategoryLoading(true);
      try {
        const catalog = await api.getCatalog(
          selectedCategory === 'all' ? undefined : selectedCategory,
          sortBy
        );
        if (isMounted) setCatalog(catalog);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setCategoryLoading(false);
        }
      }
    };

    load();
    return () => { isMounted = false; };
  }, [selectedCategory, sortBy]);

  const products = catalog?.products ?? [];
  const recommendedProducts = useMemo(
    () =>
      (catalog?.recommended_products ?? []).filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [catalog?.recommended_products, searchQuery]
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortOptions = [
    { value: 'price_asc', label: t('catalog.sort.priceAsc') },
    { value: 'price_desc', label: t('catalog.sort.priceDesc') },
    { value: 'cheap_first', label: t('catalog.sort.cheapFirst') },
    { value: 'expensive_first', label: t('catalog.sort.expensiveFirst') },
  ] as const;

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="p-6 pb-2 bg-white sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('catalog.title')}</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("rounded-xl", viewMode === 'grid' && "bg-primary/10 text-primary")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("rounded-xl", viewMode === 'list' && "bg-primary/10 text-primary")}
              onClick={() => setViewMode('list')}
            >
              <List size={20} />
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid gap-3 mb-6 md:grid-cols-[1fr_220px]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t('catalog.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <StylishDropdown
            id="catalog-sort-by"
            label={t('catalog.sort.label')}
            placeholder={t('catalog.sort.label')}
            value={sortBy}
            onChange={(value) => setSortBy(value as CatalogSort)}
            options={sortOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>

        {/* Categories Chips */}
        <div className="w-full overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-3 pr-6">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-full" />)
            ) : (
              // "All" chip first, then filtered categories from backend (non-empty only)
              [{ id: 'all', name: t('catalog.all'), code: 'all' }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    // Use code for filtering (also accepts uuid — both work)
                    setSelectedCategory(cat.code === 'all' ? 'all' : cat.code);
                  }}
                  className={cn(
                    "shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border",
                    selectedCategory === (cat.code === 'all' ? 'all' : cat.code)
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>
      </header>

      {/* Product Listing */}
      <div className="px-6 mt-4">
        {loading || categoryLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {selectedCategory === 'all' && recommendedProducts.length > 0 ? (
              <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-white p-4 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                      {t('catalog.recommendedTitle')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{t('catalog.recommendedSubtitle')}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {recommendedProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} onClick={onProductClick} />
                  ))}
                </div>
              </section>
            ) : null}

            {filteredProducts.length > 0 ? (
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
              )}>
                {filteredProducts.map((product) => {
                  const productImage = getProductImage(product);
                  const pricing = getProductPricing(product);
                  const basePriceParts = formatUZSParts(pricing.basePrice, lang);
                  const finalPriceParts = formatUZSParts(pricing.priceAfterSubsidy, lang);

                  return viewMode === 'grid' ? (
                    <div key={product.id} className="animate-in fade-in duration-200">
                      <ProductCard product={product} onClick={onProductClick} />
                    </div>
                  ) : (
                    <div
                      key={product.id}
                      className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => onProductClick(product)}
                    >
                      <div className="w-24 h-24 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover object-center transform-gpu group-hover:scale-[1.03] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-white text-primary flex items-center justify-center">
                            <ImageOff size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {product.category?.name ?? product.category_name ?? product.category__name}
                          </span>
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mt-0.5">
                            {product.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          {pricing.hasSubsidy ? (
                            <span className="flex flex-col gap-1">
                              <span className="flex flex-wrap items-baseline gap-x-1 text-red-500 leading-none tabular-nums tracking-tight">
                                <span className="text-xs font-semibold line-through">{basePriceParts.amount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{basePriceParts.currency}</span>
                              </span>
                              <span className="flex flex-wrap items-baseline gap-x-1 text-primary leading-none tabular-nums tracking-tight">
                                <span className="text-lg font-black">{finalPriceParts.amount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{finalPriceParts.currency}</span>
                              </span>
                            </span>
                          ) : (
                            <span className="flex flex-wrap items-baseline gap-x-1 text-primary leading-none tabular-nums tracking-tight">
                              <span className="text-lg font-black">{basePriceParts.amount}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{basePriceParts.currency}</span>
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="rounded-lg h-8 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatchCartFlyFromElement(e.currentTarget, productImage);
                              onAddToCart(product);
                            }}
                          >
                            {t('catalog.add')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <Search size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('catalog.noProducts')}</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
                  {t('catalog.tryAdjust')}
                </p>
                <Button 
                  variant="link" 
                  className="mt-4 text-primary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  {t('catalog.clearFilters')}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
