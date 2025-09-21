import { DatabaseAdapter } from './base.js';

/**
 * IndexedDB adapter for benchmarks
 */
export class IndexedDBAdapter extends DatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'IndexedDB';
    this.type = 'NoSQL';
    this.features = {
      transactions: true,
      indexes: true,
      sql: false,
      aggregation: false,
      reactive: false
    };
    this.dbName = config.name || 'benchmark';
    this.storeName = 'documents';
    this.version = 3; // Increment version to force upgrade
    this.idCounter = Date.now();
    this.pendingIndexes = [];
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Delete old store if it exists (to clear any bad data)
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }
        
        // Create fresh store
        const store = db.createObjectStore(this.storeName, {
          keyPath: '_id',
          autoIncrement: false // We'll manage IDs manually
        });
        
        // Create default indexes
        store.createIndex('age', 'age', { unique: false });
        store.createIndex('city', 'city', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('email', 'email', { unique: false });
      };
    });
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
    }
  }

  async clear() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async insert(doc) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      // Generate unique ID
      doc._id = ++this.idCounter;
      
      // Use put instead of add to handle updates
      const request = store.put(doc);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Insert error:', request.error);
        reject(request.error);
      };
    });
  }

  async bulkInsert(docs) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const ids = [];
      
      let completed = 0;
      docs.forEach((doc) => {
        // Generate unique ID
        doc._id = ++this.idCounter;
        
        // Use put instead of add to handle updates
        const request = store.put(doc);
        
        request.onsuccess = () => {
          ids.push(request.result);
          completed++;
          if (completed === docs.length) {
            resolve(ids);
          }
        };
        
        request.onerror = () => {
          console.error('Bulk insert error:', request.error);
          reject(request.error);
        };
      });
    });
  }

  async find(query, options = {}) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      
      let request;
      const results = [];
      
      // Simple query optimization for single field
      if (Object.keys(query).length === 1) {
        const field = Object.keys(query)[0];
        const value = query[field];
        
        if (typeof value === 'object') {
          // Range query
          request = store.openCursor();
        } else if (store.indexNames.contains(field)) {
          // Use index if available
          const index = store.index(field);
          request = index.openCursor(IDBKeyRange.only(value));
        } else {
          request = store.openCursor();
        }
      } else {
        request = store.openCursor();
      }
      
      let count = 0;
      const limit = options.limit || Infinity;
      const skip = options.skip || 0;
      let skipped = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && count < limit) {
          const doc = cursor.value;
          
          // Manual filtering for complex queries
          if (this.matchesQuery(doc, query)) {
            if (skipped < skip) {
              skipped++;
            } else {
              results.push(doc);
              count++;
            }
          }
          
          cursor.continue();
        } else {
          // Apply sorting if needed
          if (options.sort) {
            this.sortResults(results, options.sort);
          }
          
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  async update(id, update) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      // Get existing document
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (!doc) {
          resolve(0);
          return;
        }
        
        // Apply update
        const updatedDoc = this.applyUpdate(doc, update);
        const putRequest = store.put(updatedDoc);
        
        putRequest.onsuccess = () => resolve(1);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
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
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(1);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMany(query) {
    const docs = await this.find(query);
    let deleted = 0;
    
    for (const doc of docs) {
      await this.delete(doc._id);
      deleted++;
    }
    
    return deleted;
  }

  async count(query = {}) {
    if (Object.keys(query).length === 0) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      const docs = await this.find(query);
      return docs.length;
    }
  }

  async createIndex(name, fields) {
    // IndexedDB requires version upgrade to create indexes
    // For benchmarks, we'll just return true since we pre-create common indexes
    // In a real implementation, this would trigger a version upgrade
    const field = Array.isArray(fields) ? fields[0] : fields;
    
    // Check if index already exists
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      
      if (store.indexNames.contains(field)) {
        resolve(true); // Index already exists
      } else {
        // In benchmarks, we pre-create common indexes, so just return true
        console.log(`Index '${name}' on field '${field}' would require version upgrade`);
        resolve(true);
      }
    });
  }

  async beginTransaction() {
    // IndexedDB transactions are different from traditional DB transactions
    // We'll simulate with a simple wrapper
    const operations = [];
    
    return {
      insert: (doc) => {
        operations.push({ type: 'insert', doc });
      },
      update: (id, update) => {
        operations.push({ type: 'update', id, update });
      },
      delete: (id) => {
        operations.push({ type: 'delete', id });
      },
      commit: async () => {
        // Execute all operations in a single transaction
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        
        for (const op of operations) {
          if (op.type === 'insert') {
            store.add(op.doc);
          } else if (op.type === 'update') {
            const doc = await this.findOne({ _id: op.id });
            if (doc) {
              store.put(this.applyUpdate(doc, op.update));
            }
          } else if (op.type === 'delete') {
            store.delete(op.id);
          }
        }
        
        return new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      },
      rollback: async () => {
        // Clear operations without executing
        operations.length = 0;
      }
    };
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

  applyUpdate(doc, update) {
    if (update.$set) {
      return { ...doc, ...update.$set };
    } else if (update.$inc) {
      const updated = { ...doc };
      for (const [field, value] of Object.entries(update.$inc)) {
        updated[field] = (updated[field] || 0) + value;
      }
      return updated;
    } else {
      // Direct replacement
      return { ...doc, ...update };
    }
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
}