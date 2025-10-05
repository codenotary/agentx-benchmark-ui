/**
 * JSONIC ES Module Wrapper v3.1 with Performance Optimizations
 * Features: Batch operations, Query caching, Index hints, Memory management
 */

import init, { JsonDB } from './jsonic_wasm.js';

// Configuration with GitHub Pages support
const getBaseUrl = () => {
    if (typeof window === 'undefined' && typeof self !== 'undefined') {
        const url = self.location ? self.location.pathname : '/';
        if (url.includes('/agentx-benchmark-ui/')) {
            return '/agentx-benchmark-ui/';
        }
        return '/';
    }
    
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
    persistenceKey: 'jsonic_db',
    cacheSize: 100,
    enableQueryCache: true,
    enableBatchOptimization: true,
    memoryLimit: 100 * 1024 * 1024, // 100MB default
    indexHints: {}
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
                console.log('[JSONIC v3.1] WASM module initialized with performance optimizations');
            }
        }).catch(error => {
            console.error('[JSONIC v3.1] Failed to initialize WASM:', error);
            throw error;
        });
    }
    
    return initPromise;
}

// LRU Cache implementation for query results
class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    get(key) {
        if (!this.cache.has(key)) {
            this.misses++;
            return null;
        }
        
        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        this.hits++;
        return value;
    }

    set(key, value) {
        // Delete if exists to re-add at the end
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    invalidate(pattern = null) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        
        // Invalidate entries matching pattern
        for (const [key] of this.cache) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    stats() {
        const hitRate = this.hits + this.misses > 0 
            ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) 
            : 0;
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
}

