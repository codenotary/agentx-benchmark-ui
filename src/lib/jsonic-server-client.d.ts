/**
 * JSONIC Server Client - Simple server sync for JSONIC
 *
 * Key improvements:
 * 1. Automatic connection management
 * 2. Local-first with background sync
 * 3. Optimistic updates with rollback
 * 4. Automatic conflict resolution
 * 5. Simple API - just works™
 */
import { Collection } from './collection';
import { JSONIC } from './index-new';
export interface ServerConfig {
    url?: string;
    token?: string;
    database?: string;
    syncMode?: 'auto' | 'manual' | 'readonly';
    syncInterval?: number;
    conflictStrategy?: 'last-write' | 'client-wins' | 'server-wins' | 'merge';
    batchSize?: number;
    compression?: boolean;
    cacheOffline?: boolean;
}
export interface SyncState {
    connected: boolean;
    syncing: boolean;
    lastSync?: Date;
    pendingChanges: number;
    errors: Error[];
}
/**
 * Enhanced JSONIC with server sync
 *
 * Usage:
 * ```typescript
 * // Just works with zero config!
 * const db = await JSONIC.createWithServer();
 *
 * // Or specify server with authentication
 * const db = await JSONIC.createWithServer({
 *   url: 'https://jsonic-server.example.com',
 *   token: 'your_bearer_token_here'
 * });
 *
 * // Use normally - syncs automatically
 * const users = db.collection('users');
 * await users.insertOne({ name: 'Alice' }); // Saved locally AND synced to server
 * ```
 */
export declare class JSONICServerClient {
    private local;
    private config;
    private ws?;
    private syncState;
    private changeLog;
    private syncTimer?;
    private reconnectTimer?;
    private retryCount;
    private maxRetries;
    private collections;
    private requestCallbacks;
    private requestId;
    constructor(local: JSONIC, config?: ServerConfig);
    /**
     * Get sync state for UI indicators
     */
    get state(): Readonly<SyncState>;
    /**
     * Connect to server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from server
     */
    disconnect(): Promise<void>;
    /**
     * Enhanced collection with server sync
     */
    collection<T = any>(name: string): Collection<T>;
    /**
     * Force sync now
     */
    sync(): Promise<void>;
    /**
     * Get offline changes count
     */
    getPendingChanges(): number;
    private enhanceCollection;
    private trackChange;
    private syncPendingChanges;
    private sendChange;
    private handleServerMessage;
    private handleServerUpdate;
    private pullChanges;
    private pushChanges;
    private startAutoSync;
    private stopAutoSync;
    private scheduleReconnect;
}
/**
 * Extension to JSONIC for server support
 */
declare module './index-new' {
    interface JSONIC {
        withServer(config?: ServerConfig): JSONICServerClient;
    }
}
export declare function createWithServer(config?: ServerConfig): Promise<JSONICServerClient>;
export { JSONIC } from './index-new';
//# sourceMappingURL=jsonic-server-client.d.ts.map