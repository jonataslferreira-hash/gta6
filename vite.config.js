import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { rolldownOptions: { input: ['index.html', 'cenas.html'] } },
  server: { allowedHosts: ['.e2b.app'] },
  preview: { allowedHosts: ['.e2b.app'] },
});
