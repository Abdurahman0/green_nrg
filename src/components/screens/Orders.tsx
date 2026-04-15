import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/services/api';
import { Order } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { formatUZSParts } from '@/lib/money';

export const Orders: React.FC = () => {
  const { t, lang } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="pb-24">
      <header className="p-6 bg-white sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('orders.subtitle')}</p>
      </header>

      <div className="px-6 mt-4 space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const totalParts = formatUZSParts(order.total_amount, lang);
            return (
              <div 
                key={order.id} 
                className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">{order.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(order.created_at).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('orders.total')}</span>
                    <span className="flex flex-wrap items-baseline gap-x-1 text-primary leading-none tabular-nums tracking-tight">
                      <span className="text-lg font-black">{totalParts.amount}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{totalParts.currency}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <ShoppingBag size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('orders.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
              {t('orders.emptyDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
