export type Language = 'uz' | 'ru';

export type MoneyParts = {
  amount: string;
  currency: string;
};

const DEFAULT_CURRENCY_LABEL = "so'm";

export const formatUZSParts = (value: number, lang: Language = 'ru'): MoneyParts => {
  const numeric = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(numeric);

  const locale = lang === 'uz' ? 'uz-UZ' : 'ru-RU';
  const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(rounded);

  return { amount, currency: DEFAULT_CURRENCY_LABEL };
};

export const formatUZS = (value: number, lang: Language = 'ru'): string => {
  const { amount, currency } = formatUZSParts(value, lang);
  return `${amount} ${currency}`;
};

