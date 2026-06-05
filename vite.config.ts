import { defineConfig } from 'vite';

// Vite config for Tomo Island.
// - Base './' so the itchio static build resolves assets from relative URLs.
// - 480x270 base canvas resolution; PixiJS handles integer scaling.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          mediapipe: ['@mediapipe/tasks-genai'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-genai'],
  },
});
