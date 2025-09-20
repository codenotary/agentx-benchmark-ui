import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to copy JSONIC to dist
const copyJsonicPlugin = () => ({
  name: 'copy-jsonic',
  closeBundle() {
    const source = path.resolve('public/jsonic.min.js')
    const dest = path.resolve('dist/jsonic.min.js')
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest)
      console.log('Copied jsonic.min.js to dist')
    } else {
      console.warn('jsonic.min.js not found in public folder')
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyJsonicPlugin()],
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
