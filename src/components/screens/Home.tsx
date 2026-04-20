import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Loader2,
  PackageCheck,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';
import { api } from '@/services/api';
import { BootstrapData, CatalogData, Product, Review } from '@/types';
import { ProductCard } from '../ProductCard';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { debugStore, makeId } from '@/lib/debugStore';
import { getApiBaseUrl } from '@/config';
import ReactCountryFlag from 'react-country-flag';
import { services } from '@/services';
import type { SubsidyCalculatorData } from '@/services/common';
import { SUBSIDY_CALCULATOR_PATH } from '@/services/common';
import {
  inverterTypeOptions,
  panelTypeOptions,
  requestedPowerOptions,
} from '@/lib/subsidyOptions';
import { StylishDropdown } from '@/components/ui/stylish-dropdown';

interface SubsidyFormState {
  panelType: string;
  inverterType: string;
  requestedPowerKw: string;
}

interface SubsidyRequestDebug {
  url: string;
  method: 'POST';
  body: {
    panel_type: string;
    inverter_type: string;
    requested_power_kw: number;
    audit_power_kw: number;
  };
  error?: string;
}

type SubsidyFormErrors = Partial<Record<keyof SubsidyFormState, string>>;

const REQUESTED_POWER_PLACEHOLDER = {
  uz: 'Quvvatni tanlang',
  ru: 'Выберите мощность',
} as const;

