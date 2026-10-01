/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `npm run build:artifact` produce varianta pentru link-ul de test (căi relative, nume de fișiere fixe).
const artifact = process.env.VITE_ARTIFACT === '1';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: artifact ? './' : '/',
  server: { port: 5173, host: true },
  build: artifact
    ? {
        outDir: 'dist-artifact',
        emptyOutDir: true,
        chunkSizeWarningLimit: 2000,
        rolldownOptions: {
          output: { entryFileNames: 'assets/app.js', chunkFileNames: 'assets/[name].js', assetFileNames: 'assets/[name][extname]' },
        },
      }
    : undefined,
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
