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
   * Query documents with options (sort, projection, etc.) - optimized version
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
  readonly __wbindgen_export_2: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_3: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
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
