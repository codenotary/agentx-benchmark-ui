/**
 * Sync Adapter for JSONIC - Enables shared data between users
 * Supports multiple backend strategies (WebSocket, HTTP polling, WebRTC, Firebase)
 */
import { Collection } from './collection';
export interface SyncOptions {
    url: string;
    strategy: 'websocket' | 'http' | 'webrtc' | 'firebase' | 'supabase';
    apiKey?: string;
    auth?: {
        type: 'jwt' | 'apikey' | 'oauth' | 'anonymous';
        token?: string;
        refreshToken?: string;
    };
    conflictResolution?: 'last-write-wins' | 'client-wins' | 'server-wins' | 'manual' | 'crdt';
    syncInterval?: number;
    reconnectDelay?: number;
    maxRetries?: number;
    batchSize?: number;
    compression?: boolean;
}
export interface SyncEvent {
    type: 'connected' | 'disconnected' | 'sync' | 'conflict' | 'error';
    data?: any;
    error?: Error;
    timestamp: number;
}
export interface ChangeSet {
    id: string;
    collection: string;
    operation: 'insert' | 'update' | 'delete';
    document?: any;
    oldDocument?: any;
    timestamp: number;
    userId?: string;
    version?: number;
}
export interface ConflictResolution {
    strategy: string;
    resolve(local: any, remote: any, base?: any): any;
}
/**
 * Base sync adapter class
 */
export declare abstract class SyncAdapter {
    protected options: SyncOptions;
    protected collections: Map<string, Collection<any>>;
    protected pendingChanges: ChangeSet[];
    protected isConnected: boolean;
    protected listeners: Map<string, Set<(event: SyncEvent) => void>>;
    protected conflictResolver: ConflictResolution;
    constructor(options: SyncOptions);
    /**
     * Register a collection for synchronization
     */
    registerCollection(collection: Collection<any>, options?: {
        filter?: any;
        fields?: string[];
        readonly?: boolean;
        transform?: (doc: any) => any;
    }): void;
    /**
     * Connect to the backend
     */
    abstract connect(): Promise<void>;
    /**
     * Disconnect from the backend
     */
    abstract disconnect(): Promise<void>;
    /**
     * Send changes to the backend
     */
    protected abstract sendChanges(changes: ChangeSet[]): Promise<void>;
    /**
     * Receive changes from the backend
     */
    protected abstract receiveChanges(): Promise<ChangeSet[]>;
    /**
     * Handle local changes
     */
    protected handleLocalChange(change: ChangeSet): void;
    /**
     * Sync pending changes
     */
    protected syncChanges(): Promise<void>;
    /**
     * Apply remote changes
     */
    protected applyRemoteChanges(changes: ChangeSet[]): Promise<void>;
    /**
     * Create conflict resolver based on strategy
     */
    protected createConflictResolver(strategy: string): ConflictResolution;
    /**
     * CRDT merge implementation
     */
    protected mergeCRDT(local: any, remote: any): any;
    /**
     * Get current user ID
     */
    protected getCurrentUserId(): string;
    /**
     * Event emitter methods
     */
    on(event: string, handler: (event: SyncEvent) => void): void;
    off(event: string, handler: (event: SyncEvent) => void): void;
    protected emit(type: string, data?: any): void;
}
/**
 * WebSocket sync adapter
 */
export declare class WebSocketSyncAdapter extends SyncAdapter {
    private ws?;
    private reconnectTimer?;
    private heartbeatTimer?;
    private retryCount;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected sendChanges(changes: ChangeSet[]): Promise<void>;
    protected receiveChanges(): Promise<ChangeSet[]>;
    private send;
    private handleMessage;
    private startHeartbeat;
    private stopHeartbeat;
    private scheduleReconnect;
    private fullSync;
    private compress;
}
/**
 * HTTP polling sync adapter
 */
export declare class HTTPSyncAdapter extends SyncAdapter {
    private pollTimer?;
    private lastSyncTime;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    protected sendChanges(changes: ChangeSet[]): Promise<void>;
    protected receiveChanges(): Promise<ChangeSet[]>;
    private startPolling;
    private stopPolling;
}
/**
 * Sync manager for JSONIC
 */
export declare class SyncManager {
    private adapter?;
    private db;
    constructor(db: any);
    /**
     * Initialize sync with backend
     */
    initialize(options: SyncOptions): Promise<void>;
    /**
     * Register a collection for synchronization
     */
    registerCollection(name: string, options?: any): void;
    /**
     * Disconnect sync
     */
    disconnect(): Promise<void>;
    /**
     * Get sync adapter for advanced usage
     */
    getAdapter(): SyncAdapter | undefined;
}
export declare function enableSync(db: any): SyncManager;
//# sourceMappingURL=sync-adapter.d.ts.map