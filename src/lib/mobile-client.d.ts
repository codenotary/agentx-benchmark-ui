/**
 * Mobile-optimized client for JSONIC
 * Provides a facade that delegates all operations to a Web Worker
 */
export interface MobileConfig {
    enableWorker?: boolean;
    workerPath?: string;
    maxMemoryMB?: number;
    enablePersistence?: boolean;
    persistenceAdapter?: 'indexeddb' | 'opfs';
}
export declare class MobileJSONIC {
    private worker;
    private messageId;
    private pendingMessages;
    private isReady;
    private readyPromise;
    private readyResolver;
    private config;
    constructor(config?: MobileConfig);
    /**
     * Initialize the Web Worker
     */
    private initWorker;
    /**
     * Send message to worker and return promise
     */
    private sendToWorker;
    /**
     * Handle messages from worker
     */
    private handleWorkerMessage;
    /**
     * Wait for initialization to complete
     */
    waitForReady(): Promise<void>;
    /**
     * Collection factory with mobile optimizations
     */
    collection<T = any>(name: string, options?: any): MobileCollection<T>;
    /**
     * Insert a document
     */
    insert(data: any): Promise<string>;
    /**
     * Find documents with automatic pagination for mobile
     */
    find(query?: any, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    /**
     * Update a document
     */
    update(id: string, data: any): Promise<boolean>;
    /**
     * Delete a document
     */
    delete(id: string): Promise<boolean>;
    /**
     * Batch operations for better performance
     */
    batch(operations: any[]): Promise<any[]>;
    /**
     * Create index
     */
    createIndex(name: string, fields: string[]): Promise<void>;
    /**
     * Cleanup and close
     */
    close(): Promise<void>;
    /**
     * Optional callback for memory warnings
     */
    onMemoryWarning?: (info: {
        usage: number;
        threshold: number;
    }) => void;
}
/**
 * Mobile-optimized collection
 */
export declare class MobileCollection<T = any> {
    private db;
    private name;
    private options?;
    constructor(db: MobileJSONIC, name: string, options?: any | undefined);
    /**
     * Insert one document
     */
    insertOne(doc: T): Promise<{
        id: string;
    }>;
    /**
     * Insert many documents in batch
     */
    insertMany(docs: T[]): Promise<{
        ids: string[];
    }>;
    /**
     * Find documents with mobile-friendly pagination
     */
    find(query?: any, options?: {
        limit?: number;
        skip?: number;
    }): Promise<T[]>;
    /**
     * Find one document
     */
    findOne(query?: any): Promise<T | null>;
    /**
     * Update one document
     */
    updateOne(filter: any, update: Partial<T>): Promise<{
        modifiedCount: number;
    }>;
    /**
     * Delete one document
     */
    deleteOne(filter: any): Promise<{
        deletedCount: number;
    }>;
    /**
     * Count documents (with estimation for large collections)
     */
    countDocuments(filter?: any): Promise<number>;
}
export declare function createJSONIC(config?: MobileConfig): MobileJSONIC;
//# sourceMappingURL=mobile-client.d.ts.map