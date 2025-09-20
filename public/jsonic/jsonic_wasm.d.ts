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
   * Creates a new database instance
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
   * Update an existing document
   */
  update(id: string, json_str: string): any;
  /**
   * Delete a document
   */
  delete(id: string): any;
  /**
   * Get database statistics
   */
  stats(): any;
  /**
   * List all document IDs
   */
  list_ids(): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_jsondb_free: (a: number, b: number) => void;
  readonly jsondb_new: (a: number) => void;
  readonly jsondb_insert: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_get: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_update: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly jsondb_delete: (a: number, b: number, c: number, d: number) => void;
  readonly jsondb_stats: (a: number, b: number) => void;
  readonly jsondb_list_ids: (a: number, b: number) => void;
  readonly init: () => void;
  readonly __wbindgen_export_0: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_1: (a: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
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
