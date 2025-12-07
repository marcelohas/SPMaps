import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Para Vercel: base = '/'
  // Para GitHub Pages: base = '/SPMaps/'
  // Vercel define VERCEL=1 como variável de ambiente
  const base = env.VERCEL ? '/' : '/SPMaps/';

  return {
    base: base,
    publicDir: 'public',
    plugins: [react()],
    define: {
      // API_KEY vem das variáveis de ambiente do Vercel ou .env.local
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true
    }
  };
});