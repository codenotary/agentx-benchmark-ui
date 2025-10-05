/**
 * Query Result Caching with LRU Eviction
 * Improves query performance by caching frequently accessed results
 */
import { Collection } from './collection';
/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
    key: string;
    value: T[];
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    ttl?: number;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    maxSize: number;
    hitRate: number;
    avgAccessTime: number;
    entries: number;
}
/**
 * LRU Cache implementation for query results
 */
export declare class QueryCache<T = any> {
    private cache;
    private accessOrder;
    private maxSize;
    private maxEntries;
    private currentSize;
    private defaultTTL;
    private stats;
    constructor(options?: {
        maxSize?: number;
        maxEntries?: number;
        defaultTTL?: number;
    });
    /**
     * Generate cache key from query and options
     */
    generateKey(query: any, options?: any): string;
    /**
     * Get cached query result
     */
    get(key: string): T[] | null;
    /**
     * Set cached query result
     */
    set(key: string, value: T[], ttl?: number): void;
    /**
     * Delete cached entry
     */
    delete(key: string): boolean;
    /**
     * Clear entire cache
     */
    clear(): void;
    /**
     * Invalidate cache entries matching pattern
     */
    invalidate(pattern?: (key: string, entry: CacheEntry<T>) => boolean): number;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Warm up cache with common queries
     */
    warmUp(collection: Collection<T>, queries: Array<{
        query: any;
        options?: any;
    }>): Promise<void>;
    /**
     * Evict least recently used entry
     */
    private evictLRU;
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
    /**
     * Estimate size of cached value
     */
    private estimateSize;
    /**
     * Normalize query for consistent caching
     */
    private normalizeQuery;
    /**
     * Generate hash from object
     */
    private hashObject;
    /**
     * Update access time statistics
     */
    private updateAccessTime;
    /**
     * Export cache for persistence
     */
    exportCache(): {
        entries: Array<[string, CacheEntry<T>]>;
        stats: any;
    };
    /**
     * Import cache from persistence
     */
    importCache(data: {
        entries: Array<[string, CacheEntry<T>]>;
        stats: any;
    }): void;
}
/**
 * Collection wrapper with caching
 */
export declare class CachedCollection<T = any> {
    private collection;
    private cache;
    private autoInvalidate;
    constructor(collection: Collection<T>, cacheOptions?: {
        maxSize?: number;
        maxEntries?: number;
        defaultTTL?: number;
        autoInvalidate?: boolean;
    });
    /**
     * Find with caching
     */
    find(query: any, options?: any): Promise<T[]>;
    /**
     * Find one with caching
     */
    findOne(query: any, options?: any): Promise<T | null>;
    /**
     * Insert with cache invalidation
     */
    insertOne(doc: T): Promise<any>;
    /**
     * Update with cache invalidation
     */
    updateOne(query: any, update: any): Promise<any>;
    /**
     * Delete with cache invalidation
     */
    deleteOne(query: any): Promise<any>;
    /**
     * Invalidate queries that might be affected by a change
     */
    private invalidateRelatedQueries;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Warm up cache
     */
    warmUpCache(queries: Array<{
        query: any;
        options?: any;
    }>): Promise<void>;
    /**
     * Get underlying collection
     */
    getCollection(): Collection<T>;
    /**
     * Get cache instance
     */
    getCache(): QueryCache<T>;
}
/**
 * Global cache manager for all collections
 */
export declare class CacheManager {
    private static instance;
    private caches;
    private globalMaxSize;
    private constructor();
    static getInstance(): CacheManager;
    /**
     * Get or create cache for collection
     */
    getCacheForCollection<T>(collectionName: string, options?: {
        maxSize?: number;
        maxEntries?: number;
        defaultTTL?: number;
    }): QueryCache<T>;
    /**
     * Clear all caches
     */
    clearAll(): void;
    /**
     * Get global statistics
     */
    getGlobalStats(): {
        totalCaches: number;
        totalEntries: number;
        totalSize: number;
        totalHits: number;
        totalMisses: number;
        globalHitRate: number;
    };
}
export {};
//# sourceMappingURL=query-cache.d.ts.map