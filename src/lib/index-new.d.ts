/**
 * JSONIC - High-performance WebAssembly JSON Database
 * Developer-friendly TypeScript SDK with advanced features
 * @module jsonic-db
 */
export { QueryBuilder, Query, QueryCondition, QueryOperators, LogicalOperators, SortDirection, ProjectionSpec, query, where } from './query-builder';
export { Schema, SchemaDefinition, FieldSchema, SchemaType, ValidationResult, ValidationError, schema, validators, transformers } from './schema';
export { Observable, ReactiveView, LiveQuery, CrossTabSync, ChangeTracker, ChangeEvent, ChangeType, Observer, Unsubscribe, observe, liveQuery, reactiveView } from './reactive';
export { AggregationPipeline, PipelineStage, Accumulator, Accumulators, Expression, Expressions, aggregate, $sum, $avg, $min, $max, $push, $addToSet, $first, $last, $count } from './aggregation';
export { Collection, CollectionOptions, InsertOptions, UpdateOptions, DeleteOptions, FindOptions, BulkWriteOperation, BulkWriteResult } from './collection';
export { PersistenceManager, PersistenceConfig, PersistenceStats } from './persistence';
export { DebugTools, createDebugTools, enableJSONICDebug, QueryExecutionPlan, ExecutionStep, PerformanceMetrics, IndexRecommendation } from './debug-tools';
export { GraphQLAdapter, GraphQLType, GraphQLField, GraphQLResult, GraphQLError, SchemaBuilder } from './graphql-adapter';
export { JSONICServerClient, createWithServer, ServerConfig, type SyncState } from './jsonic-server-client';
import { Collection } from './collection';
import { Schema } from './schema';
/**
 * Database configuration options
 */
export interface DatabaseOptions {
    name?: string;
    version?: number;
    persistence?: boolean;
    persistenceConfig?: {
        wasmPath?: string;
        workerPath?: string;
        snapshotInterval?: number;
    };
    crossTabSync?: boolean;
    syncChannel?: string;
}
/**
 * Connection status
 */
export interface ConnectionStatus {
    connected: boolean;
    ready: boolean;
    synced: boolean;
    persistenceEnabled: boolean;
}
/**
 * Main JSONIC Database class with enhanced developer experience
 */
export declare class JSONIC {
    private options;
    private wasmModule;
    private db;
    private initialized;
    private collections;
    private persistence?;
    private crossTab?;
    private status;
    /**
     * Private constructor - use JSONIC.create() instead
     * @private
     */
    private constructor();
    /**
     * Initialize the database
     */
    connect(): Promise<void>;
    /**
     * Ensure database is connected
     */
    private ensureConnected;
    /**
     * Create or get a collection
     */
    collection<T = any>(name: string, options?: {
        schema?: Schema<T>;
        indexes?: Array<{
            field: keyof T | string;
            type?: 'hash' | 'btree' | 'text' | 'geo';
            unique?: boolean;
        }>;
    }): Collection<T>;
    /**
     * Drop a collection
     */
    dropCollection(name: string): Promise<boolean>;
    /**
     * List all collections
     */
    listCollections(): string[];
    /**
     * Get database statistics
     */
    stats(): Promise<{
        collections: number;
        documents: number;
        indexes: number;
        size: number;
    }>;
    /**
     * Get connection status
     */
    getStatus(): ConnectionStatus;
    /**
     * Create a backup
     */
    backup(): Promise<Blob>;
    /**
     * Restore from backup
     */
    restore(backup: Blob): Promise<void>;
    /**
     * Export entire database as JSON string
     * Simple API for backup/export
     */
    export(): Promise<string>;
    /**
     * Import database from JSON string
     * Simple API for restore/import
     */
    import(jsonString: string, options?: {
        clearExisting?: boolean;
    }): Promise<void>;
    /**
     * Export database to downloadable file
     */
    exportToFile(filename?: string): Promise<void>;
    /**
     * Import database from file upload
     */
    importFromFile(file: File, options?: {
        clearExisting?: boolean;
    }): Promise<void>;
    /**
     * Execute a raw query (advanced use)
     */
    query(queryJson: string, optionsJson?: string): Promise<any>;
    /**
     * Execute an aggregation pipeline (advanced use)
     */
    aggregate(pipelineJson: string): Promise<any>;
    /**
     * Transaction support (placeholder for future implementation)
     */
    transaction<T>(callback: (session: TransactionSession) => Promise<T>): Promise<T>;
    /**
     * Close the database connection
     */
    close(): Promise<void>;
    /**
     * Create a new JSONIC instance (factory method)
     */
    static create(options?: DatabaseOptions): Promise<JSONIC>;
}
/**
 * Transaction session for atomic operations
 */
declare class TransactionSession {
    private db;
    private operations;
    private committed;
    private rolledBack;
    constructor(db: any);
    /**
     * Add an operation to the transaction
     */
    addOperation(op: any): void;
    /**
     * Commit the transaction
     */
    commit(): Promise<void>;
    /**
     * Rollback the transaction
     */
    rollback(): Promise<void>;
}
export default JSONIC;
export declare function createDatabase(options?: DatabaseOptions): Promise<JSONIC>;
export declare const db: JSONIC;
//# sourceMappingURL=index-new.d.ts.map