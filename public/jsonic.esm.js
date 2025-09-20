/**
 * JSONIC ES Module Build
 * Modern ES6 module that works with Vite, Webpack, and other bundlers
 * 
 * Usage:
 *   import JSONIC from './jsonic.esm.js';
 *   const db = await JSONIC.createDatabase();
 */

// Configuration - can be overridden by bundler
const CONFIG = {
    wasmUrl: './jsonic_wasm_bg.wasm',
    debug: false
};

let wasmModule = null;
let wasmInstance = null;
let initPromise = null;

// Helper functions for WASM interaction
const heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasmInstance.exports.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;
let cachedTextEncoder = new TextEncoder();

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);
    const mem = getUint8Memory0();
    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);
        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;
function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasmInstance.exports.memory.buffer);
    }
    return cachedInt32Memory0;
}

// WASM initialization
async function initWasm(wasmUrl = CONFIG.wasmUrl) {
    if (wasmModule) return wasmModule;

    if (CONFIG.debug) console.log('[JSONIC] Loading WASM from:', wasmUrl);

    try {
        // Fetch and compile WASM
        let compiledModule;
        
        if (WebAssembly.compileStreaming) {
            const response = await fetch(wasmUrl);
            compiledModule = await WebAssembly.compileStreaming(response);
        } else {
            const response = await fetch(wasmUrl);
            const buffer = await response.arrayBuffer();
            compiledModule = await WebAssembly.compile(buffer);
        }

        // Set up imports
        const imports = {
            wbg: {
                __wbindgen_object_drop_ref: function(arg0) {
                    takeObject(arg0);
                },
                __wbindgen_string_new: function(arg0, arg1) {
                    const ret = getStringFromWasm0(arg0, arg1);
                    return addHeapObject(ret);
                },
                __wbindgen_json_parse: function(arg0, arg1) {
                    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
                    return addHeapObject(ret);
                },
                __wbindgen_json_serialize: function(arg0, arg1) {
                    const obj = getObject(arg1);
                    const ret = JSON.stringify(obj === undefined ? null : obj);
                    const ptr = passStringToWasm0(ret, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
                    const len = WASM_VECTOR_LEN;
                    getInt32Memory0()[arg0 / 4 + 1] = len;
                    getInt32Memory0()[arg0 / 4 + 0] = ptr;
                },
                __wbindgen_throw: function(arg0, arg1) {
                    throw new Error(getStringFromWasm0(arg0, arg1));
                },
                __wbg_log_3e0436a57e0e1842: function(arg0, arg1) {
                    if (CONFIG.debug) console.log(getStringFromWasm0(arg0, arg1));
                },
                __wbg_now_58886682b7e790d7: function() {
                    return Date.now();
                }
            }
        };

        // Instantiate module
        const instance = await WebAssembly.instantiate(compiledModule, imports);
        wasmInstance = instance;
        wasmModule = compiledModule;

        if (CONFIG.debug) console.log('[JSONIC] WASM initialized');
        return wasmModule;
    } catch (error) {
        console.error('[JSONIC] Failed to initialize WASM:', error);
        throw error;
    }
}

// JsonDB class
class JsonDB {
    constructor() {
        this._ptr = 0;
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return;

        await initWasm();
        
        // Create new instance
        const ret = wasmInstance.exports.jsondb_new();
        this._ptr = ret >>> 0;
        this._initialized = true;
    }

    free() {
        if (this._ptr === 0) return;
        wasmInstance.exports.__wbg_jsondb_free(this._ptr);
        this._ptr = 0;
    }

    async insert(data) {
        await this.init();
        const json = typeof data === 'string' ? data : JSON.stringify(data);
        const ptr0 = passStringToWasm0(json, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasmInstance.exports.jsondb_insert(this._ptr, ptr0, len0);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) throw new Error(parsed.error || 'Insert failed');
            return parsed.data;
        }
        return result;
    }

    async get(id) {
        await this.init();
        const ptr0 = passStringToWasm0(id, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasmInstance.exports.jsondb_get(this._ptr, ptr0, len0);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) {
                if (parsed.error && parsed.error.includes('not found')) return null;
                throw new Error(parsed.error || 'Get failed');
            }
            return parsed.data;
        }
        return result;
    }

    async update(id, data) {
        await this.init();
        const json = typeof data === 'string' ? data : JSON.stringify(data);
        const ptr0 = passStringToWasm0(id, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(json, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasmInstance.exports.jsondb_update(this._ptr, ptr0, len0, ptr1, len1);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) throw new Error(parsed.error || 'Update failed');
            return true;
        }
        return result;
    }

    async delete(id) {
        await this.init();
        const ptr0 = passStringToWasm0(id, wasmInstance.exports.__wbindgen_malloc, wasmInstance.exports.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasmInstance.exports.jsondb_delete(this._ptr, ptr0, len0);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) throw new Error(parsed.error || 'Delete failed');
            return true;
        }
        return result;
    }

    async list() {
        await this.init();
        const ret = wasmInstance.exports.jsondb_list_ids(this._ptr);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) throw new Error(parsed.error || 'List failed');
            return parsed.data;
        }
        return result;
    }

    async stats() {
        await this.init();
        const ret = wasmInstance.exports.jsondb_stats(this._ptr);
        const result = takeObject(ret);
        
        if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (!parsed.success) throw new Error(parsed.error || 'Stats failed');
            return parsed.data;
        }
        return result;
    }
}

// Factory function
async function createDatabase() {
    const db = new JsonDB();
    await db.init();
    return db;
}

// Export as default and named exports
const JSONIC = {
    createDatabase,
    JsonDB,
    configure: (options) => Object.assign(CONFIG, options),
    version: '0.2.0'
};

// For UMD compatibility when loaded as script
if (typeof window !== 'undefined') {
    window.JSONIC = JSONIC;
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('jsonic-ready', { detail: JSONIC }));
    // Set ready promise
    window.JSONIC_READY = Promise.resolve(JSONIC);
}

export { createDatabase, JsonDB, CONFIG };
export default JSONIC;