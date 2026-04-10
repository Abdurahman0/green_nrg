import React, { useEffect, useState } from 'react';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { Order } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

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

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return CheckCircle2;
      case 'shipped': return Truck;
      case 'processing': return Clock;
      default: return Package;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return "bg-primary/10 text-primary border-primary/20";
      case 'shipped': return "bg-primary/5 text-primary/80 border-primary/10";
      case 'processing': return "bg-secondary text-secondary-foreground border-primary/5";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

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
            const StatusIcon = getStatusIcon(order.status);
            return (
              <div 
                key={order.id} 
                className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl border", getStatusColor(order.status))}>
                      <StatusIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(order.created_at).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", getStatusColor(order.status))}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('orders.total')}</span>
                    <span className="text-lg font-black text-primary">
                      ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                    {t('orders.viewDetails')}
                    <ChevronRight size={16} className="ml-1" />
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
