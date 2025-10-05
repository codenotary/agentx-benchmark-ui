/**
 * OPFS Persistence Manager for jsonic
 * Handles persistent storage using Origin Private File System
 */
export interface PersistenceConfig {
    wasmPath?: string;
    modulePath?: string;
    snapshotInterval?: number;
    workerPath?: string;
}
export interface PersistenceStats {
    operationsSinceSnapshot: number;
    currentSequence: number;
    snapshotSize: number;
    walSize: number;
}
export declare class PersistenceManager {
    private config;
    private worker;
    private messageId;
    private pendingRequests;
    private initialized;
    constructor(config?: PersistenceConfig);
    /**
     * Initialize the persistence manager and worker
     */
    initialize(): Promise<void>;
    /**
     * Send a message to the worker and wait for response
     */
    private sendMessage;
    /**
     * Insert a document
     */
    insert(document: any): Promise<any>;
    /**
     * Update a document
     */
    update(id: string, document: any): Promise<any>;
    /**
     * Delete a document
     */
    delete(id: string): Promise<any>;
    /**
     * Get a document by ID
     */
    get(id: string): Promise<any>;
    /**
     * Query documents
     */
    query(queryObj: any): Promise<any>;
    /**
     * Create a snapshot manually
     */
    createSnapshot(): Promise<void>;
    /**
     * Compact the WAL
     */
    compact(): Promise<void>;
    /**
     * Get persistence statistics
     */
    getStats(): Promise<PersistenceStats>;
    /**
     * Clear all data
     */
    clear(): Promise<void>;
    /**
     * Terminate the worker
     */
    terminate(): void;
    /**
     * Ensure the manager is initialized
     */
    private ensureInitialized;
}
/**
 * Check if OPFS is available in the current environment
 */
export declare function isOPFSAvailable(): boolean;
/**
 * Check if we're running in a Web Worker
 */
export declare function isInWorker(): boolean;
/**
 * Request persistent storage permission
 */
export declare function requestPersistentStorage(): Promise<boolean>;
/**
 * Get storage estimate
 */
export declare function getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
}>;
/**
 * Create a persistence-enabled JsonDB instance
 */
export declare class PersistentJsonDB {
    private persistence;
    constructor(config?: PersistenceConfig);
    /**
     * Initialize the database with persistence
     */
    initialize(): Promise<void>;
    /**
     * Insert a document
     */
    insert(document: any): Promise<string>;
    /**
     * Update a document
     */
    update(id: string, document: any): Promise<void>;
    /**
     * Delete a document
     */
    delete(id: string): Promise<void>;
    /**
     * Get a document by ID
     */
    get(id: string): Promise<any>;
    /**
     * Query documents
     */
    query(queryObj: any): Promise<any[]>;
    /**
     * Get all documents
     */
    getAll(): Promise<any[]>;
    /**
     * Clear all documents
     */
    clear(): Promise<void>;
    /**
     * Create a manual snapshot
     */
    snapshot(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<PersistenceStats>;
    /**
     * Get storage usage information
     */
    getStorageInfo(): Promise<{
        usage: number;
        quota: number;
        percentage: number;
    }>;
    /**
     * Close the database connection
     */
    close(): void;
}
//# sourceMappingURL=persistence.d.ts.map