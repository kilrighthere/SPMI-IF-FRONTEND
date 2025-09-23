import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://152.42.220.235:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    // Vite restricts file serving to a default allow list. When importing
    // local font files from node_modules (eg. @fontsource) on Windows the
    // dev server may block the request with "outside of Vite serving allow list".
    // Add the project root and node_modules to the fs.allow list so those
    // files can be served during development.
    fs: {
      allow: [
        fileURLToPath(new URL('./', import.meta.url)),
        fileURLToPath(new URL('./node_modules', import.meta.url)),
        // Allow parent-level node_modules in case packages are hoisted (pnpm/workspace)
        fileURLToPath(new URL('../node_modules', import.meta.url)),
      ],
    },
    host: '0.0.0.0',
    port: 5173,
  },
})
