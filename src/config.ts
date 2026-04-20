const readEnv = (key: string): string => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.[key] ?? '').trim();
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  const fromEnv = readEnv('VITE_API_BASE_URL');
  if (fromEnv) return stripTrailingSlash(fromEnv);

  return 'https://solar.api.cognilabs.org';
};
