import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist/legacy',
    lib: { entry: 'src/main.jsx', name: 'LegacyStudentApp', formats: ['iife'], fileName: () => 'app.js', cssFileName: 'app' },
    rollupOptions: { output: { assetFileNames: 'app[extname]' } },
  },
});
