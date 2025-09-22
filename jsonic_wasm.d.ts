/* tslint:disable */
/* eslint-disable */
/**
 * Initialize the WASM module
 */
export function init(): void;
/**
 * The main database interface exposed to JavaScript
 */
export class JsonDB {
  free(): void;
  /**
   * Creates a new database instance with automatic indexing
   */
  constructor();
  /**
   * Insert a new document
   */
  insert(json_str: string): any;
  /**
   * Get a document by ID
   */
  get(id: string): any;
  /**
   * Insert multiple documents in a single batch operation
   * This is much faster than calling insert() multiple times
   */
  insert_many(json_array_str: string): any;
  /**
   * Update an existing document
   */
  update(id: string, json_str: string): any;
  /**
   * Update multiple documents in a single batch operation
   */
  update_many(updates_json: string): any;
  /**
   * Delete a document
   */
  delete(id: string): any;
  /**
   * Delete multiple documents in a single batch operation
   */
  delete_many(ids_json: string): any;
  /**
   * Get database statistics
   */
  stats(): any;
  /**
   * List all document IDs
   */
  list_ids(): any;
  /**
   * Query documents using MongoDB-style queries with index optimization and caching
   */
  query(query_json: string): any;
  /**
   * Query documents with options (sort, projection, etc.)
   */
  query_with_options(query_json: string, options_json: string): any;
  /**
   * Create an index on a field
   */
  create_index(name: string, fields_json: string): any;
  /**
   * Drop an index
   */
  drop_index(name: string): any;
  /**
   * List all indexes
   */
  list_indexes(): any;
  /**
   * Execute an aggregation pipeline
   * 
   * Example pipeline:
   * ```json
   * [
   *   { "$match": { "status": "active" } },
   *   { "$group": { "_id": "$category", "count": { "$sum": 1 } } },
   *   { "$sort": { "count": -1 } },
   *   { "$limit": 10 }
   * ]
   * ```
   */
  aggregate(pipeline_json: string): any;
  /**
   * Clear all documents
   */
  clear(): any;
}
/**
 * Query subscription for reactive updates
 */
export class QuerySubscription {
  free(): void;
  /**
   * Create a new subscription
   */
  constructor(query: string);
  /**
   * Pause the subscription
   */
  pause(): void;
  /**
   * Resume the subscription
   */
  resume(): void;
  /**
   * Set update callback
   */
  on_update(callback: Function): void;
  /**
   * Trigger an update
   */
  notify(update: any): void;
  /**
   * Get subscription ID
   */
  readonly id: string;
  /**
   * Check if subscription is active
   */
  readonly active: boolean;
}
/**
 * Reactive database with real-time updates
 */
export class ReactiveDB {
  free(): void;
  /**
   * Create a new reactive database
   */
  constructor();
  /**
   * Enable cross-tab synchronization
   */
  enable_cross_tab_sync(channel_name: string): void;
  /**
   * Create a reactive view
   */
  create_view(query: string): ReactiveView;
  /**
   * Subscribe to query changes
   */
  subscribe(query: string, callback: Function): QuerySubscription;
  /**
   * Broadcast a change to all tabs
   */
  broadcast_change(change: any): void;
  /**
   * Process a local change and notify subscribers
   */
  process_change(change: any): void;
}
/**
 * Utilities for working with reactive features
 */
export class ReactiveUtils {
  private constructor();
  free(): void;
  /**
   * Check if SharedArrayBuffer is available
   */
  static is_shared_memory_available(): boolean;
  /**
   * Check if BroadcastChannel is available
   */
  static is_broadcast_channel_available(): boolean;
  /**
   * Create a change event
   */
  static create_change_event(change_type: string, document_id: string, document: any): any;
  /**
   * Create an update notification
   */
  static create_update(added: Array<any>, removed: Array<any>, updated: Array<any>): any;
}
/**
 * JavaScript-friendly reactive view
 */
export class ReactiveView {
  free(): void;
  /**
   * Create a new reactive view with a query
   */
  constructor(query: string);
  /**
   * Set callback for updates
   */
  on_update(callback: Function): void;
  /**
   * Enable cross-tab synchronization
   */
  enable_cross_tab(channel_name: string): void;
  /**
   * Broadcast an update to other tabs
   */
  broadcast_update(data: any): void;
  /**
   * Get the view ID
   */
  readonly id: string;
  /**
   * Get the query
   */
  readonly query: string;
}
/**
 * SharedArrayBuffer wrapper for zero-copy data transfer
 */
