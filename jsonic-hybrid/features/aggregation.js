/**
 * Aggregation Pipeline Feature Module
 * Provides MongoDB-style aggregation operations
 */

export async function install(jsonicInstance) {
    jsonicInstance.aggregate = async function(pipeline) {
        const startTime = performance.now();
        
        try {
            // Start with all documents
            let results = await this.list();
            results = await Promise.all(results.map(id => this.get(id).then(doc => ({ id, ...doc }))));
            
            // Process pipeline stages
            for (const stage of pipeline) {
                const [op, params] = Object.entries(stage)[0];
                
                switch (op) {
                    case '$match':
                        results = results.filter(doc => this._matchesFilter(doc, params));
                        break;
                    
                    case '$group':
                        results = groupDocuments(results, params);
                        break;
                    
                    case '$sort':
                        results = sortDocuments(results, params);
                        break;
                    
                    case '$limit':
                        results = results.slice(0, params);
                        break;
                    
                    case '$skip':
                        results = results.slice(params);
                        break;
                    
                    case '$project':
                        results = results.map(doc => projectDocument(doc, params));
                        break;
                    
                    default:
                        console.warn(`[JSONIC Hybrid] Unknown aggregation operator: ${op}`);
                }
            }
            
            if (this.options.debug) {
                const duration = performance.now() - startTime;
                console.log(`[JSONIC Hybrid] Aggregation pipeline completed in ${duration.toFixed(2)}ms`);
            }
            
            return results;
        } catch (error) {
            console.error('[JSONIC Hybrid] Aggregation failed:', error);
            throw error;
        }
    };
    
    if (jsonicInstance.options.debug) {
        console.log('[JSONIC Hybrid] Aggregation feature installed');
    }
}

function groupDocuments(documents, groupSpec) {
    const groups = new Map();
    
    for (const doc of documents) {
        const key = groupSpec._id === null ? 'null' : doc[groupSpec._id];
        
        if (!groups.has(key)) {
            groups.set(key, { _id: key });
        }
        
        const group = groups.get(key);
        
        // Apply accumulators
        for (const [field, accumulator] of Object.entries(groupSpec)) {
            if (field === '_id') continue;
            
            const [op, sourceField] = Object.entries(accumulator)[0];
            
            switch (op) {
                case '$sum':
                    group[field] = (group[field] || 0) + (sourceField === 1 ? 1 : doc[sourceField] || 0);
                    break;
                    
                case '$avg':
                    if (!group[`_${field}_sum`]) {
                        group[`_${field}_sum`] = 0;
                        group[`_${field}_count`] = 0;
                    }
                    group[`_${field}_sum`] += doc[sourceField] || 0;
                    group[`_${field}_count`]++;
                    group[field] = group[`_${field}_sum`] / group[`_${field}_count`];
                    break;
                    
                case '$min':
                    if (group[field] === undefined || doc[sourceField] < group[field]) {
                        group[field] = doc[sourceField];
                    }
                    break;
                    
                case '$max':
                    if (group[field] === undefined || doc[sourceField] > group[field]) {
                        group[field] = doc[sourceField];
                    }
                    break;
                    
                case '$push':
                    if (!group[field]) group[field] = [];
                    group[field].push(doc[sourceField]);
                    break;
            }
        }
    }
    
    // Clean up internal fields
    for (const group of groups.values()) {
        for (const key of Object.keys(group)) {
            if (key.startsWith('_') && key !== '_id') {
                delete group[key];
            }
        }
    }
    
    return Array.from(groups.values());
}

function sortDocuments(documents, sortSpec) {
    return documents.sort((a, b) => {
        for (const [field, order] of Object.entries(sortSpec)) {
            const diff = (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0);
            if (diff !== 0) return diff * order;
        }
        return 0;
    });
}

function projectDocument(doc, projection) {
    const projected = {};
    
    for (const [field, value] of Object.entries(projection)) {
        if (value === 1 || value === true) {
            projected[field] = doc[field];
        } else if (typeof value === 'string' && value.startsWith('$')) {
            // Field reference
            projected[field] = doc[value.substring(1)];
        }
    }
    
    return projected;
}