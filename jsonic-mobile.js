/**
 * JSONIC Mobile-Optimized Wrapper
 * Uses MobileJSONIC for automatic Web Worker delegation on mobile devices
 */

// Import the mobile-optimized client
import { MobileJSONIC } from './mobile-client.js';

// Configuration
const CONFIG = {
  enableWorker: true,
  workerPath: '/agentx-benchmark-ui/mobile-worker.js',
  maxMemoryMB: 50,
  enablePersistence: true,
  persistenceAdapter: 'opfs', // Use OPFS for better performance
  wasmUrl: '/agentx-benchmark-ui/jsonic_wasm_bg.wasm'
};

let dbInstance = null;

/**
 * Create a mobile-optimized JSONIC database
 */
export async function createMobileDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  console.log('🚀 Initializing Mobile-Optimized JSONIC...');
  
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0);

  if (isMobile || true) { // Force mobile mode for testing
    console.log('📱 Using MobileJSONIC with Web Worker delegation');
    dbInstance = new MobileJSONIC(CONFIG);
    await dbInstance.ready();
  } else {
    console.log('🖥️ Using standard JSONIC');
    // Fall back to standard JSONIC for desktop
    const { default: JSONIC } = await import('./jsonic-wrapper.esm.js');
    JSONIC.configure({
      wasmUrl: CONFIG.wasmUrl,
      debug: false,
      enablePersistence: true,
      persistenceKey: 'agentx_benchmark_db'
    });
    dbInstance = await JSONIC.createDatabase({
      enablePersistence: true,
      persistenceKey: 'agentx_benchmark_db'
    });
  }

  console.log('✅ Mobile-Optimized JSONIC ready');
  return dbInstance;
}

// Export the main interface
export default {
  createDatabase: createMobileDatabase,
  version: '2.0.0-mobile'
};