const formatSubsidyValue = (value: unknown, lang: 'uz' | 'ru') => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return new Intl.NumberFormat(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      maximumFractionDigits: 4,
    }).format(value);
  }
  if (typeof value === 'boolean') {
    if (lang === 'uz') return value ? 'Ha' : "Yo'q";
    return value ? 'Да' : 'Нет';
  }
  if (typeof value === 'string') {
    return value.trim() || '—';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildDocumentedSubsidyRows = (result: SubsidyCalculatorData, lang: 'uz' | 'ru') => {
  const rows = [
    { key: 'base_price', label: 'Base Price', value: result.base_price },
    { key: 'subsidy_amount', label: 'Subsidy Amount', value: result.subsidy_amount },
    { key: 'customer_amount', label: 'Customer Amount', value: result.customer_amount },
    {
      key: 'subsidy_reference_power_kw',
      label: 'Subsidy Reference Power (kW)',
      value: result.subsidy_reference_power_kw,
    },
  ];

  return rows
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
    .map((row) => ({
      key: row.key,
      label: row.label,
      value: formatSubsidyValue(row.value, lang),
    }));
};

const SUBSIDY_COPY = {
  uz: {
    title: 'Subsidiya kalkulyatori',
    subtitle: "Panel va invertor parametrlarini kiriting, subsidiyani tezda hisoblang.",
    panelType: 'Panel turi',
    inverterType: 'Invertor turi',
    requestedPower: "So'ralgan quvvat (kVt)",
    panelPlaceholder: 'Panel turini tanlang',
    inverterPlaceholder: 'Invertor turini tanlang',
    calculate: 'Hisoblash',
    calculating: 'Hisoblanmoqda...',
    resultTitle: 'Natijalar',
    resultSummary: 'Hisoblash natijalari',
    resultFallback: "Natijalarni batafsil ko'rish",
    errorRequired: 'Bu maydon majburiy.',
    errorPositive: '0 dan katta qiymat kiriting.',
    errorGeneric: "Hisoblashni bajarib bo'lmadi. Qayta urinib ko'ring.",
    panel: {
      monocrystalline: 'Monokristall',
      polycrystalline: 'Polikristall',
      thinFilm: 'Yupqa plyonka',
    },
    inverter: {
      string: 'String',
      hybrid: 'Gibrid',
      onGrid: 'Tarmoqqa ulangan',
      offGrid: 'Avtonom',
    },
  },
  ru: {
    title: 'Калькулятор субсидии',
    subtitle: 'Укажите параметры панели и инвертора, чтобы быстро рассчитать субсидию.',
    panelType: 'Тип панели',
    inverterType: 'Тип инвертора',
    requestedPower: 'Запрашиваемая мощность (кВт)',
    panelPlaceholder: 'Выберите тип панели',
    inverterPlaceholder: 'Выберите тип инвертора',
    calculate: 'Рассчитать',
    calculating: 'Расчёт...',
    resultTitle: 'Результаты',
    resultSummary: 'Параметры расчёта',
    resultFallback: 'Подробный просмотр результатов',
    errorRequired: 'Это поле обязательно.',
    errorPositive: 'Введите значение больше 0.',
    errorGeneric: 'Не удалось выполнить расчёт. Попробуйте ещё раз.',
    panel: {
      monocrystalline: 'Монокристаллическая',
      polycrystalline: 'Поликристаллическая',
      thinFilm: 'Тонкоплёночная',
    },
    inverter: {
      string: 'String',
      hybrid: 'Гибридный',
      onGrid: 'Сетевой',
      offGrid: 'Автономный',
    },
  },
} as const;

interface HomeProps {
  onNavigate: (tab: any) => void;
  onProductClick: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onProductClick }) => {
  const { t, lang, setLang } = useI18n();
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [subsidyForm, setSubsidyForm] = useState<SubsidyFormState>({
    panelType: '',
    inverterType: '',
    requestedPowerKw: '',
  });
  const [subsidyErrors, setSubsidyErrors] = useState<SubsidyFormErrors>({});
  const [subsidyResult, setSubsidyResult] = useState<SubsidyCalculatorData | null>(null);
  const [subsidyLoading, setSubsidyLoading] = useState(false);
  const [subsidyError, setSubsidyError] = useState<string | null>(null);
  const [subsidyDebug, setSubsidyDebug] = useState<SubsidyRequestDebug | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const subsidyCopy = SUBSIDY_COPY[lang];
  const subsidyApiUrl = `${getApiBaseUrl()}${SUBSIDY_CALCULATOR_PATH}`;

  useEffect(() => {
    const fetchData = async () => {
      debugStore.push({
        id: makeId(),
        ts: Date.now(),
        kind: 'log',
        message: 'Home: fetchData started',
      });
      try {
        const [b, c] = await Promise.all([
          api.getBootstrap(),
          api.getCatalog()
        ]);
        setBootstrap(b);
        setCatalog(c);
        debugStore.push({
          id: makeId(),
          ts: Date.now(),
          kind: 'log',
          message: 'Home: fetchData success',
          meta: {
            products: c.products.length,
            promoted: c.promoted_products.length,
          },
        });
      } catch (error) {
        console.error(error);
        debugStore.push({
          id: makeId(),
          ts: Date.now(),
          kind: 'log',
          message: 'Home: fetchData error',
          meta: { error: error instanceof Error ? error.message : String(error) },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLangMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLangMenuOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangMenuOpen]);

  const updateSubsidyField = <K extends keyof SubsidyFormState>(
    field: K,
    value: SubsidyFormState[K]
  ) => {
    setSubsidyForm((prev) => ({ ...prev, [field]: value }));
    setSubsidyErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubsidyError(null);
    setSubsidyResult(null);
  };

  const handleSubsidySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubsidyError(null);

    const nextErrors: SubsidyFormErrors = {};
    if (!subsidyForm.panelType) {
      nextErrors.panelType = subsidyCopy.errorRequired;
    }
    if (!subsidyForm.inverterType) {
      nextErrors.inverterType = subsidyCopy.errorRequired;
    }

    const requestedPowerKw = Number.parseFloat(subsidyForm.requestedPowerKw);
    if (!subsidyForm.requestedPowerKw.trim()) {
      nextErrors.requestedPowerKw = subsidyCopy.errorRequired;
    } else if (!Number.isFinite(requestedPowerKw) || requestedPowerKw <= 0) {
      nextErrors.requestedPowerKw = subsidyCopy.errorPositive;
    }

    setSubsidyErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubsidyLoading(true);
    const requestBody = {
      panel_type: subsidyForm.panelType,
      inverter_type: subsidyForm.inverterType,
      requested_power_kw: requestedPowerKw,
      audit_power_kw: requestedPowerKw,
    };
    setSubsidyDebug({
      url: subsidyApiUrl,
      method: 'POST',
      body: requestBody,
    });
    try {
      const result = await services.common.calculateSubsidy(requestBody);

      if (result && typeof result === 'object' && !Array.isArray(result)) {
        setSubsidyResult(result as SubsidyCalculatorData);
      } else {
        setSubsidyResult({ raw_result: result } as SubsidyCalculatorData);
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : subsidyCopy.errorGeneric;
      setSubsidyError(message);
      setSubsidyDebug((prev) => (prev ? { ...prev, error: message } : prev));
      debugStore.push({
        id: makeId(),
        ts: Date.now(),
        kind: 'log',
        message: 'Home: subsidy calculation failed',
        meta: { message },
      });
    } finally {
      setSubsidyLoading(false);
    }
  };

  const subsidyRows =
    subsidyResult && typeof subsidyResult === 'object' && !Array.isArray(subsidyResult)
      ? buildDocumentedSubsidyRows(subsidyResult, lang)
      : [];

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const username = bootstrap?.user?.username?.trim() || 'User';
  const isTechnicalUsername = /^tgwebapp_\d+$/i.test(username);
  const displayName = bootstrap?.customer?.full_name?.trim() || (isTechnicalUsername ? t('user.defaultName') : username);
  const phone = bootstrap?.customer?.phone?.trim();
  const userInitial = displayName.charAt(0).toUpperCase();
  const featuredProducts =
    (catalog?.promoted_products?.length ? catalog.promoted_products : catalog?.products) ?? [];
  const ordersCount = bootstrap?.order_history?.length ?? 0;
  const favoritesCount = bootstrap?.favorites?.length ?? 0;
  const paymentMethodsCount = bootstrap?.payment_methods?.length ?? 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.home')}</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen((v) => !v)}
              className="h-11 rounded-xl bg-gray-50 pl-3 pr-9 text-xs font-black uppercase tracking-widest text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
              aria-label="Language"
              aria-haspopup="menu"
              aria-expanded={isLangMenuOpen}
            >
              <span className="inline-flex items-center gap-2">
                <ReactCountryFlag
                  countryCode={lang === 'uz' ? 'UZ' : 'RU'}
                  svg
                  style={{ width: '1.1em', height: '1.1em' }}
                  aria-hidden="true"
                />
                {lang === 'uz' ? 'UZ' : 'RU'}
              </span>
            </button>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {isLangMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-32 rounded-2xl border border-gray-100 bg-white p-1 shadow-lg"
              >
                {[
                  { value: 'uz' as const, label: 'UZ', countryCode: 'UZ' as const },
                  { value: 'ru' as const, label: 'RU', countryCode: 'RU' as const },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLang(item.value);
                      setIsLangMenuOpen(false);
                    }}
                    className={cn(
                      'w-full rounded-xl px-3 py-2 text-left text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2',
                      lang === item.value ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <ReactCountryFlag
                      countryCode={item.countryCode}
                      svg
                      style={{ width: '1.1em', height: '1.1em' }}
                      aria-hidden="true"
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
            {userInitial}
          </div>
        </div>
      </header>

      <section className="px-6 mb-6">
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                Green NRG
              </p>
              <h2 className="mt-1 text-xl font-black text-gray-900 truncate">{displayName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {displayName !== username && !isTechnicalUsername ? (
                  <span className="font-semibold text-primary/80">@{username}</span>
                ) : null}
                {phone ? <span className="font-medium">{phone}</span> : null}
              </div>
            </div>
            <div className="shrink-0">
              <div className="h-11 w-11 rounded-2xl bg-white border border-primary/10 shadow-sm flex items-center justify-center text-primary font-black">
                {userInitial}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3 border border-primary/10">
              <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                <PackageCheck size={14} />
              </div>
              <p className="text-lg font-black text-gray-900 tabular-nums">{ordersCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t('nav.orders')}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 border border-primary/10">
              <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                <Star size={14} />
              </div>
              <p className="text-lg font-black text-gray-900 tabular-nums">{favoritesCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t('nav.saved')}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 border border-primary/10">
              <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                <Wallet size={14} />
              </div>
              <p className="text-lg font-black text-gray-900 tabular-nums">{paymentMethodsCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t('profile.payments')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 mb-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calculator size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                Green NRG
              </p>
              <h2 className="mt-1 text-lg font-black text-gray-900">
                {subsidyCopy.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {subsidyCopy.subtitle}
              </p>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubsidySubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <StylishDropdown
                id="subsidy-panel-type"
                label={subsidyCopy.panelType}
                placeholder={subsidyCopy.panelPlaceholder}
                value={subsidyForm.panelType}
                onChange={(value) => updateSubsidyField('panelType', value)}
                error={subsidyErrors.panelType}
                options={panelTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />

              <StylishDropdown
                id="subsidy-inverter-type"
                label={subsidyCopy.inverterType}
                placeholder={subsidyCopy.inverterPlaceholder}
                value={subsidyForm.inverterType}
                onChange={(value) => updateSubsidyField('inverterType', value)}
                error={subsidyErrors.inverterType}
                options={inverterTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            </div>

            <StylishDropdown
              id="subsidy-requested-power"
              label={subsidyCopy.requestedPower}
              placeholder={REQUESTED_POWER_PLACEHOLDER[lang]}
              value={subsidyForm.requestedPowerKw}
              onChange={(value) => updateSubsidyField('requestedPowerKw', value)}
              error={subsidyErrors.requestedPowerKw}
              options={requestedPowerOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />

            {subsidyError ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{subsidyError}</span>
              </div>
            ) : null}

            {subsidyDebug ? (
              <details className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.22em] text-gray-600">
                  Request Debug
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl bg-white p-3 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                      URL
                    </p>
                    <p className="mt-1 break-all text-xs text-gray-800">{subsidyDebug.url}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                      Body
                    </p>
                    <pre className="mt-2 overflow-x-auto text-xs leading-6 text-gray-700">
                      {JSON.stringify(subsidyDebug.body, null, 2)}
                    </pre>
                  </div>
                  {subsidyDebug.error ? (
                    <div className="rounded-2xl bg-white p-3 border border-red-100">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-500">
                        Error
                      </p>
                      <p className="mt-1 text-xs text-red-700 break-words">{subsidyDebug.error}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl font-bold shadow-sm shadow-primary/20"
              disabled={subsidyLoading}
              aria-busy={subsidyLoading}
            >
              {subsidyLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {subsidyCopy.calculating}
                </span>
              ) : (
                subsidyCopy.calculate
              )}
            </Button>
          </form>

          {subsidyResult ? (
            <div className="mt-5 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
                    {subsidyCopy.resultTitle}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    {subsidyRows.length > 0
                      ? subsidyCopy.resultSummary
                      : subsidyCopy.resultFallback}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10">
                  <Calculator size={16} />
                </div>
              </div>

              {subsidyRows.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {subsidyRows.map((row) => (
                    <div key={row.key} className="rounded-2xl border border-gray-100 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                        {row.label}
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-gray-900">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-gray-50 p-3 text-xs leading-6 text-gray-600">
                  {JSON.stringify(subsidyResult, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('home.search')}
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm text-gray-800 placeholder:text-gray-500 shadow-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>


      {/* Featured Products Grid */}
      <section className="px-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{t('home.featured')}</h2>
          <Button variant="ghost" size="sm" className="text-primary font-semibold" onClick={() => onNavigate('catalog')}>
            {t('home.seeMore')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={onProductClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
