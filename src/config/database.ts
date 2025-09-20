// Database configuration
export const DB_CONFIG = {
  // Set to 'jsonic' to use the JSONIC database, 'json' to use static JSON files
  // Using 'json' mode until JSONIC standalone is properly deployed
  mode: 'json' as 'jsonic' | 'json',
  
  // JSONIC configuration
  jsonic: {
    // Path to JSONIC WASM module
    wasmPath: '/home/dennis/github/jsonic/pkg/jsonic_wasm.js',
    // Database name
    dbName: 'agentx_benchmark',
    // Enable auto-migration from JSON on first load
    autoMigrate: true,
    // Enable persistence to IndexedDB
    persist: true
  },
  
  // JSON configuration
  json: {
    // Path to JSON data files
    dataPath: '/data/database.json',
    // Use minified version for production
    useMinified: true
  }
};

// Feature flags
export const FEATURES = {
  // Enable JSONIC database
  useJsonic: DB_CONFIG.mode === 'jsonic',
  // Enable real-time updates (requires JSONIC)
  enableRealtime: false,
  // Enable data caching
  enableCache: true,
  // Cache TTL in milliseconds
  cacheTTL: 5 * 60 * 1000 // 5 minutes
};