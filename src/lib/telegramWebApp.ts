const TELEGRAM_INIT_DATA_CACHE_KEY = 'green_nrg_tg_init_data';
const TELEGRAM_SDK_SCRIPT_ID = 'telegram-webapp-sdk';

type TelegramWebAppObject = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

const getSessionItem = (key: string): string => {
  try {
    return window.sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const setSessionItem = (key: string, value: string): void => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const readInitDataFromUrl = (): string => {
  if (typeof window === 'undefined') return '';

  const sources: string[] = [window.location.search];
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (rawHash) {
    if (rawHash.includes('?')) {
      sources.push(rawHash.slice(rawHash.indexOf('?')));
    }
    sources.push(rawHash);
  }

  for (const source of sources) {
    const normalized = source.startsWith('?') ? source.slice(1) : source;
    const params = new URLSearchParams(normalized);
    const value = params.get('tgWebAppData') ?? params.get('telegramInitData');
    if (value) return value;
  }

  return '';
};

export const getTelegramWebApp = (): TelegramWebAppObject | null => {
  if (typeof window === 'undefined') return null;
  return (window as Window & { Telegram?: { WebApp?: TelegramWebAppObject } }).Telegram?.WebApp ?? null;
};

export const ensureTelegramWebAppScript = (): void => {
  if (typeof window === 'undefined') return;
  const telegram = (window as Window & { Telegram?: { WebApp?: TelegramWebAppObject } }).Telegram;
  if (telegram?.WebApp) return;

  const existing = document.getElementById(TELEGRAM_SDK_SCRIPT_ID);
  if (existing) return;

  const script = document.createElement('script');
  script.id = TELEGRAM_SDK_SCRIPT_ID;
  script.src = 'https://telegram.org/js/telegram-web-app.js';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

export const initializeTelegramWebApp = (): void => {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  try {
    webApp.ready?.();
    webApp.expand?.();
  } catch {
    // ignore Telegram WebApp runtime errors
  }
};

export const getTelegramInitData = (): string => {
  if (typeof window === 'undefined') return '';

  const fromWebApp = getTelegramWebApp()?.initData?.trim() ?? '';
  if (fromWebApp) {
    setSessionItem(TELEGRAM_INIT_DATA_CACHE_KEY, fromWebApp);
    return fromWebApp;
  }

  const fromUrl = readInitDataFromUrl().trim();
  if (fromUrl) {
    setSessionItem(TELEGRAM_INIT_DATA_CACHE_KEY, fromUrl);
    return fromUrl;
  }

  return getSessionItem(TELEGRAM_INIT_DATA_CACHE_KEY).trim();
};

export const waitForTelegramInitData = async (
  timeoutMs = 5000,
  pollMs = 150
): Promise<string> => {
  if (typeof window === 'undefined') return '';

  ensureTelegramWebAppScript();
  initializeTelegramWebApp();

  const started = Date.now();
  let current = getTelegramInitData();

  while (!current && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    initializeTelegramWebApp();
    current = getTelegramInitData();
  }

  return current;
};
