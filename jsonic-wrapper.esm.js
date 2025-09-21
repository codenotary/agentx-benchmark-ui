/**
 * JSONIC ES Module Wrapper with MongoDB-like queries and OPFS persistence
 * Version: 1.0.6 - Fixed WASM document structure extraction from {id, content, metadata}
 */

import init, { JsonDB } from './jsonic_wasm.js';

// Configuration with GitHub Pages support
const getBaseUrl = () => {
    // Check if we're in a Web Worker context
    if (typeof window === 'undefined' && typeof self !== 'undefined') {
        // In a Web Worker, use the location from self
        const url = self.location ? self.location.pathname : '/';
        if (url.includes('/agentx-benchmark-ui/')) {
            return '/agentx-benchmark-ui/';
        }
        return '/';
    }
    
    // In main thread, use window.location
    if (typeof window !== 'undefined' && window.location) {
        const { pathname } = window.location;
        if (pathname.startsWith('/agentx-benchmark-ui/')) {
            return '/agentx-benchmark-ui/';
        }
    }
    
    return '/';
};

let CONFIG = {
    wasmUrl: getBaseUrl() + 'jsonic_wasm_bg.wasm',
    debug: false,
    enablePersistence: false,
    persistenceKey: 'jsonic_db'
};

let initialized = false;
let initPromise = null;
let globalDb = null;

// Initialize WASM module
async function initializeWasm() {
    if (initialized) return;
    
    if (!initPromise) {
        initPromise = init(CONFIG.wasmUrl).then(() => {
            initialized = true;
            if (CONFIG.debug) {
                console.log('[JSONIC] WASM module initialized with MongoDB-like queries');
            }
        }).catch(error => {
            console.error('[JSONIC] Failed to initialize WASM:', error);
            throw error;
        });
    }
    
    return initPromise;
}

// Enhanced database class with MongoDB-like queries and OPFS persistence
class JsonicDatabase {
    constructor(db, options = {}) {
        this.db = db;
        this.enablePersistence = options.enablePersistence || false;
        this.persistenceKey = options.persistenceKey || 'jsonic_db';
        this.opfsRoot = null;
        this.initPersistence();
    }

    async initPersistence() {
        if (!this.enablePersistence) return;
        
        try {
            // Check if OPFS is available
            if ('storage' in navigator && 'getDirectory' in navigator.storage) {
                this.opfsRoot = await navigator.storage.getDirectory();
                console.log('[JSONIC] OPFS persistence enabled');
                await this.loadFromOPFS();
            } else {
                console.warn('[JSONIC] OPFS not available, persistence disabled');
            }
        } catch (error) {
            console.error('[JSONIC] Failed to initialize persistence:', error);
        }
    }

    async loadFromOPFS() {
        try {
            const fileHandle = await this.opfsRoot.getFileHandle(`${this.persistenceKey}.json`, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Restore data to the database
            for (const doc of data.documents || []) {
                await this.db.insert(JSON.stringify(doc));
            }
            
            console.log(`[JSONIC] Loaded ${data.documents?.length || 0} documents from OPFS`);
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                console.error('[JSONIC] Failed to load from OPFS:', error);
            }
        }
    }

    async saveToOPFS() {
        if (!this.opfsRoot) return;
        
        try {
            const idsResult = await this.db.list_ids();
            const ids = typeof idsResult === 'string' ? JSON.parse(idsResult) : idsResult;
            const documents = [];
            
            for (const id of ids.data || []) {
                const docResult = await this.db.get(id);
                const doc = typeof docResult === 'string' ? JSON.parse(docResult) : docResult;
                if (doc.success) {
                    documents.push(doc.data);
                }
            }
            
            const fileHandle = await this.opfsRoot.getFileHandle(`${this.persistenceKey}.json`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify({ documents, timestamp: Date.now() }));
            await writable.close();
            
            console.log(`[JSONIC] Saved ${documents.length} documents to OPFS`);
        } catch (error) {
            console.error('[JSONIC] Failed to save to OPFS:', error);
        }
    }
    
    async insert(data) {
        const result = await this.db.insert(JSON.stringify(data));
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        // Debug: log what was inserted and the returned ID
        if (CONFIG.debug) {
            console.log('[JSONIC] Inserted document:', data);
            console.log('[JSONIC] Returned ID:', parsed.data);
        }
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data;
    }
    
    async insert_many(documents) {
        // Use JSONIC's native batch insert for maximum performance
        const result = await this.db.insert_many(documents);
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (CONFIG.debug) {
            console.log('[JSONIC] Batch inserted documents:', parsed.data?.length || 0);
        }
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return result; // Return raw result for compatibility
    }
    
