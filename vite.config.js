import { defineConfig }   from 'vite'
import wasm               from 'vite-plugin-wasm'
import topLevelAwait      from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  base:    '/Terrawatch/',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: 'index.html',
    },
  },
  worker: {
    // Web Workers are plain JS — keep as-is
    format: 'es',
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer / WASM threads (if ever needed)
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
