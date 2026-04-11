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
      <div className="flex justify-around items-center max-w-lg mx-auto h-14">
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
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="h-6 w-6 flex items-center justify-center">
                <Icon size={22} strokeWidth={2} />
              </div>
              <span className={cn(
                // Prevent wrap (Orders/Profile are longer) so height never changes.
                "w-full px-1 text-center text-[10px] font-medium mt-1 leading-none whitespace-nowrap truncate",
                isActive ? "opacity-100" : "opacity-70"
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
