import React from 'react';
import { Home, Zap, Heart, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export type TabType = 'home' | 'catalog' | 'favorites' | 'orders' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useI18n();
  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'catalog', label: t('nav.catalog'), icon: Zap },
    { id: 'favorites', label: t('nav.saved'), icon: Heart },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingBag },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-2 pt-2 pb-safe-area-bottom z-50">
      <div className="flex items-center max-w-lg mx-auto h-16 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as TabType)}
              className={cn(
                // Fixed sizing to avoid any perceived shifting when labels differ in length.
                // Also suppress focus/tap highlight that can look like resizing in mobile webviews.
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent] rounded-2xl",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center transition-colors",
                  isActive ? "bg-primary/10" : "bg-gray-50"
                )}
              >
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className={cn(
                // Prevent wrap (Orders/Profile are longer) so height never changes.
                "w-full px-1 text-center text-[11px] font-semibold mt-1 leading-none whitespace-nowrap truncate",
                // Keep opacity constant to avoid “size” illusion when active changes.
                "opacity-100"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
