/**
 * JSONIC ES Module Wrapper with MongoDB-like queries and OPFS persistence
 */

import init, { JsonDB } from './jsonic_wasm.js';

// Configuration with GitHub Pages support
const getBaseUrl = () => {
    // Detect if running on GitHub Pages
    const { pathname } = window.location;
    if (pathname.startsWith('/agentx-benchmark-ui/')) {
        return '/agentx-benchmark-ui/';
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
            const ids = JSON.parse(await this.db.list_ids());
            const documents = [];
            
            for (const id of ids.data || []) {
                const doc = JSON.parse(await this.db.get(id));
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
        const parsed = JSON.parse(result);
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data;
    }
    
    async get(id) {
        const result = await this.db.get(id);
        const parsed = JSON.parse(result);
        
        if (parsed.success) {
            return { id, content: parsed.data, metadata: { version: 1 } };
        }
        return null;
    }
    
    async update(id, data) {
        const result = await this.db.update(id, JSON.stringify(data));
        const parsed = JSON.parse(result);
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data || true;
    }
    
    async delete(id) {
        const result = await this.db.delete(id);
        const parsed = JSON.parse(result);
        
        if (parsed.success && this.enablePersistence) {
            await this.saveToOPFS();
        }
        
        return parsed.data || true;
    }
    
    async list() {
        const result = await this.db.list_ids();
        const parsed = JSON.parse(result);
        return parsed.data || [];
    }
    
    async stats() {
        const result = await this.db.stats();
        const parsed = JSON.parse(result);
        return parsed.data || { document_count: 0, wasm_initialized: true };
    }

    // MongoDB-like query interface
    async query(filter, options = {}) {
        try {
            let result;
            
            if (Object.keys(options).length > 0) {
                // Use query_with_options for advanced queries
                const optionsJson = JSON.stringify({
                    projection: options.projection,
                    sort: options.sort,
                    limit: options.limit,
                    skip: options.skip
                });
                result = await this.db.query_with_options(JSON.stringify(filter), optionsJson);
            } else {
                // Simple query without options
                result = await this.db.query(JSON.stringify(filter));
            }
            
            const parsed = JSON.parse(result);
            if (parsed.success) {
                return parsed.data || [];
            }
            throw new Error(parsed.error || 'Query failed');
        } catch (error) {
            console.error('[JSONIC] Query error:', error);
            // Fallback to client-side filtering
            return this.clientSideQuery(filter, options);
        }
    }

    // Client-side query fallback
    async clientSideQuery(filter, options = {}) {
        const ids = await this.list();
        let results = [];
        
        for (const id of ids) {
            const doc = await this.get(id);
            if (doc && doc.content) {
                if (this.matchesFilter(doc.content, filter)) {
                    results.push({ id, ...doc.content });
                }
            }
        }
        
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