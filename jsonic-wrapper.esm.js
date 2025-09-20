/**
 * JSONIC ES Module Wrapper
 * This wraps the jsonic_wasm.js to provide a clean ES module interface
 */

import init from './jsonic/jsonic_wasm.js';

// Configuration
let CONFIG = {
    wasmUrl: './jsonic/jsonic_wasm_bg.wasm',
    debug: false
};

let initialized = false;
let initPromise = null;

// Initialize WASM module
async function initializeWasm() {
    if (initialized) return;
    
    if (!initPromise) {
        initPromise = init(CONFIG.wasmUrl).then(() => {
            initialized = true;
            if (CONFIG.debug) {
                console.log('[JSONIC] WASM module initialized');
            }
        }).catch(error => {
            console.error('[JSONIC] Failed to initialize WASM:', error);
            throw error;
        });
    }
    
    return initPromise;
}

// Simple database class
class JsonicDatabase {
    constructor() {
        this.store = new Map();
        this.metadata = new Map();
        this.idCounter = 0;
    }
    
    async insert(data) {
        const id = `doc_${++this.idCounter}`;
        const now = Date.now();
        
        this.store.set(id, data);
        this.metadata.set(id, {
            version: 1,
            created_at: now,
            updated_at: now
        });
        
        if (CONFIG.debug) {
            console.log(`[JSONIC] Inserted document ${id}`);
        }
        
        return id;
    }
    
    async get(id) {
        const content = this.store.get(id);
        const metadata = this.metadata.get(id);
        
        if (!content) return null;
        
        return {
            id,
            content,
            metadata
        };
    }
    
    async update(id, data) {
        if (!this.store.has(id)) {
            return false;
        }
        
        this.store.set(id, data);
        const meta = this.metadata.get(id);
        meta.version++;
        meta.updated_at = Date.now();
        
        if (CONFIG.debug) {
            console.log(`[JSONIC] Updated document ${id}`);
        }
        
        return true;
    }
    
    async delete(id) {
        const existed = this.store.has(id);
        this.store.delete(id);
        this.metadata.delete(id);
        
        if (CONFIG.debug && existed) {
            console.log(`[JSONIC] Deleted document ${id}`);
        }
        
        return existed;
    }
    
    async list() {
        return Array.from(this.store.keys());
    }
    
    async stats() {
        return {
            document_count: this.store.size,
            total_size: JSON.stringify(Array.from(this.store.entries())).length,
            wasm_initialized: initialized
        };
    }
}

// Main JSONIC interface
const JSONIC = {
    version: '0.2.0',
    
    configure(options) {
        CONFIG = { ...CONFIG, ...options };
        if (CONFIG.debug) {
            console.log('[JSONIC] Configuration updated:', CONFIG);
        }
    },
    
    async createDatabase() {
        // Initialize WASM if configured
        if (CONFIG.wasmUrl) {
            try {
                await initializeWasm();
            } catch (error) {
                console.warn('[JSONIC] WASM initialization failed, using fallback implementation:', error);
            }
        }
        
        return new JsonicDatabase();
    }
};

// Export as default
export default JSONIC;

// Also set on window for compatibility
if (typeof window !== 'undefined') {
    window.JSONIC = JSONIC;
    window.JSONIC_READY = Promise.resolve(JSONIC);
    
    // Dispatch ready event
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jsonic-ready', { detail: JSONIC }));
    }, 0);
}