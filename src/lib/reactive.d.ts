/**
 * Reactive bindings and real-time updates for JSONIC
 * Provides observable patterns and subscription management
 */
import { QueryBuilder, Query } from './query-builder';
export type ChangeType = 'insert' | 'update' | 'delete' | 'batch';
export interface ChangeEvent<T = any> {
    id: string;
    type: ChangeType;
    document?: T;
    oldDocument?: T;
    timestamp: number;
    source?: string;
    documents?: T[];
    count?: number;
    ids?: string[];
}
export interface SubscriptionOptions {
    batchSize?: number;
    debounceMs?: number;
    includeInitial?: boolean;
}
export type Observer<T> = (event: ChangeEvent<T>) => void;
export type Unsubscribe = () => void;
/**
 * Observable wrapper for collections
 */
export declare class Observable<T = any> {
    private observers;
    private debounceTimers;
    /**
     * Subscribe to changes
     */
    subscribe(observer: Observer<T>, options?: {
        debounceMs?: number;
    }): Unsubscribe;
    /**
     * Emit a change event to all observers
     */
    emit(event: ChangeEvent<T>): void;
    /**
     * Get the number of active observers
     */
    get observerCount(): number;
    /**
     * Clear all observers
     */
    clear(): void;
}
/**
 * Reactive view that automatically updates based on a query
 */
export declare class ReactiveView<T = any> {
    private collection;
    private cache;
    private observable;
    private queryBuilder;
    private updateSubscription?;
    constructor(collection: any, // Will be Collection<T> when integrated
    query: Query<T> | QueryBuilder<T>);
    /**
     * Subscribe to view updates
     */
    subscribe(observer: (documents: T[]) => void): Unsubscribe;
    /**
     * Get current cached results
     */
    get(): T[];
    /**
     * Refresh the view manually
     */
    refresh(): Promise<T[]>;
    /**
     * Start watching for changes
     */
    watch(): void;
    /**
     * Stop watching for changes
     */
    unwatch(): void;
    /**
     * Update the query and refresh
     */
    updateQuery(query: Query<T> | QueryBuilder<T>): Promise<void>;
    /**
     * Handle document changes
     */
    private handleChange;
    /**
     * Check if a document matches the query
     */
    private matchesQuery;
    /**
     * Check a single operator condition
     */
    private checkOperator;
    /**
     * Emit update event
     */
    private emitUpdate;
}
/**
 * Live query that streams results as they change
 */
export declare class LiveQuery<T = any> {
    private collection;
    private query;
    private observable;
    private active;
    constructor(collection: any, // Will be Collection<T> when integrated
    query: Query<T> | QueryBuilder<T>);
    /**
     * Start the live query
     */
    start(): void;
    /**
     * Stop the live query
     */
    stop(): void;
    /**
     * Subscribe to result changes
     */
    subscribe(observer: Observer<T>): Unsubscribe;
    /**
     * Stream results as an async iterator
     */
    stream(): AsyncIterableIterator<T>;
}
/**
 * Cross-tab synchronization for reactive updates
 */
export declare class CrossTabSync {
    private channel;
    private observable;
    constructor(channelName?: string);
    /**
     * Broadcast a change to other tabs
     */
    broadcast(event: ChangeEvent): void;
    /**
     * Subscribe to changes from other tabs
     */
    subscribe(observer: Observer<any>): Unsubscribe;
    /**
     * Close the channel
     */
    close(): void;
}
/**
 * Change tracker for optimistic updates
 */
export declare class ChangeTracker<T = any> {
    private pendingChanges;
    private confirmedChanges;
    /**
     * Add a pending change
     */
    addPending(change: ChangeEvent<T>): void;
    /**
     * Confirm a pending change
     */
    confirm(id: string): void;
    /**
     * Reject a pending change
     */
    reject(id: string): ChangeEvent<T> | undefined;
    /**
     * Get all pending changes
     */
    getPending(): ChangeEvent<T>[];
    /**
     * Clear all changes
     */
    clear(): void;
    /**
     * Get statistics
     */
    getStats(): {
        pending: number;
        confirmed: number;
    };
}
export declare function observe<T = any>(collection: any): Observable<T>;
export declare function liveQuery<T = any>(collection: any, query: Query<T> | QueryBuilder<T>): LiveQuery<T>;
export declare function reactiveView<T = any>(collection: any, query: Query<T> | QueryBuilder<T>): ReactiveView<T>;
//# sourceMappingURL=reactive.d.ts.map