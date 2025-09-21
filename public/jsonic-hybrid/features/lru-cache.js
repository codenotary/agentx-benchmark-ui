/**
 * LRU Cache Feature Module
 * Provides query result caching with automatic invalidation
 */

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

export async function install(jsonicInstance) {
    // Create cache instance
    const cache = new LRUCache(jsonicInstance.options.cacheSize || 100);
    jsonicInstance._cache = cache;
    
    // Enhance query method with caching
    const originalQuery = jsonicInstance.query.bind(jsonicInstance);
    
    jsonicInstance.query = async function(filter, options = {}) {
        const cacheKey = `query_${JSON.stringify({ filter, options })}`;
        
        // Check cache
        const cached = cache.get(cacheKey);
        if (cached) {
            if (jsonicInstance.options.debug) {
                console.log('[JSONIC Hybrid] Cache hit for query');
            }
            return cached.value;
        }
        
        // Execute query
        const result = await originalQuery(filter, options);
        
        // Cache result
        cache.set(cacheKey, result);
        
        return result;
    };
    
    // Add cache control methods
    jsonicInstance.enableCache = function(size = 100) {
        cache.maxSize = size;
        return true;
    };
    
    jsonicInstance.getCacheStats = function() {
        return cache.stats();
    };
    
    if (jsonicInstance.options.debug) {
        console.log('[JSONIC Hybrid] LRU cache feature installed');
    }
}