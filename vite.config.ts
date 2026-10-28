import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so GitHub Pages project URLs keep assets (incl. favicon) working
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
});
