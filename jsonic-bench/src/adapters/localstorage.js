import { DatabaseAdapter } from './base.js';

/**
 * LocalStorage adapter for benchmarks
 * Note: LocalStorage is synchronous and has size limits (~5-10MB)
 */
export class LocalStorageAdapter extends DatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'LocalStorage';
    this.type = 'Key-Value';
    this.features = {
      transactions: false,
      indexes: false,
      sql: false,
      aggregation: false,
      reactive: false
    };
    this.prefix = config.name || 'benchmark';
    this.indexKey = `${this.prefix}_index`;
    this.dataKey = `${this.prefix}_data`;
    this.counterKey = `${this.prefix}_counter`;
  }

  async init() {
    // Initialize index and counter
    if (!localStorage.getItem(this.indexKey)) {
      localStorage.setItem(this.indexKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.counterKey)) {
      localStorage.setItem(this.counterKey, '0');
    }
  }

  async cleanup() {
    // No cleanup needed for localStorage
  }

  async clear() {
    // Clear all data with our prefix
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reinitialize
    await this.init();
  }

  async insert(doc) {
    // Get next ID
    const counter = parseInt(localStorage.getItem(this.counterKey)) + 1;
    localStorage.setItem(this.counterKey, counter.toString());
    
    // Add ID to document
    doc._id = counter;
    
    // Store document
    const docKey = `${this.dataKey}_${counter}`;
    localStorage.setItem(docKey, JSON.stringify(doc));
    
    // Update index
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    index.push(counter);
    localStorage.setItem(this.indexKey, JSON.stringify(index));
    
    return counter;
  }

  async bulkInsert(docs) {
    const ids = [];
    
    // Get current counter
    let counter = parseInt(localStorage.getItem(this.counterKey));
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    
    for (const doc of docs) {
      counter++;
      doc._id = counter;
      
      // Store document
      const docKey = `${this.dataKey}_${counter}`;
      localStorage.setItem(docKey, JSON.stringify(doc));
      
      index.push(counter);
      ids.push(counter);
    }
    
    // Update counter and index
    localStorage.setItem(this.counterKey, counter.toString());
    localStorage.setItem(this.indexKey, JSON.stringify(index));
    
    return ids;
  }

  async find(query, options = {}) {
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    const results = [];
    
    // Load all documents and filter
    for (const id of index) {
      const docKey = `${this.dataKey}_${id}`;
      const docStr = localStorage.getItem(docKey);
      
      if (docStr) {
        const doc = JSON.parse(docStr);
        
        if (this.matchesQuery(doc, query)) {
          results.push(doc);
        }
      }
    }
    
    // Apply sorting
    if (options.sort) {
      this.sortResults(results, options.sort);
    }
    
    // Apply skip and limit
    const skip = options.skip || 0;
    const limit = options.limit || results.length;
    
    return results.slice(skip, skip + limit);
  }

  async findOne(query) {
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    
    for (const id of index) {
      const docKey = `${this.dataKey}_${id}`;
      const docStr = localStorage.getItem(docKey);
      
      if (docStr) {
        const doc = JSON.parse(docStr);
        
        if (this.matchesQuery(doc, query)) {
          return doc;
        }
      }
    }
    
    return null;
  }

  async update(id, update) {
    const docKey = `${this.dataKey}_${id}`;
    const docStr = localStorage.getItem(docKey);
    
    if (!docStr) {
      return 0;
    }
    
    let doc = JSON.parse(docStr);
    
    // Apply update
    if (update.$set) {
      doc = { ...doc, ...update.$set };
    } else if (update.$inc) {
      for (const [field, value] of Object.entries(update.$inc)) {
        doc[field] = (doc[field] || 0) + value;
      }
    } else {
      doc = { ...doc, ...update };
    }
    
    // Keep the ID
    doc._id = id;
    
    // Save updated document
    localStorage.setItem(docKey, JSON.stringify(doc));
    
    return 1;
  }

  async updateMany(query, update) {
    const docs = await this.find(query);
    let modified = 0;
    
    for (const doc of docs) {
      const result = await this.update(doc._id, update);
      modified += result;
    }
    
    return modified;
  }

  async delete(id) {
    const docKey = `${this.dataKey}_${id}`;
    
    if (!localStorage.getItem(docKey)) {
      return 0;
    }
    
    // Remove document
    localStorage.removeItem(docKey);
    
    // Update index
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    const newIndex = index.filter(i => i !== id);
    localStorage.setItem(this.indexKey, JSON.stringify(newIndex));
    
    return 1;
  }

  async deleteMany(query) {
    const docs = await this.find(query);
    let deleted = 0;
    
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    const idsToDelete = docs.map(d => d._id);
    
    // Remove documents
    for (const id of idsToDelete) {
      const docKey = `${this.dataKey}_${id}`;
      localStorage.removeItem(docKey);
      deleted++;
    }
    
    // Update index
    const newIndex = index.filter(id => !idsToDelete.includes(id));
    localStorage.setItem(this.indexKey, JSON.stringify(newIndex));
    
    return deleted;
  }

  async count(query = {}) {
    if (Object.keys(query).length === 0) {
      const index = JSON.parse(localStorage.getItem(this.indexKey));
      return index.length;
    } else {
      const docs = await this.find(query);
      return docs.length;
    }
  }

  // Helper methods
  matchesQuery(doc, query) {
    for (const [field, condition] of Object.entries(query)) {
      const value = doc[field];
      
      if (typeof condition === 'object') {
        // Handle operators
        for (const [op, opValue] of Object.entries(condition)) {
          switch (op) {
            case '$gt':
              if (!(value > opValue)) return false;
              break;
            case '$gte':
              if (!(value >= opValue)) return false;
              break;
            case '$lt':
              if (!(value < opValue)) return false;
              break;
            case '$lte':
              if (!(value <= opValue)) return false;
              break;
            case '$ne':
              if (value === opValue) return false;
              break;
            case '$in':
              if (!opValue.includes(value)) return false;
              break;
            case '$nin':
              if (opValue.includes(value)) return false;
              break;
          }
        }
      } else {
        // Simple equality
        if (value !== condition) return false;
      }
    }
    
    return true;
  }

  sortResults(results, sortSpec) {
    const fields = Object.entries(sortSpec);
    
    results.sort((a, b) => {
      for (const [field, order] of fields) {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return order === 1 ? -1 : 1;
        if (aVal > bVal) return order === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  async getStats() {
    const stats = await super.getStats();
    const index = JSON.parse(localStorage.getItem(this.indexKey));
    
    // Calculate storage size
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + value.length;
      }
    }
    
    return {
      ...stats,
      documentCount: index.length,
      storageSize: totalSize,
      storageSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }
}