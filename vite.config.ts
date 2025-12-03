import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // O terceiro parâmetro '' garante que carregue todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Substitui a string "process.env.API_KEY" pelo valor real da chave durante o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      // Polyfill de segurança para bibliotecas que usam process.env
      'process.env': JSON.stringify({})
    },
    server: {
      host: true
    }
  };
});