import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Painel administrativo do GymApp (só para o dono da empresa).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
