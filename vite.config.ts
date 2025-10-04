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
      { src: 'public/test-jsonic.html', dest: 'dist/test-jsonic.html' },
      // Copy optimized database files
      { src: 'public/data/database.jsonic', dest: 'dist/data/database.jsonic' },
      { src: 'public/data/database.jsonic.gz', dest: 'dist/data/database.jsonic.gz' },
      // Note: jsonic-bench directory is copied separately below
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
    
    // Copy jsonic-bench directory recursively
    const benchSourceDir = path.resolve('public/jsonic-bench')
    const benchDestDir = path.resolve('dist/jsonic-bench')
    
    if (fs.existsSync(benchSourceDir)) {
      copyDirectoryRecursive(benchSourceDir, benchDestDir)
      console.log(`Copied jsonic-bench directory to dist/`)
    }
    
    function copyDirectoryRecursive(src: string, dest: string) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }
      
      const entries = fs.readdirSync(src, { withFileTypes: true })
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        
        // Skip node_modules for benchmark
        if (entry.name === 'node_modules') continue
        
        if (entry.isDirectory()) {
          copyDirectoryRecursive(srcPath, destPath)
        } else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
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
      external: ['jsonic-db'],
      output: {
        manualChunks: (id) => {
          // Code splitting for JSONIC features
          if (id.includes('src/jsonic/features/debug-tools')) {
            return 'jsonic-debug';
          }
          if (id.includes('src/jsonic/features/performance-monitor')) {
            return 'jsonic-performance';
          }
          if (id.includes('src/jsonic/core')) {
            return 'jsonic-core';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name.includes('jsonic')) {
            return 'assets/jsonic/[name].[hash].js';
          }
          return 'assets/[name].[hash].js';
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  worker: {
    format: 'es',
    rollupOptions: {
      external: ['jsonic-db']
    }
  },
  optimizeDeps: {
    exclude: ['sql.js-httpvfs', 'jsonic.esm.js']
  }
})
