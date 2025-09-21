/**
 * JSONIC Hybrid-Progressive ES Module Wrapper
 * Version: 4.0.0
 * Design: Starts with a lightweight core and progressively loads advanced features on demand.
 */

import { JsonicHybrid } from './core.js';
import init from '../jsonic_wasm.js';

let initialized = false;
let initPromise = null;

// Global configuration for the hybrid wrapper
const CONFIG = {
    wasmUrl: null, // This will be set by the consumer
    debug: false,
    enablePersistence: false,
    persistenceKey: 'jsonic_db',
    preloadFeatures: [], // Features to preload after init
};

// Initialize the underlying WASM module
async function initializeWasm() {
    if (initialized) return;
    
    if (!initPromise) {
        if (!CONFIG.wasmUrl) {
            throw new Error("[JSONIC Hybrid] WASM URL not configured. Please call JSONIC.configure() first.");
        }
        initPromise = init(CONFIG.wasmUrl).then(() => {
            initialized = true;
            if (CONFIG.debug) {
                console.log('[JSONIC Hybrid] WASM module initialized.');
            }
        }).catch(error => {
            console.error('[JSONIC Hybrid] Failed to initialize WASM:', error);
            initPromise = null; // Allow retries
            throw error;
        });
    }
    
    return initPromise;
}

// Main JSONIC v4 interface
const JSONIC = {
    version: '4.0.0',
    
    configure(options) {
        Object.assign(CONFIG, options);
        if (CONFIG.debug) {
            console.log('[JSONIC Hybrid] Configuration updated:', CONFIG);
        }
    },
    
    async createDatabase(options = {}) {
        await initializeWasm();
        
        // The actual JsonDB instance is created inside the core
        const mergedOptions = { ...CONFIG, ...options };
        return new JsonicHybrid(mergedOptions);
    }
};

// Export as default to match the existing pattern
export default JSONIC;

// Set on window for broader compatibility and debugging
if (typeof window !== 'undefined') {
    window.JSONIC_HYBRID = JSONIC;
    window.JSONIC_HYBRID_READY = Promise.resolve(JSONIC);
    
    // Dispatch ready event
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jsonic-hybrid-ready', { detail: JSONIC }));
    }, 0);
}