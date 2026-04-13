const readEnv = (key: string): string => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.[key] ?? '').trim();
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  const fromEnv = readEnv('VITE_API_BASE_URL');

  // In production (Vercel + Telegram WebView), always prefer same-origin proxy to avoid CORS.
  // This also protects us if someone accidentally sets VITE_API_BASE_URL in Vercel envs.
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const solarOrigin = 'https://solar.api.cognilabs.org';
    if (origin !== solarOrigin) return '';
  }

  // For local dev or when hosted on the same origin as the backend, allow overriding.
  if (fromEnv) return stripTrailingSlash(fromEnv);

  return '';
};
