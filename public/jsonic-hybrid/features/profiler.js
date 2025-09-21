/**
 * Query Profiler Feature Module
 * Provides performance monitoring and debugging tools
 */

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
            startTime: performance.now()
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
            
            if (query.duration > this.slowQueryThreshold) {
                console.warn(`[JSONIC Hybrid] Slow query detected: ${query.operation} took ${query.duration.toFixed(2)}ms`, query.details);
            }
        }
    }

    getSlowQueries(limit = 10) {
        return this.queries
            .filter(q => q.duration && q.duration > this.slowQueryThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    getStats() {
        if (this.queries.length === 0) return null;
        
        const durations = this.queries.map(q => q.duration || 0).filter(d => d > 0);
        if (durations.length === 0) return null;
        
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

export async function install(jsonicInstance) {
    // Create profiler instance
    const profiler = new QueryProfiler(jsonicInstance.options.debug);
    jsonicInstance._profiler = profiler;
    
    // Wrap core methods with profiling
    const methodsToProfile = ['insert', 'get', 'update', 'delete', 'query'];
    
    for (const method of methodsToProfile) {
        const original = jsonicInstance[method].bind(jsonicInstance);
        
        jsonicInstance[method] = async function(...args) {
            const queryId = profiler.startQuery(method, args[0]);
            
            try {
                const result = await original(...args);
                profiler.endQuery(queryId, result);
                return result;
            } catch (error) {
                profiler.endQuery(queryId);
                throw error;
            }
        };
    }
    
    // Add debug info method
    jsonicInstance.getDebugInfo = function() {
        const debugInfo = {
            profiler: profiler.getStats(),
            slowQueries: profiler.getSlowQueries(),
            features_loaded: Array.from(this.loadedFeatures),
            memory: {
                used: 0, // Would need actual memory tracking
                limit: this.options.memoryLimit || 0,
                percentage: '0%'
            }
        };
        
        if (this._cache) {
            debugInfo.cache = this._cache.stats();
        }
        
        return debugInfo;
    };
    
    jsonicInstance.clearProfiler = function() {
        profiler.clear();
    };
    
    if (jsonicInstance.options.debug) {
        console.log('[JSONIC Hybrid] Profiler feature installed');
    }
}