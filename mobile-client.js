/**
 * Mobile-optimized client for JSONIC
 * Provides a facade that delegates all operations to a Web Worker
 */
export class MobileJSONIC {
    constructor(config = {}) {
        this.worker = null;
        this.messageId = 0;
        this.pendingMessages = new Map();
        this.isReady = false;
        this.config = {
            enableWorker: true,
            workerPath: './mobile-worker.js',
            maxMemoryMB: 50,
            enablePersistence: true,
            persistenceAdapter: 'indexeddb',
            ...config
        };
        this.readyPromise = new Promise(resolve => {
            this.readyResolver = resolve;
        });
        if (this.config.enableWorker && typeof Worker !== 'undefined') {
            this.initWorker();
        }
    }
    /**
     * Initialize the Web Worker
     */
    initWorker() {
        try {
            this.worker = new Worker(new URL('./mobile-worker.ts', import.meta.url), { type: 'module' });
            this.worker.onmessage = (event) => {
                this.handleWorkerMessage(event.data);
            };
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                // Fallback to main thread if worker fails
                this.worker = null;
            };
            // Initialize the worker
            this.sendToWorker('init', {
                mobile: true,
                maxMemoryMB: this.config.maxMemoryMB
            }).then(() => {
                this.isReady = true;
                this.readyResolver();
            });
        }
        catch (error) {
            console.warn('Failed to create worker, falling back to main thread:', error);
            this.worker = null;
            this.isReady = true;
            this.readyResolver();
        }
    }
    /**
     * Send message to worker and return promise
     */
    sendToWorker(type, payload) {
        return new Promise((resolve, reject) => {
            const id = `msg_${++this.messageId}`;
            this.pendingMessages.set(id, { resolve, reject });
            if (this.worker) {
                this.worker.postMessage({ id, type, payload });
            }
            else {
                // Fallback: execute on main thread
                // This would use the regular JSONIC API
                reject(new Error('Worker not available, main thread fallback not implemented'));
            }
        });
    }
    /**
     * Handle messages from worker
     */
    handleWorkerMessage(data) {
        const { id, type, payload } = data;
        if (type === 'memory-warning') {
            console.warn('Memory pressure detected:', payload);
            // Could trigger UI notification
            this.onMemoryWarning?.(payload);
            return;
        }
        const pending = this.pendingMessages.get(id);
        if (pending) {
            if (type === 'success') {
                pending.resolve(payload);
            }
            else {
                pending.reject(new Error(payload));
            }
            this.pendingMessages.delete(id);
        }
    }
    /**
     * Wait for initialization to complete
     */
    async waitForReady() {
        return this.readyPromise;
    }
    /**
     * Collection factory with mobile optimizations
     */
    collection(name, options) {
        return new MobileCollection(this, name, options);
    }
    /**
     * Insert a document
     */
    async insert(data) {
        await this.waitForReady();
        const result = await this.sendToWorker('insert', data);
        return JSON.parse(result).data;
    }
    /**
     * Find documents with automatic pagination for mobile
     */
    async find(query = {}, options = {}) {
        await this.waitForReady();
        // Default to smaller page sizes on mobile
        const mobileOptions = {
            limit: options.limit || 50,
            offset: options.offset || 0
        };
        const result = await this.sendToWorker('find', {
            query,
            ...mobileOptions
        });
        return JSON.parse(result).data;
    }
    /**
     * Update a document
     */
    async update(id, data) {
        await this.waitForReady();
        const result = await this.sendToWorker('update', { id, data });
        return JSON.parse(result).success;
    }
    /**
     * Delete a document
     */
    async delete(id) {
        await this.waitForReady();
        const result = await this.sendToWorker('delete', { id });
        return JSON.parse(result).success;
    }
    /**
     * Batch operations for better performance
     */
    async batch(operations) {
        await this.waitForReady();
        const result = await this.sendToWorker('batch', operations);
        return JSON.parse(result).data;
    }
    /**
     * Create index
     */
    async createIndex(name, fields) {
        await this.waitForReady();
        await this.sendToWorker('createIndex', { name, fields });
    }
    /**
     * Cleanup and close
     */
    async close() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingMessages.clear();
    }
}
/**
 * Mobile-optimized collection
 */
export class MobileCollection {
    constructor(db, name, options) {
        this.db = db;
        this.name = name;
        this.options = options;
    }
    /**
     * Insert one document
     */
    async insertOne(doc) {
        const id = await this.db.insert({ ...doc, _collection: this.name });
        return { id };
    }
    /**
     * Insert many documents in batch
     */
    async insertMany(docs) {
        const operations = docs.map(doc => ({
            type: 'insert',
            data: { ...doc, _collection: this.name }
        }));
        const results = await this.db.batch(operations);
        const ids = results.map(r => r.result);
        return { ids };
    }
    /**
     * Find documents with mobile-friendly pagination
     */
    async find(query = {}, options = {}) {
        return this.db.find({ ...query, _collection: this.name }, { limit: options.limit, offset: options.skip });
    }
    /**
     * Find one document
     */
    async findOne(query = {}) {
        const results = await this.find(query, { limit: 1 });
        return results[0] || null;
    }
    /**
     * Update one document
     */
    async updateOne(filter, update) {
        const doc = await this.findOne(filter);
        if (!doc) {
            return { modifiedCount: 0 };
        }
        const success = await this.db.update(doc.id, {
            ...doc,
            ...update,
            _collection: this.name
        });
        return { modifiedCount: success ? 1 : 0 };
    }
    /**
     * Delete one document
     */
    async deleteOne(filter) {
        const doc = await this.findOne(filter);
        if (!doc) {
            return { deletedCount: 0 };
        }
        const success = await this.db.delete(doc.id);
        return { deletedCount: success ? 1 : 0 };
    }
    /**
     * Count documents (with estimation for large collections)
     */
    async countDocuments(filter = {}) {
        // For mobile, we might want to return an estimate for large collections
        const results = await this.find(filter, { limit: 1000 });
        if (results.length === 1000) {
            // Return estimate indicator
            console.warn('Count exceeded mobile limit, returning estimate');
            return 1000; // Or implement proper count estimation
        }
        return results.length;
    }
}
// Auto-detect mobile and export appropriate client
export function createJSONIC(config) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('Mobile device detected, using optimized client');
        return new MobileJSONIC({
            ...config,
            maxMemoryMB: 30, // Lower memory limit for mobile
        });
    }
    return new MobileJSONIC(config);
}
//# sourceMappingURL=mobile-client.js.map