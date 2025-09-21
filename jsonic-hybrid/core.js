/**
 * JSONIC Hybrid Core - Lightweight base with progressive feature loading
 * This provides fast initialization with v1-like performance and on-demand v3 features
 */

import { JsonDB } from '../jsonic_wasm.js';

// Feature registry for lazy loading
const featureRegistry = {
    'cache': () => import('./features/lru-cache.js'),
    'batch': () => import('./features/batching.js'),
    'aggregate': () => import('./features/aggregation.js'),
    'profiler': () => import('./features/profiler.js'),
    'graphql': () => import('./features/graphql.js'),
    'memory': () => import('./features/memory-monitor.js'),
    'persistence': () => import('./features/persistence.js'),
};

export class JsonicHybrid {
    constructor(options = {}) {
        const initStartTime = performance.now();
        
        this.db = new JsonDB();
        this.options = options;
        this.loadedFeatures = new Set();
        this.featurePromises = new Map();
        this._cache = null;
        this._profiler = null;
        this._memoryMonitor = null;
        
        if (options.debug) {
            console.log(`[JSONIC Hybrid] Core initialized in ${(performance.now() - initStartTime).toFixed(2)}ms`);
        }
        
        // Preload requested features in background
        if (options.preloadFeatures?.length > 0) {
            this._preloadFeatures(options.preloadFeatures);
        }
        
        // Initialize persistence if enabled
        if (options.enablePersistence) {
            this._initPersistence();
        }
    }
    
    // ============= Core Methods (Always Available) =============
    
    async insert(data) {
        const json = JSON.stringify(data);
        const result = this.db.insert(json);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (!parsed.success) {
            throw new Error(parsed.error || 'Insert failed');
        }
        
        // Notify cache if loaded
        if (this._cache) {
            this._cache.invalidate();
        }
        
        return parsed.data;
    }
    
    async get(id) {
        // Check cache if available
        if (this._cache) {
            const cached = this._cache.get(`get_${id}`);
            if (cached) return cached.value;
        }
        
        const result = this.db.get(id);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (parsed.success) {
            const data = parsed.data?.content || parsed.data;
            
            // Cache if available
            if (this._cache) {
                this._cache.set(`get_${id}`, data);
            }
            
            return data;
        }
        
        return null;
    }
    
    async update(id, data) {
        const json = JSON.stringify(data);
        const result = this.db.update(id, json);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (!parsed.success) {
            throw new Error(parsed.error || 'Update failed');
        }
        
        // Invalidate cache if loaded
        if (this._cache) {
            this._cache.invalidate(`get_${id}`);
        }
        
        return parsed.data || true;
    }
    
    async delete(id) {
        const result = this.db.delete(id);
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        if (!parsed.success) {
            throw new Error(parsed.error || 'Delete failed');
        }
        
        // Invalidate cache if loaded
        if (this._cache) {
            this._cache.invalidate(`get_${id}`);
        }
        
        return parsed.data || true;
    }
    
    async list() {
        const result = this.db.list_ids();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed.data || [];
    }
    
    async stats() {
        const result = this.db.stats();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        
        const stats = {
            ...parsed.data,
            features_loaded: Array.from(this.loadedFeatures),
            hybrid_version: '4.0.0'
        };
        
        // Add cache stats if available
        if (this._cache) {
            stats.cache = this._cache.stats();
        }
        
        return stats;
    }
    
    // Basic query without caching (always available)
    async query(filter, options = {}) {
        const ids = await this.list();
        let results = [];
        
        for (const id of ids) {
            const doc = await this.get(id);
            if (doc && this._matchesFilter(doc, filter)) {
                results.push({ id, ...doc });
            }
        }
        
        // Apply options
        if (options.sort) {
            results = this._sortResults(results, options.sort);
        }
        if (options.skip) {
            results = results.slice(options.skip);
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        
        return results;
    }
    
    // MongoDB-style find (always available, basic version)
    find(filter = {}) {
        const self = this;
        let queryFilter = filter;
        let queryOptions = {};
        
        const chainable = {
            sort(sortSpec) {
                queryOptions.sort = Object.entries(sortSpec).map(([k, v]) => [k, v]);
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
    
    // ============= Progressive Feature Loading =============
    
    async _loadFeature(featureName) {
        if (this.loadedFeatures.has(featureName)) {
            return true;
        }
        
        // Check if already loading
        if (this.featurePromises.has(featureName)) {
            return this.featurePromises.get(featureName);
        }
        
        const loadPromise = (async () => {
            try {
                const startTime = performance.now();
                
                if (!featureRegistry[featureName]) {
                    throw new Error(`Unknown feature: ${featureName}`);
                }
                
                const module = await featureRegistry[featureName]();
                await module.install(this);
                
                this.loadedFeatures.add(featureName);
                
                if (this.options.debug) {
                    const loadTime = performance.now() - startTime;
                    console.log(`[JSONIC Hybrid] Feature '${featureName}' loaded in ${loadTime.toFixed(2)}ms`);
                }
                
                return true;
            } catch (error) {
                console.error(`[JSONIC Hybrid] Failed to load feature '${featureName}':`, error);
                throw error;
            } finally {
                this.featurePromises.delete(featureName);
            }
        })();
        
        this.featurePromises.set(featureName, loadPromise);
        return loadPromise;
    }
    
    async _preloadFeatures(features) {
        // Load features in background after a short delay
        setTimeout(async () => {
            for (const feature of features) {
                try {
                    await this._loadFeature(feature);
                } catch (error) {
                    console.warn(`[JSONIC Hybrid] Failed to preload feature '${feature}':`, error);
                }
            }
        }, 100);
    }
    
    async _initPersistence() {
        try {
            await this._loadFeature('persistence');
        } catch (error) {
            console.warn('[JSONIC Hybrid] Persistence feature not available:', error);
        }
    }
    
    // ============= Stub Methods (Load on First Use) =============
    
    async insertMany(documents) {
        await this._loadFeature('batch');
        return this.insertMany(documents);
    }
    
    async updateMany(filter, update) {
        await this._loadFeature('batch');
        return this.updateMany(filter, update);
    }
    
    async deleteMany(filter) {
        await this._loadFeature('batch');
        return this.deleteMany(filter);
    }
    
    async aggregate(pipeline) {
        await this._loadFeature('aggregate');
        return this.aggregate(pipeline);
    }
    
    async enableCache(size = 100) {
        await this._loadFeature('cache');
        return this.enableCache(size);
    }
    
    async getDebugInfo() {
        await this._loadFeature('profiler');
        return this.getDebugInfo();
    }
    
    async clearCache() {
        if (this._cache) {
            this._cache.invalidate();
        }
    }
    
    async clearProfiler() {
        if (this._profiler) {
            this._profiler.clear();
        }
    }
    
    // ============= Helper Methods =============
    
    _matchesFilter(doc, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (key === '$or') {
                if (!value.some(subFilter => this._matchesFilter(doc, subFilter))) {
                    return false;
                }
            } else if (key === '$and') {
                if (!value.every(subFilter => this._matchesFilter(doc, subFilter))) {
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
    
    _sortResults(results, sortSpec) {
        return results.sort((a, b) => {
            for (const [key, order] of sortSpec) {
                const diff = (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);
                if (diff !== 0) return diff * order;
            }
            return 0;
        });
    }
}