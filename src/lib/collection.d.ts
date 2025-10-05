/**
 * Collection API for JSONIC
 * Provides a high-level, developer-friendly interface to the database
 */
import { QueryBuilder, Query } from './query-builder';
import { Schema } from './schema';
import { ReactiveView, LiveQuery, ChangeEvent } from './reactive';
import { AggregationPipeline } from './aggregation';
export interface CollectionOptions<T> {
    name: string;
    schema?: Schema<T>;
    indexes?: Array<{
        field: keyof T | string;
        type?: 'hash' | 'btree' | 'text' | 'geo';
        unique?: boolean;
    }>;
    enableSync?: boolean;
    syncChannel?: string;
    cache?: {
        enabled: boolean;
        maxSize?: number;
        maxEntries?: number;
        defaultTTL?: number;
        autoInvalidate?: boolean;
    };
}
export interface InsertOptions {
    validate?: boolean;
    returnDocument?: boolean;
}
export interface UpdateOptions {
    upsert?: boolean;
    returnDocument?: 'before' | 'after';
    validate?: boolean;
}
export interface DeleteOptions {
    returnDocument?: boolean;
}
export interface FindOptions<T> {
    limit?: number;
    skip?: number;
    sort?: Partial<Record<keyof T, 1 | -1>>;
    projection?: Partial<Record<keyof T, 0 | 1>>;
}
export interface BulkWriteOperation<T> {
    insertOne?: {
        document: T;
    };
    updateOne?: {
        filter: Query<T>;
        update: Partial<T>;
        upsert?: boolean;
    };
    updateMany?: {
        filter: Query<T>;
        update: Partial<T>;
    };
    deleteOne?: {
        filter: Query<T>;
    };
    deleteMany?: {
        filter: Query<T>;
    };
    replaceOne?: {
        filter: Query<T>;
        replacement: T;
        upsert?: boolean;
    };
}
export interface BulkWriteResult {
    insertedCount: number;
    matchedCount: number;
    modifiedCount: number;
    deletedCount: number;
    upsertedCount: number;
    insertedIds: string[];
    upsertedIds: string[];
}
/**
 * Collection class representing a collection of documents
 */
export declare class Collection<T = any> {
    private options;
    private db;
    private observable;
    private crossTab?;
    private views;
    private liveQueries;
    private cache?;
    constructor(options: CollectionOptions<T>);
    /**
     * Initialize the collection
     */
    init(db: any): Promise<void>;
    /**
     * Get collection name
     */
    get name(): string;
    /**
     * Unwrap WASM document structure to plain content
     */
    private unwrapDocument;
    /**
     * Unwrap array of WASM documents
     */
    private unwrapDocuments;
    /**
     * Wrap plain document for WASM storage (extract _id if present)
     */
    private wrapDocument;
    /**
     * Get collection schema
     */
    get schema(): Schema<T> | undefined;
    /**
     * Insert a single document
     */
    insertOne(document: T, options?: InsertOptions): Promise<{
        id: string;
        document?: T;
    }>;
    /**
     * Insert multiple documents using optimized batch operation
     */
    insertMany(documents: T[], options?: InsertOptions): Promise<{
        ids: string[];
        documents?: T[];
    }>;
    /**
     * Find a single document
     */
    findOne(filter: Query<T> | QueryBuilder<T>, options?: FindOptions<T>): Promise<T | null>;
    /**
     * Find documents matching a query
     */
    find(filter?: Query<T> | QueryBuilder<T>, options?: FindOptions<T>): Promise<T[]>;
    /**
     * Find a document by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Update a single document
     */
    updateOne(filter: Query<T> | QueryBuilder<T>, update: Partial<T>, options?: UpdateOptions): Promise<{
        matchedCount: number;
        modifiedCount: number;
        document?: T;
    }>;
    /**
     * Update multiple documents using optimized batch operation
     */
    updateMany(filter: Query<T> | QueryBuilder<T>, update: Partial<T>, options?: Omit<UpdateOptions, 'returnDocument'>): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    /**
     * Delete a single document
     */
    deleteOne(filter: Query<T> | QueryBuilder<T>, options?: DeleteOptions): Promise<{
        deletedCount: number;
        document?: T;
    }>;
    /**
     * Delete multiple documents using optimized batch operation
     */
    deleteMany(filter: Query<T> | QueryBuilder<T>): Promise<{
        deletedCount: number;
    }>;
    /**
     * Replace a document
     */
    replaceOne(filter: Query<T> | QueryBuilder<T>, replacement: T, options?: UpdateOptions): Promise<{
        matchedCount: number;
        modifiedCount: number;
        document?: T;
    }>;
    /**
     * Count documents
     */
    count(filter?: Query<T> | QueryBuilder<T>): Promise<number>;
    /**
     * Perform bulk write operations
     */
    bulkWrite(operations: BulkWriteOperation<T>[]): Promise<BulkWriteResult>;
    /**
     * Create an aggregation pipeline
     */
    aggregate(): AggregationPipeline<T>;
    /**
     * Execute an aggregation pipeline
     */
    aggregateExecute(pipeline: AggregationPipeline<T> | any[]): Promise<any[]>;
    /**
     * Create a reactive view
     */
    createView(name: string, query: Query<T> | QueryBuilder<T>): ReactiveView<T>;
    /**
     * Get a reactive view
     */
    getView(name: string): ReactiveView<T> | undefined;
    /**
     * Create a live query
     */
    live(query: Query<T> | QueryBuilder<T>): LiveQuery<T>;
    /**
     * Watch for changes
     */
    watch(callback: (event: ChangeEvent<T>) => void): () => void;
    /**
     * Create an index
     */
    createIndex(spec: {
        field: keyof T | string;
        type?: 'hash' | 'btree' | 'text' | 'geo';
        unique?: boolean;
    }): Promise<void>;
    /**
     * Drop an index
     */
    dropIndex(name: string): Promise<void>;
    /**
     * List indexes
     */
    listIndexes(): Promise<string[]>;
    /**
     * Drop the collection
     */
    drop(): Promise<void>;
    /**
     * Create a query builder for this collection
     */
    query(): QueryBuilder<T>;
    /**
     * Get cache statistics
     */
    getCacheStats(): any;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Warm up cache with common queries
     */
    warmUpCache(queries: Array<{
        query: any;
        options?: any;
    }>): Promise<void>;
    /**
     * Invalidate cache entries matching a pattern
     */
    invalidateCache(pattern?: (key: string, entry: any) => boolean): number;
    /**
     * Enable or disable cache
     */
    setCacheEnabled(enabled: boolean): void;
}
//# sourceMappingURL=collection.d.ts.map