import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Detectar se está rodando no Vercel
  const isVercel = process.env.VERCEL === '1';

  return {
    // URL Base: vazio para Vercel, /SPMaps/ para GitHub Pages
    base: isVercel ? '/' : '/SPMaps/',
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