import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to copy JSONIC files to dist
const copyJsonicPlugin = () => ({
  name: 'copy-jsonic',
  closeBundle() {
    // Copy essential JSONIC files
    const filesToCopy = [
      { src: 'public/jsonic-wrapper.esm.js', dest: 'dist/jsonic-wrapper.esm.js' },
      { src: 'public/jsonic_wasm.js', dest: 'dist/jsonic_wasm.js' },
      { src: 'public/jsonic_wasm_bg.wasm', dest: 'dist/jsonic_wasm_bg.wasm' },
      { src: 'public/test-jsonic.html', dest: 'dist/test-jsonic.html' }
    ]
    
    filesToCopy.forEach(({ src, dest }) => {
      const sourcePath = path.resolve(src)
      const destPath = path.resolve(dest)
      
      if (fs.existsSync(sourcePath)) {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        
        fs.copyFileSync(sourcePath, destPath)
        console.log(`Copied ${path.basename(src)} to ${dest}`)
      } else {
        console.warn(`Warning: ${src} not found`)
      }
    })
    
    // Copy old jsonic folder if it exists (for backwards compatibility)
    const jsonicSourceDir = path.resolve('public/jsonic')
    const jsonicDestDir = path.resolve('dist/jsonic')
    
    if (fs.existsSync(jsonicSourceDir)) {
      if (!fs.existsSync(jsonicDestDir)) {
        fs.mkdirSync(jsonicDestDir, { recursive: true })
      }
      
      const files = fs.readdirSync(jsonicSourceDir)
      files.forEach(file => {
        const src = path.join(jsonicSourceDir, file)
        const dest = path.join(jsonicDestDir, file)
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest)
          console.log(`Copied ${file} to dist/jsonic/`)
        }
      })
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
    exclude: ['sql.js-httpvfs', 'jsonic.esm.js']
  }
})