    async get(id) {
        const result = await this.db.get(id);
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (CONFIG.debug && id.includes('benchmark')) {
            console.log('[JSONIC] Get document ID:', id);
            console.log('[JSONIC] Raw result:', result);
            console.log('[JSONIC] Parsed result:', parsed);
        }
        
        if (parsed.success) {
            // WASM returns {id, content, metadata} - extract the content
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
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data || true;
    }
    
    async delete(id) {
        const result = await this.db.delete(id);
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data || true;
    }
    
    async list() {
        const result = await this.db.list_ids();
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || [];
    }
    
    async stats() {
        const result = await this.db.stats();
        // Handle both object and string responses from WASM
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || { document_count: 0, wasm_initialized: true };
    }

    // MongoDB-like query interface
    async query(filter, options = {}) {
        // JSONIC WASM doesn't have query methods yet, use client-side filtering
        return this.clientSideQuery(filter, options);
    }

    // Client-side query fallback
    async clientSideQuery(filter, options = {}) {
        const ids = await this.list();
        let results = [];
        
        console.log(`[JSONIC] clientSideQuery - Found ${ids.length} document IDs`);
        console.log(`[JSONIC] clientSideQuery - Filter:`, filter);
        
        for (const id of ids) {
            const doc = await this.get(id);
            
            // Debug first document structure
            if (results.length === 0 && doc) {
                console.log(`[JSONIC] First document structure:`, doc);
            }
            
            if (doc) {
                if (this.matchesFilter(doc, filter)) {
                    results.push({ id, ...doc });
                }
            }
        }
        
        console.log(`[JSONIC] clientSideQuery - Matched ${results.length} documents`)
        
        // Apply sorting
        if (options.sort) {
            results.sort((a, b) => {
                for (const [key, order] of options.sort) {
                    const diff = (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);
                    if (diff !== 0) return diff * order;
                }
                return 0;
            });
        }
        
        // Apply skip and limit
        if (options.skip) {
            results = results.slice(options.skip);
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        
        return results;
    }

    matchesFilter(doc, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (key === '$or') {
                if (!value.some(subFilter => this.matchesFilter(doc, subFilter))) {
                    return false;
                }
            } else if (key === '$and') {
                if (!value.every(subFilter => this.matchesFilter(doc, subFilter))) {
                    return false;
                }
            } else if (typeof value === 'object' && value !== null) {
                // Handle operators
                for (const [op, opValue] of Object.entries(value)) {
                    switch (op) {
                        case '$gt': if (!(doc[key] > opValue)) return false; break;
                        case '$gte': if (!(doc[key] >= opValue)) return false; break;
                        case '$lt': if (!(doc[key] < opValue)) return false; break;
                        case '$lte': if (!(doc[key] <= opValue)) return false; break;
                        case '$ne': if (doc[key] === opValue) return false; break;
                        case '$in': if (!opValue.includes(doc[key])) return false; break;
                        case '$nin': if (opValue.includes(doc[key])) return false; break;
                    }
                }
            } else {
                // Simple equality
                if (doc[key] !== value) return false;
            }
        }
        return true;
    }

    // MongoDB-style find interface
    find(filter = {}) {
        const self = this;
        let queryFilter = filter;
        let queryOptions = {};
        
        const chainable = {
            sort(sortSpec) {
                queryOptions.sort = Object.entries(sortSpec).map(([key, val]) => [key, val]);
                return this;
            },
            
            limit(n) {
                queryOptions.limit = n;
                return this;
            },
            
            skip(n) {
                queryOptions.skip = n;
                return this;
            },
            
            project(projection) {
                queryOptions.projection = projection;
                return this;
            },
            
            async exec() {
                return self.query(queryFilter, queryOptions);
            },
            
            async toArray() {
                return self.query(queryFilter, queryOptions);
            }
        };
        
        return chainable;
    }

    // MongoDB-style findOne
    async findOne(filter = {}) {
        const results = await this.query(filter, { limit: 1 });
        return results[0] || null;
    }
}

// Main JSONIC interface
const JSONIC = {
    version: '1.0.0',
    
    configure(options) {
        CONFIG = { ...CONFIG, ...options };
        if (CONFIG.debug) {
            console.log('[JSONIC] Configuration updated:', CONFIG);
        }
    },
    
    async createDatabase(options = {}) {
        // Initialize WASM
        await initializeWasm();
        
        const db = new JsonDB();
        const mergedOptions = { ...CONFIG, ...options };
        return new JsonicDatabase(db, mergedOptions);
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