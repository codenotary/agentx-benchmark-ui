import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-jsonic',
      writeBundle() {
        // Copy jsonic.min.js to dist after build
        try {
          copyFileSync(
            resolve(__dirname, 'public/jsonic.min.js'),
            resolve(__dirname, 'dist/jsonic.min.js')
          )
          console.log('✓ Copied jsonic.min.js to dist')
        } catch (err) {
          console.error('Failed to copy jsonic.min.js:', err)
        }
      }
    }
  ],
  base: process.env.NODE_ENV === 'production' ? '/agentx-benchmark-ui/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['sql.js-httpvfs']
  }
})
