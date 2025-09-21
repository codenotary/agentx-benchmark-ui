/**
 * JSONIC Worker Wrapper - Safe for Web Worker context
 * This version doesn't use window object
 */

import init, { JsonDB } from './jsonic_wasm.js';

// Worker-safe configuration
const getBaseUrl = () => {
    // Always use the GitHub Pages path in workers
    return '/agentx-benchmark-ui/';
};

let CONFIG = {
    wasmUrl: getBaseUrl() + 'jsonic_wasm_bg.wasm',
    debug: false,
    enablePersistence: false,
    persistenceKey: 'jsonic_db'
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
                console.log('[JSONIC] WASM module initialized in Worker');
            }
        }).catch(error => {
            console.error('[JSONIC Worker] Failed to initialize WASM:', error);
            throw error;
        });
    }
    return initPromise;
}

// Simple database class for workers (no OPFS for now to simplify)
class WorkerJsonicDatabase {
    constructor(db) {
        this.db = db;
    }

    async insert(data) {
        const result = await this.db.insert(JSON.stringify(data));
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data;
    }

    async get(id) {
        const result = await this.db.get(id);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (parsed.success) {
            const data = parsed.data;
            if (data && data.content) {
                return data.content;
            }
            return data;
        }
        return null;
    }

    async update(id, data) {
        const result = await this.db.update(id, JSON.stringify(data));
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || true;
    }

    async delete(id) {
        const result = await this.db.delete(id);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || true;
    }

    async list() {
        const result = await this.db.list_ids();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || [];
    }

    async stats() {
        const result = await this.db.stats();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || { document_count: 0, wasm_initialized: true };
    }
}

// Main JSONIC interface for workers
const JSONIC = {
    version: '1.0.0-worker',
    
    configure(options) {
        CONFIG = { ...CONFIG, ...options };
        if (CONFIG.debug) {
            console.log('[JSONIC Worker] Configuration updated:', CONFIG);
        }
    },

    async createDatabase() {
        // Initialize WASM
        await initializeWasm();
        const db = new JsonDB();
        return new WorkerJsonicDatabase(db);
    }
};

export default JSONIC;