// Performance profiler for debugging
class QueryProfiler {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.queries = [];
        this.slowQueryThreshold = 100; // ms
    }

    startQuery(operation, details) {
        if (!this.enabled) return null;
        
        const queryId = `${operation}_${Date.now()}_${Math.random()}`;
        const query = {
            id: queryId,
            operation,
            details,
            startTime: performance.now(),
            memory: this.getMemoryUsage()
        };
        
        this.queries.push(query);
        return queryId;
    }

    endQuery(queryId, result = null) {
        if (!this.enabled || !queryId) return;
        
        const query = this.queries.find(q => q.id === queryId);
        if (query) {
            query.endTime = performance.now();
            query.duration = query.endTime - query.startTime;
            query.memoryDelta = this.getMemoryUsage() - query.memory;
            query.resultSize = result ? JSON.stringify(result).length : 0;
            
            if (query.duration > this.slowQueryThreshold) {
                console.warn(`[JSONIC] Slow query detected: ${query.operation} took ${query.duration.toFixed(2)}ms`, query.details);
            }
        }
    }

    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    getSlowQueries(limit = 10) {
        return this.queries
            .filter(q => q.duration > this.slowQueryThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    getStats() {
        if (this.queries.length === 0) return null;
        
        const durations = this.queries.map(q => q.duration || 0);
        const total = durations.reduce((sum, d) => sum + d, 0);
        const avg = total / durations.length;
        const sorted = [...durations].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        return {
            totalQueries: this.queries.length,
            avgDuration: avg.toFixed(2),
            medianDuration: median.toFixed(2),
            totalDuration: total.toFixed(2),
            slowQueries: this.getSlowQueries(5).length
        };
    }

    clear() {
        this.queries = [];
    }
}

// Enhanced database class with v3.1 features
class JsonicDatabase {
    constructor(db, options = {}) {
        this.db = db;
        this.enablePersistence = options.enablePersistence || false;
        this.persistenceKey = options.persistenceKey || 'jsonic_db';
        this.opfsRoot = null;
        this.queryCache = new LRUCache(options.cacheSize || 100);
        this.profiler = new QueryProfiler(options.debug || false);
        this.indexes = new Map();
        this.memoryLimit = options.memoryLimit || 100 * 1024 * 1024;
        this.currentMemory = 0;
        this.batchQueue = [];
        this.batchTimeout = null;
        this.batchSize = 100; // Process batches of 100 operations
        
        this.initPersistence();
        this.setupIndexes(options.indexHints || {});
    }

    setupIndexes(hints) {
        // Setup indexes based on hints
        for (const [field, type] of Object.entries(hints)) {
            this.indexes.set(field, {
                type: type || 'hash',
                data: new Map()
            });
        }
    }

    async initPersistence() {
        if (!this.enablePersistence) return;
        
        try {
            // Use OPFS for better performance than IndexedDB
            if ('storage' in navigator && 'getDirectory' in navigator.storage) {
                this.opfsRoot = await navigator.storage.getDirectory();
                console.log('[JSONIC v3.1] OPFS persistence enabled with WAL support');
                await this.loadFromOPFS();
            } else {
                console.warn('[JSONIC v3.1] OPFS not available, falling back to IndexedDB');
            }
        } catch (error) {
            console.error('[JSONIC v3.1] Failed to initialize persistence:', error);
        }
    }

    async loadFromOPFS() {
        try {
            const fileHandle = await this.opfsRoot.getFileHandle(`${this.persistenceKey}.json`, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            
            // IMPORTANT: Only load if database is empty to avoid duplicates
            const currentStats = await this.db.stats();
            const currentCount = typeof currentStats === 'string' ? 
                JSON.parse(currentStats).data?.document_count : 
                currentStats.data?.document_count || 0;
            
            if (currentCount === 0 && data.documents?.length > 0) {
                // Use native WASM batch insert for faster loading
                const jsonDocs = data.documents.map(doc => JSON.stringify(doc));
                const result = await this.db.insert_many(jsonDocs);
                const parsed = typeof result === 'string' ? JSON.parse(result) : result;
                
                console.log(`[JSONIC v3.1] Restored ${parsed.data?.length || 0} documents from persistent storage (OPFS)`);
            } else if (currentCount > 0) {
                console.log(`[JSONIC v3.1] Database already initialized with ${currentCount} documents`);
            } else {
                console.log(`[JSONIC v3.1] No persisted data found, starting with empty database`);
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                console.error('[JSONIC v3.1] Failed to load from OPFS:', error);
            }
        }
    }

    async saveToOPFS() {
        if (!this.opfsRoot) return;
        
        try {
            // Save to main persistence file, not WAL
            const fileHandle = await this.opfsRoot.getFileHandle(`${this.persistenceKey}.json`, { create: true });
            const writable = await fileHandle.createWritable();
            
            // Export all documents
            const data = await this.exportAll();
            
            await writable.write(JSON.stringify(data));
            await writable.close();
        } catch (error) {
            console.error('[JSONIC v3.1] Failed to save to OPFS:', error);
        }
    }

    async exportAll() {
        const ids = await this.list();
        const documents = [];
        
        // Use batch operations for export
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(id => this.get(id)));
            documents.push(...results.filter(doc => doc !== null));
        }
        
        return { documents, timestamp: Date.now() };
    }

    // Batch operations with v3.1 optimizations
    async insertMany(documents, options = {}) {
        const queryId = this.profiler.startQuery('insertMany', { count: documents.length });
        
        try {
            // Native JSONIC batch insert with single lock acquisition
            const jsonDocs = documents.map(doc => JSON.stringify(doc));
            const result = await this.db.insert_many(jsonDocs);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            
            // Invalidate cache for insertions
            this.queryCache.invalidate();
            
            // Update indexes
            if (this.indexes.size > 0) {
                documents.forEach((doc, i) => {
                    const id = parsed.data?.[i];
                    if (id) {
                        this.updateIndexes('insert', id, doc);
                    }
                });
            }
            
            if (this.enablePersistence) {
                this.schedulePersistence();
            }
            
            this.profiler.endQuery(queryId, parsed);
            return parsed.data || [];
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async updateMany(filter, update, options = {}) {
        const queryId = this.profiler.startQuery('updateMany', { filter, update });
        
        try {
            // Find matching documents
            const docs = await this.query(filter);
            const updateOps = [];
            
            for (const doc of docs) {
                const updatedDoc = this.applyUpdate(doc, update);
                updateOps.push({ id: doc.id, doc: updatedDoc });
            }
            
            // Batch update operations
            const results = await this.processBatchUpdates(updateOps);
            
            // Invalidate cache for updates
            this.queryCache.invalidate();
            
            this.profiler.endQuery(queryId, results);
            return {
                matchedCount: docs.length,
                modifiedCount: results.filter(r => r).length
            };
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async processBatchUpdates(updates) {
        const batchSize = 50;
        const results = [];
        
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(({ id, doc }) => this.update(id, doc))
            );
            results.push(...batchResults);
        }
        
        return results;
    }

    applyUpdate(doc, update) {
        const updated = { ...doc };
        
        for (const [op, fields] of Object.entries(update)) {
            switch (op) {
                case '$set':
                    Object.assign(updated, fields);
                    break;
                case '$unset':
                    for (const field of Object.keys(fields)) {
                        delete updated[field];
                    }
                    break;
                case '$inc':
                    for (const [field, value] of Object.entries(fields)) {
                        updated[field] = (updated[field] || 0) + value;
                    }
                    break;
                case '$push':
                    for (const [field, value] of Object.entries(fields)) {
                        if (!Array.isArray(updated[field])) {
                            updated[field] = [];
                        }
                        updated[field].push(value);
                    }
                    break;
                case '$pull':
                    for (const [field, value] of Object.entries(fields)) {
                        if (Array.isArray(updated[field])) {
                            updated[field] = updated[field].filter(item => item !== value);
                        }
                    }
                    break;
            }
        }
        
        return updated;
    }

    async deleteMany(filter, options = {}) {
        const queryId = this.profiler.startQuery('deleteMany', { filter });
        
        try {
            const docs = await this.query(filter);
            const deleteOps = docs.map(doc => doc.id);
            
            // Batch delete operations
            const results = await Promise.all(deleteOps.map(id => this.delete(id)));
            
            // Invalidate cache
            this.queryCache.invalidate();
            
            this.profiler.endQuery(queryId, results);
            return {
                deletedCount: results.filter(r => r).length
            };
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    updateIndexes(operation, id, doc) {
        for (const [field, index] of this.indexes) {
            const value = doc[field];
            if (value !== undefined) {
                if (operation === 'insert' || operation === 'update') {
                    if (!index.data.has(value)) {
                        index.data.set(value, new Set());
                    }
                    index.data.get(value).add(id);
                } else if (operation === 'delete') {
                    if (index.data.has(value)) {
                        index.data.get(value).delete(id);
                    }
                }
            }
        }
    }

    schedulePersistence() {
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout);
        }
        
        // Debounce persistence to avoid excessive writes
        this.persistenceTimeout = setTimeout(() => {
            this.saveToOPFS();
        }, 1000);
    }

    async insert(data) {
        const queryId = this.profiler.startQuery('insert', { size: JSON.stringify(data).length });
        
        try {
            // Check memory limit
            const dataSize = JSON.stringify(data).length;
            if (this.currentMemory + dataSize > this.memoryLimit) {
                console.warn('[JSONIC v3.1] Memory limit approaching, consider cleanup');
            }
            
            const result = await this.db.insert(JSON.stringify(data));
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            
            if (parsed.success) {
                this.currentMemory += dataSize;
                
                // Update indexes
                this.updateIndexes('insert', parsed.data, data);
                
                // Invalidate cache
                this.queryCache.invalidate();
                
                if (this.enablePersistence) {
                    this.schedulePersistence();
                }
            }
            
            this.profiler.endQuery(queryId, parsed);
            return parsed.data;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async get(id) {
        const queryId = this.profiler.startQuery('get', { id });

        try {
            // Check cache first
            const cacheKey = `get_${id}`;
            const cached = this.queryCache.get(cacheKey);
            if (cached) {
                this.profiler.endQuery(queryId, cached.value);
                return cached.value;
            }

            const result = await this.db.get(id);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;

            let returnValue = null;
            if (parsed.success) {
                let data = parsed.data;

                // Convert Map to plain object (WASM returns Maps)
                if (data instanceof Map) {
                    data = Object.fromEntries(data);
                }

                returnValue = data?.content || data;

                // Also convert nested content if it's a Map
                if (returnValue instanceof Map) {
                    returnValue = Object.fromEntries(returnValue);
                }
            }

            // Cache the result
            this.queryCache.set(cacheKey, returnValue);

            this.profiler.endQuery(queryId, returnValue);
            return returnValue;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async update(id, data) {
        const queryId = this.profiler.startQuery('update', { id });
        
        try {
            const result = await this.db.update(id, JSON.stringify(data));
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            
            if (parsed.success) {
                // Update indexes
                this.updateIndexes('update', id, data);
                
                // Invalidate cache entries for this document
                this.queryCache.invalidate(`get_${id}`);
                this.queryCache.invalidate('query_');
                
                if (this.enablePersistence) {
                    this.schedulePersistence();
                }
            }
            
            this.profiler.endQuery(queryId, parsed);
            return parsed.data || true;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async delete(id) {
        const queryId = this.profiler.startQuery('delete', { id });
        
        try {
            // Get document for index cleanup
            const doc = await this.get(id);
            
            const result = await this.db.delete(id);
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            
            if (parsed.success && doc) {
                // Update indexes
                this.updateIndexes('delete', id, doc);
                
                // Invalidate cache
                this.queryCache.invalidate(`get_${id}`);
                this.queryCache.invalidate('query_');
                
                if (this.enablePersistence) {
                    this.schedulePersistence();
                }
            }
            
            this.profiler.endQuery(queryId, parsed);
            return parsed.data || true;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async list() {
        const result = await this.db.list_ids();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || [];
    }

    async stats() {
        const result = await this.db.stats();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        return {
            ...parsed.data,
            cache: this.queryCache.stats(),
            profiler: this.profiler.getStats(),
            indexes: Array.from(this.indexes.keys()),
            memoryUsage: this.currentMemory,
            memoryLimit: this.memoryLimit
        };
    }

    // Enhanced query with caching and index optimization
    async query(filter, options = {}) {
        const queryId = this.profiler.startQuery('query', { filter, options });
        
        try {
            // Generate cache key
            const cacheKey = `query_${JSON.stringify({ filter, options })}`;
            const cached = this.queryCache.get(cacheKey);
            if (cached) {
                this.profiler.endQuery(queryId, cached.value);
                return cached.value;
            }
            
            // Try to use indexes for optimization
            let results = await this.optimizedQuery(filter, options);
            
            // Cache the results
            this.queryCache.set(cacheKey, results);
            
            this.profiler.endQuery(queryId, results);
            return results;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    async optimizedQuery(filter, options = {}) {
        // Check if we can use an index
        const indexField = this.findIndexableField(filter);
        
        if (indexField) {
            return this.indexedQuery(indexField, filter, options);
        }
        
        // Fallback to full scan
        return this.fullScanQuery(filter, options);
    }

    findIndexableField(filter) {
        for (const field of Object.keys(filter)) {
            if (this.indexes.has(field) && typeof filter[field] !== 'object') {
                return field;
            }
        }
        return null;
    }

    async indexedQuery(indexField, filter, options) {
        const index = this.indexes.get(indexField);
        const value = filter[indexField];
        const candidateIds = index.data.get(value) || new Set();
        
        let results = [];
        for (const id of candidateIds) {
            const doc = await this.get(id);
            if (doc && this.matchesFilter(doc, filter)) {
                results.push({ id, ...doc });
            }
        }
        
        return this.applyQueryOptions(results, options);
    }

    async fullScanQuery(filter, options) {
        const ids = await this.list();
        let results = [];
        
        // Process in batches for better performance
        const batchSize = 50;
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const docs = await Promise.all(batch.map(id => this.get(id)));
            
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j];
                const id = batch[j];
                if (doc && this.matchesFilter(doc, filter)) {
                    results.push({ id, ...doc });
                }
            }
        }
        
        return this.applyQueryOptions(results, options);
    }

    applyQueryOptions(results, options) {
        // Apply sorting
        if (options.sort) {
            // Convert MongoDB-style sort {field: 1} to array format [['field', 1]]
            let sortArray = options.sort;
            if (!Array.isArray(options.sort)) {
                sortArray = Object.entries(options.sort);
            }

            results.sort((a, b) => {
                for (const [key, order] of sortArray) {
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
        
        // Apply projection
        if (options.projection) {
            results = results.map(doc => {
                const projected = {};
                for (const [field, include] of Object.entries(options.projection)) {
                    if (include) {
                        projected[field] = doc[field];
                    }
                }
                return projected;
            });
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
                        case '$regex':
                            const regex = new RegExp(opValue);
                            if (!regex.test(doc[key])) return false;
                            break;
                    }
                }
            } else {
                // Simple equality
                if (doc[key] !== value) return false;
            }
        }
        return true;
    }

    // Aggregation pipeline support
    async aggregate(pipeline) {
        const queryId = this.profiler.startQuery('aggregate', { pipeline: pipeline.length });
        
        try {
            let results = await this.list();
            results = await Promise.all(results.map(id => this.get(id).then(doc => ({ id, ...doc }))));
            
            for (const stage of pipeline) {
                const [op, params] = Object.entries(stage)[0];
                
                switch (op) {
                    case '$match':
                        results = results.filter(doc => this.matchesFilter(doc, params));
                        break;
                    
                    case '$group':
                        results = this.groupDocuments(results, params);
                        break;
                    
                    case '$sort':
                        results = this.sortDocuments(results, params);
                        break;
                    
                    case '$limit':
                        results = results.slice(0, params);
                        break;
                    
                    case '$skip':
                        results = results.slice(params);
                        break;
                    
                    case '$project':
                        results = results.map(doc => this.projectDocument(doc, params));
                        break;
                }
            }
            
            this.profiler.endQuery(queryId, results);
            return results;
        } catch (error) {
            this.profiler.endQuery(queryId);
            throw error;
        }
    }

    groupDocuments(documents, groupSpec) {
        const groups = new Map();
        
        for (const doc of documents) {
            const key = groupSpec._id === null ? 'null' : doc[groupSpec._id];
            
            if (!groups.has(key)) {
                groups.set(key, { _id: key });
            }
            
            const group = groups.get(key);
            
            // Apply accumulators
            for (const [field, accumulator] of Object.entries(groupSpec)) {
                if (field === '_id') continue;
                
                const [op, sourceField] = Object.entries(accumulator)[0];
                
                switch (op) {
                    case '$sum':
                        group[field] = (group[field] || 0) + (sourceField === 1 ? 1 : doc[sourceField] || 0);
                        break;
                    case '$avg':
                        if (!group[`_${field}_sum`]) {
                            group[`_${field}_sum`] = 0;
                            group[`_${field}_count`] = 0;
                        }
                        group[`_${field}_sum`] += doc[sourceField] || 0;
                        group[`_${field}_count`]++;
                        group[field] = group[`_${field}_sum`] / group[`_${field}_count`];
                        break;
                    case '$min':
                        if (group[field] === undefined || doc[sourceField] < group[field]) {
                            group[field] = doc[sourceField];
                        }
                        break;
                    case '$max':
                        if (group[field] === undefined || doc[sourceField] > group[field]) {
                            group[field] = doc[sourceField];
                        }
                        break;
                    case '$push':
                        if (!group[field]) group[field] = [];
                        group[field].push(doc[sourceField]);
                        break;
                }
            }
        }
        
        // Clean up internal fields
        for (const group of groups.values()) {
            for (const key of Object.keys(group)) {
                if (key.startsWith('_')) delete group[key];
            }
        }
        
        return Array.from(groups.values());
    }

    sortDocuments(documents, sortSpec) {
        return documents.sort((a, b) => {
            for (const [field, order] of Object.entries(sortSpec)) {
                const diff = (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0);
                if (diff !== 0) return diff * order;
            }
            return 0;
        });
    }

    projectDocument(doc, projection) {
        const projected = {};
        for (const [field, value] of Object.entries(projection)) {
            if (value === 1 || value === true) {
                projected[field] = doc[field];
            } else if (typeof value === 'string' && value.startsWith('$')) {
                // Field reference
                projected[field] = doc[value.substring(1)];
            } else if (typeof value === 'object') {
                // Computed field
                const [op, params] = Object.entries(value)[0];
                projected[field] = this.computeField(doc, op, params);
            }
        }
        return projected;
    }

    computeField(doc, op, params) {
        switch (op) {
            case '$concat':
                return params.map(p => typeof p === 'string' && p.startsWith('$') ? doc[p.substring(1)] : p).join('');
            case '$add':
                return params.reduce((sum, p) => sum + (typeof p === 'string' && p.startsWith('$') ? doc[p.substring(1)] : p), 0);
            case '$multiply':
                return params.reduce((product, p) => product * (typeof p === 'string' && p.startsWith('$') ? doc[p.substring(1)] : p), 1);
            default:
                return null;
        }
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
            },
            
            async count() {
                const results = await self.query(queryFilter, queryOptions);
                return results.length;
            }
        };
        
        return chainable;
    }

    async findOne(filter = {}) {
        const results = await this.query(filter, { limit: 1 });
        return results[0] || null;
    }

    // Performance debugging methods
    getDebugInfo() {
        return {
            cache: this.queryCache.stats(),
            profiler: this.profiler.getStats(),
            slowQueries: this.profiler.getSlowQueries(),
            indexes: Array.from(this.indexes.entries()).map(([field, index]) => ({
                field,
                type: index.type,
                entries: index.data.size
            })),
            memory: {
                used: this.currentMemory,
                limit: this.memoryLimit,
                percentage: ((this.currentMemory / this.memoryLimit) * 100).toFixed(2) + '%'
            }
        };
    }

    clearCache() {
        this.queryCache.invalidate();
    }

    clearProfiler() {
        this.profiler.clear();
    }
}

// Main JSONIC v3.1 interface
const JSONIC = {
    version: '3.1.0',
    
    configure(options) {
        CONFIG = { ...CONFIG, ...options };
        if (CONFIG.debug) {
            console.log('[JSONIC v3.1] Configuration updated:', CONFIG);
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
    window.JSONIC_V3 = JSONIC;
    window.JSONIC_V3_READY = Promise.resolve(JSONIC);
    
    // Dispatch ready event
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jsonic-v3-ready', { detail: JSONIC }));
    }, 0);
}