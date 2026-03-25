import { defineConfig } from 'vite';

export default defineConfig({
  base: '/asobu/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
