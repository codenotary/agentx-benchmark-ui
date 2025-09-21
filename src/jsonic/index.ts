/**
 * JSONIC Integration with Progressive Loading
 * Main entry point for JSONIC with hybrid loading capabilities
 */

import { HybridJSONIC, createJSONIC, initJSONIC, featureDetector } from './hybrid-loader';

// Register service worker for offline support
async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('[JSONIC] Service Worker registered');
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[JSONIC] Service Worker updated');
            }
          });
        }
      });
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour
      
    } catch (error) {
      console.warn('[JSONIC] Service Worker registration failed:', error);
    }
  }
}

// Initialize JSONIC on load
let jsonicInstance: any = null;

export async function getJSONIC() {
  if (!jsonicInstance) {
    // Register service worker first
    await registerServiceWorker();
    
    // Initialize JSONIC with hybrid loading
    jsonicInstance = await initJSONIC({
      mode: 'hybrid',
      features: {
        debug: process.env.NODE_ENV !== 'production',
        performance: true
      },
      preload: process.env.NODE_ENV === 'production' ? [] : ['debug', 'performance']
    });
  }
  
  return jsonicInstance;
}

// Export main API
export { 
  HybridJSONIC,
  createJSONIC,
  initJSONIC,
  featureDetector
};

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  (window as any).JSONICHybrid = {
    getJSONIC,
    createJSONIC,
    initJSONIC,
    featureDetector,
    
    // Debug tools
    loadDebugTools: async () => {
      const hybrid = await HybridJSONIC.create();
      return hybrid.loadFeature('debug');
    },
    
    // Performance monitoring
    loadPerformanceMonitor: async () => {
      const hybrid = await HybridJSONIC.create();
      return hybrid.loadFeature('performance');
    },
    
    // Get statistics
    getStats: async () => {
      const hybrid = await HybridJSONIC.create();
      return hybrid.getStats();
    }
  };
  
  // Auto-initialize on page load for quick start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[JSONIC] Auto-initializing hybrid loader...');
      getJSONIC().then(() => {
        console.log('[JSONIC] Ready with progressive loading');
      });
    });
  } else {
    // Already loaded
    getJSONIC().then(() => {
      console.log('[JSONIC] Ready with progressive loading');
    });
  }
}