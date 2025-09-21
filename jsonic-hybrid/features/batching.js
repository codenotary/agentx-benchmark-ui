/**
 * Batch Operations Feature Module
 * Provides high-performance batch insert/update/delete operations
 */

export async function install(jsonicInstance) {
    // Batch insert implementation
    jsonicInstance.insertMany = async function(documents) {
        const startTime = performance.now();
        const insertedIds = [];
        
        try {
            // Use native WASM batch insert if available
            if (this.db.insert_many) {
                const jsonDocs = documents.map(doc => JSON.stringify(doc));
                const result = this.db.insert_many(jsonDocs);
                const parsed = typeof result === 'string' ? JSON.parse(result) : result;
                
                if (parsed.success) {
                    insertedIds.push(...(parsed.data || []));
                }
            } else {
                // Fallback to sequential inserts
                for (const doc of documents) {
                    const id = await this.insert(doc);
                    insertedIds.push(id);
                }
            }
            
            // Invalidate cache
            if (this._cache) {
                this._cache.invalidate();
            }
            
            if (this.options.debug) {
                const duration = performance.now() - startTime;
                console.log(`[JSONIC Hybrid] Batch inserted ${insertedIds.length} documents in ${duration.toFixed(2)}ms`);
            }
            
            return insertedIds;
        } catch (error) {
            console.error('[JSONIC Hybrid] Batch insert failed:', error);
            throw error;
        }
    };
    
    // Batch update implementation
    jsonicInstance.updateMany = async function(filter, update) {
        const startTime = performance.now();
        let matchedCount = 0;
        let modifiedCount = 0;
        
        try {
            // Find matching documents
            const docs = await this.query(filter);
            matchedCount = docs.length;
            
            // Apply updates
            for (const doc of docs) {
                const updatedDoc = applyUpdate(doc, update);
                const success = await this.update(doc.id, updatedDoc);
                if (success) modifiedCount++;
            }
            
            // Invalidate cache
            if (this._cache) {
                this._cache.invalidate();
            }
            
            if (this.options.debug) {
                const duration = performance.now() - startTime;
                console.log(`[JSONIC Hybrid] Batch updated ${modifiedCount}/${matchedCount} documents in ${duration.toFixed(2)}ms`);
            }
            
            return { matchedCount, modifiedCount };
        } catch (error) {
            console.error('[JSONIC Hybrid] Batch update failed:', error);
            throw error;
        }
    };
    
    // Batch delete implementation
    jsonicInstance.deleteMany = async function(filter) {
        const startTime = performance.now();
        let deletedCount = 0;
        
        try {
            // Find matching documents
            const docs = await this.query(filter);
            
            // Delete them
            for (const doc of docs) {
                const success = await this.delete(doc.id);
                if (success) deletedCount++;
            }
            
            // Invalidate cache
            if (this._cache) {
                this._cache.invalidate();
            }
            
            if (this.options.debug) {
                const duration = performance.now() - startTime;
                console.log(`[JSONIC Hybrid] Batch deleted ${deletedCount} documents in ${duration.toFixed(2)}ms`);
            }
            
            return { deletedCount };
        } catch (error) {
            console.error('[JSONIC Hybrid] Batch delete failed:', error);
            throw error;
        }
    };
    
    if (jsonicInstance.options.debug) {
        console.log('[JSONIC Hybrid] Batch operations feature installed');
    }
}

// Helper function to apply MongoDB-style updates
function applyUpdate(doc, update) {
    const updated = { ...doc };
    
    for (const [op, fields] of Object.entries(update)) {
        switch (op) {
            case '$set':
                Object.assign(updated, fields);
                break;
                
            case '$unset':
                for (const field of Object.keys(fields)) {
                    delete updated[field];
                }
                break;
                
            case '$inc':
                for (const [field, value] of Object.entries(fields)) {
                    updated[field] = (updated[field] || 0) + value;
                }
                break;
                
            case '$push':
                for (const [field, value] of Object.entries(fields)) {
                    if (!Array.isArray(updated[field])) {
                        updated[field] = [];
                    }
                    updated[field].push(value);
                }
                break;
                
            case '$pull':
                for (const [field, value] of Object.entries(fields)) {
                    if (Array.isArray(updated[field])) {
                        updated[field] = updated[field].filter(item => item !== value);
                    }
                }
                break;
                
            default:
                // Direct field update
                if (!op.startsWith('$')) {
                    updated[op] = fields;
                }
        }
    }
    
    return updated;
}