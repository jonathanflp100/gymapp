import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Para desenvolver contra um openGym local: OPENGYM_URL=http://localhost:3000 npm run dev
const openGymProxy = process.env.OPENGYM_URL
  ? { '/api': { target: process.env.OPENGYM_URL, changeOrigin: false } }
  : undefined;

export default defineConfig(() => {
  return {
    preview: { proxy: openGymProxy },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: openGymProxy,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
