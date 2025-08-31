import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure proper chunk loading
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
