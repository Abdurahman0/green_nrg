import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const allowedHosts = [
    'nonofficinal-brent-telepathic.ngrok-free.dev',
    ...(env.VITE_ALLOWED_HOSTS
      ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
      : []),
  ];
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim() || 'https://solar.api.cognilabs.org';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts,
      proxy: proxyTarget
        ? {
            '/api/telegram-webapp': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
              rewrite: (path) => {
                if (path === '/api/telegram-webapp/common/public/subsidy-calculator/') {
                  return '/api/common/public/subsidy-calculator/';
                }

                return path.replace(
                  /^\/api\/telegram-webapp\/?/,
                  '/api/integrations/telegram/webapp/'
                );
              },
            },
          }
        : undefined,
    },
  };
});