export class SharedBuffer {
  free(): void;
  /**
   * Create a new shared buffer
   */
  constructor(size: number);
  /**
   * Write data to the buffer
   */
  write(data: Uint8Array): number;
  /**
   * Read data from the buffer
   */
  read(length: number): Uint8Array;
  /**
   * Reset the buffer position
   */
  reset(): void;
  /**
   * Get the underlying SharedArrayBuffer
   */
  readonly buffer: SharedArrayBuffer;
  /**
   * Get current position
   */
  readonly position: number;
  /**
   * Get buffer size
   */
  readonly size: number;
}
/**
 * WASM bindings for SharedArrayBuffer
 */
export class WasmSharedBuffer {
  free(): void;
  constructor(size: number);
  write(data: Uint8Array): number;
  read(): Uint8Array;
  get_ptr(): number;
  get_size(): number;
  reset(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_jsondb_free: (a: number, b: number) => void;
  readonly jsondb_new: (a: number) => void;
  readonly jsondb_insert: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_get: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_insert_many: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_update: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly jsondb_update_many: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_delete: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_delete_many: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_stats: (a: number, b: number) => void;
  readonly jsondb_list_ids: (a: number, b: number) => void;
  readonly jsondb_query: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_query_with_options: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly jsondb_create_index: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly jsondb_drop_index: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_list_indexes: (a: number, b: number) => void;
  readonly jsondb_aggregate: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_clear: (a: number, b: number) => void;
  readonly __wbg_reactiveview_free: (a: number, b: number) => void;
  readonly reactiveview_new: (a: number, b: number, c: number) => void;
  readonly reactiveview_id: (a: number, b: number) => void;
  readonly reactiveview_query: (a: number, b: number) => void;
  readonly reactiveview_on_update: (a: number, b: number) => void;
  readonly reactiveview_enable_cross_tab: (a: number, b: number, c: number, d: number) => void;
  readonly reactiveview_broadcast_update: (a: number, b: number, c: number) => void;
  readonly __wbg_querysubscription_free: (a: number, b: number) => void;
  readonly querysubscription_new: (a: number, b: number) => number;
  readonly querysubscription_id: (a: number, b: number) => void;
  readonly querysubscription_active: (a: number) => number;
  readonly querysubscription_pause: (a: number) => void;
  readonly querysubscription_resume: (a: number) => void;
  readonly querysubscription_on_update: (a: number, b: number) => void;
  readonly querysubscription_notify: (a: number, b: number, c: number) => void;
  readonly __wbg_reactivedb_free: (a: number, b: number) => void;
  readonly reactivedb_new: () => number;
  readonly reactivedb_enable_cross_tab_sync: (a: number, b: number, c: number, d: number) => void;
  readonly reactivedb_create_view: (a: number, b: number, c: number, d: number) => void;
  readonly reactivedb_subscribe: (a: number, b: number, c: number, d: number) => number;
  readonly reactivedb_broadcast_change: (a: number, b: number, c: number) => void;
  readonly reactivedb_process_change: (a: number, b: number, c: number) => void;
  readonly __wbg_sharedbuffer_free: (a: number, b: number) => void;
  readonly sharedbuffer_new: (a: number, b: number) => void;
  readonly sharedbuffer_buffer: (a: number) => number;
  readonly sharedbuffer_write: (a: number, b: number, c: number, d: number) => void;
  readonly sharedbuffer_read: (a: number, b: number, c: number) => void;
  readonly sharedbuffer_reset: (a: number) => void;
  readonly sharedbuffer_position: (a: number) => number;
  readonly sharedbuffer_size: (a: number) => number;
  readonly __wbg_reactiveutils_free: (a: number, b: number) => void;
  readonly reactiveutils_is_shared_memory_available: () => number;
  readonly reactiveutils_is_broadcast_channel_available: () => number;
  readonly reactiveutils_create_change_event: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly reactiveutils_create_update: (a: number, b: number, c: number, d: number) => void;
  readonly init: () => void;
  readonly __wbg_wasmsharedbuffer_free: (a: number, b: number) => void;
  readonly wasmsharedbuffer_new: (a: number) => number;
  readonly wasmsharedbuffer_write: (a: number, b: number, c: number, d: number) => void;
  readonly wasmsharedbuffer_read: (a: number, b: number) => void;
  readonly wasmsharedbuffer_get_ptr: (a: number) => number;
  readonly wasmsharedbuffer_get_size: (a: number) => number;
  readonly wasmsharedbuffer_reset: (a: number) => void;
  readonly __wbindgen_export_0: (a: number, b: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: (a: number) => void;
  readonly __wbindgen_export_3: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_5: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
