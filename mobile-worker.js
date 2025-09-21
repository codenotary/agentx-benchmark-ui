/**
 * Mobile-optimized Web Worker for JSONIC
 * Handles all database operations off the main thread for better mobile performance
 */
/// <reference lib="webworker" />
// Dynamic import to avoid blocking
let JsonDB = null;
let db = null;
// Memory threshold for mobile devices (in MB)
const MOBILE_MEMORY_THRESHOLD = 50;
let currentMemoryUsage = 0;
// Batch operation queue for better performance
const operationQueue = [];
let isProcessingQueue = false;
/**
 * Initialize the database with mobile-specific optimizations
 */
async function initDatabase(config) {
    try {
        // Lazy load the WASM module
        const wasmModule = await import('../pkg/jsonic_wasm');
        await wasmModule.default();
        JsonDB = wasmModule.JsonDB;
        db = new JsonDB();
        await db.init();
        // Configure for mobile: smaller cache, more aggressive cleanup
        if (config.mobile) {
            // Set smaller buffer sizes for mobile
            db.set_buffer_size?.(1024 * 1024); // 1MB instead of default
        }
        return { success: true };
    }
    catch (error) {
        console.error('Worker init error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Process a batch of operations efficiently
 */
async function processBatch(operations) {
    const results = [];
    for (const op of operations) {
        try {
            let result;
            switch (op.type) {
                case 'insert':
                    result = await db.insert(JSON.stringify(op.data));
                    break;
                case 'update':
                    result = await db.update(op.id, JSON.stringify(op.data));
                    break;
                case 'delete':
                    result = await db.delete(op.id);
                    break;
                default:
                    throw new Error(`Unknown batch operation: ${op.type}`);
            }
            results.push({ success: true, result });
        }
        catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    return results;
}
/**
 * Estimate memory usage of data
 */
function estimateMemoryUsage(data) {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size / (1024 * 1024); // Convert to MB
}
/**
 * Check if we should trigger memory cleanup
 */
function checkMemoryPressure() {
    if (currentMemoryUsage > MOBILE_MEMORY_THRESHOLD) {
        // Trigger cleanup
        if (db?.compact) {
            db.compact();
        }
        // Clear any caches
        operationQueue.length = 0;
        // Notify main thread
        self.postMessage({
            type: 'memory-warning',
            payload: { usage: currentMemoryUsage, threshold: MOBILE_MEMORY_THRESHOLD }
        });
    }
}
/**
 * Process operation queue with throttling
 */
async function processQueue() {
    if (isProcessingQueue || operationQueue.length === 0) {
        return;
    }
    isProcessingQueue = true;
    // Process in chunks to avoid blocking
    const CHUNK_SIZE = 10;
    const chunk = operationQueue.splice(0, CHUNK_SIZE);
    for (const message of chunk) {
        await handleMessage(message);
    }
    isProcessingQueue = false;
    // Continue processing if more items
    if (operationQueue.length > 0) {
        setTimeout(() => processQueue(), 10);
    }
}
/**
 * Handle incoming messages from main thread
 */
async function handleMessage(message) {
    const { id, type, payload } = message;
    try {
        let result;
        switch (type) {
            case 'init':
                result = await initDatabase(payload);
                break;
            case 'insert':
                // Estimate memory impact
                currentMemoryUsage += estimateMemoryUsage(payload);
                checkMemoryPressure();
                result = await db.insert(JSON.stringify(payload));
                break;
            case 'find':
                // Implement pagination for mobile
                const { query, limit = 100, offset = 0 } = payload;
                // Use query_with_options for pagination
                const options = {
                    limit: Math.min(limit, 100), // Cap at 100 for mobile
                    skip: offset
                };
                result = await db.query_with_options(JSON.stringify(query), JSON.stringify(options));
                break;
            case 'update':
                result = await db.update(payload.id, JSON.stringify(payload.data));
                break;
            case 'delete':
                result = await db.delete(payload.id);
                currentMemoryUsage = Math.max(0, currentMemoryUsage - estimateMemoryUsage(payload));
                break;
            case 'aggregate':
                // Warn about heavy operation on mobile
                if (currentMemoryUsage > MOBILE_MEMORY_THRESHOLD * 0.8) {
                    throw new Error('Memory usage too high for aggregation. Please reduce dataset size.');
                }
                result = await db.aggregate(JSON.stringify(payload));
                break;
            case 'createIndex':
                result = await db.create_index(payload.name, JSON.stringify(payload.fields));
                break;
            case 'batch':
                result = await processBatch(payload);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
        // Send success response
        self.postMessage({
            id,
            type: 'success',
            payload: result
        });
    }
    catch (error) {
        // Send error response
        self.postMessage({
            id,
            type: 'error',
            payload: error.message
        });
    }
}
// Main message handler
self.onmessage = async (event) => {
    const message = event.data;
    // Queue operations to avoid overwhelming mobile CPU
    if (message.type !== 'init' && message.type !== 'find') {
        operationQueue.push(message);
        processQueue();
    }
    else {
        // Process immediately for init and read operations
        await handleMessage(message);
    }
};
// Listen for memory pressure events (where supported)
// @ts-ignore - Not all browsers support this
if (self.addEventListener) {
    // @ts-ignore
    self.addEventListener('memorywarning', () => {
        checkMemoryPressure();
    });
}
export {};
//# sourceMappingURL=mobile-worker.js.map