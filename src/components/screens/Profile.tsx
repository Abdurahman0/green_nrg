import React, { useEffect, useState } from 'react';
import {
  Settings,
  CreditCard,
  MapPin,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import { api } from '@/services/api';
import { BootstrapData, Profile as ProfileType } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useDebug } from '@/lib/DebugContext';
import { debugStore, makeId } from '@/lib/debugStore';

interface ProfileProps {
  onNavigate: (tab: any) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { t, lang, setLang } = useI18n();
  const { enabled: debugEnabled, setEnabled: setDebugEnabled } = useDebug();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      debugStore.push({
        id: makeId(),
        ts: Date.now(),
        kind: 'log',
        message: 'Profile: fetchData started',
      });
      try {
        const [profileData, bootstrapData] = await Promise.all([
          api.getProfile(),
          api.getBootstrap(),
        ]);
        setProfile(profileData);
        setBootstrap(bootstrapData);
        debugStore.push({
          id: makeId(),
          ts: Date.now(),
          kind: 'log',
          message: 'Profile: fetchData success',
        });
      } catch (error) {
        console.error(error);
        debugStore.push({
          id: makeId(),
          ts: Date.now(),
          kind: 'log',
          message: 'Profile: fetchData error',
          meta: { error: error instanceof Error ? error.message : String(error) },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const menuItems = [
    { icon: ShoppingBag, label: t('profile.orders'), sub: t('profile.ordersSub'), tab: 'orders' },
    { icon: Heart, label: t('profile.favorites'), sub: t('profile.favoritesSub'), tab: 'favorites' },
    { icon: CreditCard, label: t('profile.payments'), sub: t('profile.paymentsSub') },
    { icon: MapPin, label: t('profile.addresses'), sub: t('profile.addressesSub') },
    { icon: Bell, label: t('profile.notifications'), sub: t('profile.notificationsSub') },
    { icon: Shield, label: t('profile.privacy'), sub: t('profile.privacySub') },
  ];

  return (
    <div className="pb-24">
      {loading ? (
        <div className="p-6 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="p-8 bg-gradient-to-b from-primary/5 to-white flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center text-primary text-4xl font-black shadow-xl shadow-primary/10 border-4 border-white">
                {profile?.full_name?.[0] ?? profile?.username?.[0] ?? '?'}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-2xl border-4 border-white shadow-lg">
                <Settings size={18} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900">{profile?.full_name}</h1>
            <p className="text-sm font-bold text-primary mt-1">@{profile?.username}</p>

            <div className="flex gap-4 mt-8 w-full max-w-xs">
              <div className="flex-1 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <span className="block text-xl font-black text-gray-900">{bootstrap?.order_history.length ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {t('profile.ordersCount')}
                </span>
              </div>
              <div className="flex-1 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <span className="block text-xl font-black text-gray-900">{bootstrap?.favorites.length ?? 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {t('profile.favorites')}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 space-y-3">
            <div className="p-4 bg-white rounded-3xl border border-gray-50 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {t('profile.lang')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLang('uz')}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-bold transition-all',
                    lang === 'uz' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'
                  )}
                >
                  Uzbek
                </button>
                <button
                  onClick={() => setLang('ru')}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-bold transition-all',
                    lang === 'ru' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'
                  )}
                >
                  Russian
                </button>
              </div>
            </div>

            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => item.tab && onNavigate(item.tab)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <item.icon size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                    <p className="text-[10px] font-medium text-gray-400">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}

            <button className="w-full flex items-center justify-between p-4 bg-red-50/50 rounded-3xl border border-red-100 mt-6 group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-red-600">{t('profile.signOut')}</h3>
                  <p className="text-[10px] font-medium text-red-400">{t('profile.signOutSub')}</p>
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      <div className="p-10 text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
          Green NRG Energy Solutions
        </p>
        <p className="text-[10px] text-gray-300 mt-1">v1.0.4 Premium WebApp</p>
        <button
          type="button"
          onClick={() => {
            setDebugEnabled(!debugEnabled);
          }}
          className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 hover:text-primary"
        >
          {debugEnabled ? 'Hide debug' : 'Show debug'}
        </button>
      </div>
    </div>
  );
};

