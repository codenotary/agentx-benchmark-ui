import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/agentx-benchmark-ui/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['sql.js-httpvfs']
  }
})
