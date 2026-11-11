import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Site de vendas. Em desenvolvimento, /api vai para o servidor de cadastro local (se estiver rodando).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:4100' },
  },
});
