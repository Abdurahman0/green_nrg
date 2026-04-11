const readEnv = (key: string): string => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.[key] ?? '').trim();
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  // Must be stable in production builds where `.env` is not present at runtime.
  const fromEnv = readEnv('VITE_API_BASE_URL');
  if (fromEnv) return stripTrailingSlash(fromEnv);

  // Default to same-origin (Vercel proxy) to avoid CORS.
  return '';
};
