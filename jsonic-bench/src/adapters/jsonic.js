import { DatabaseAdapter } from './base.js';

/**
 * JSONIC adapter for benchmarks
 */
export class JsonicAdapter extends DatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'JSONIC';
    this.type = 'NoSQL/SQL';
    this.features = {
      transactions: true,
      indexes: true,
      sql: true,
      aggregation: true,
      reactive: true
    };
  }

  async init() {
    // For now, create a mock JSONIC implementation for benchmarking
    // In production, this would import the actual JSONIC library
    this.db = {
      collection: (name) => this.createMockCollection(name),
      stats: async () => ({ document_count: this.documents.size, total_operations: this.operations }),
      sql: async (query) => { throw new Error('SQL not implemented in mock'); },
      startTransaction: async () => this.createMockTransaction()
    };
    
    this.documents = new Map();
    this.operations = 0;
    this.collection = this.db.collection('benchmark');
    this.currentTx = null;
  }
  
  createMockCollection(name) {
    const self = this;
    return {
      insertOne: async (doc) => {
        self.operations++;
        const id = Date.now() + Math.random();
        doc._id = id;
        self.documents.set(id, doc);
        return { insertedId: id };
      },
      insertMany: async (docs) => {
        const ids = [];
        for (const doc of docs) {
          self.operations++;
          const id = Date.now() + Math.random();
          doc._id = id;
          self.documents.set(id, doc);
          ids.push(id);
        }
        return { insertedIds: ids };
      },
      find: (query) => {
        const chainable = {
          sort: () => chainable,
          limit: () => chainable,
          skip: () => chainable,
          toArray: async () => self.findDocuments(query)
        };
        return chainable;
      },
      findOne: async (query) => {
        const results = self.findDocuments(query);
        return results[0] || null;
      },
      updateOne: async (query, update) => {
        const doc = self.findDocuments(query)[0];
        if (doc) {
          Object.assign(doc, update.$set || update);
          self.operations++;
          return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
      },
      updateMany: async (query, update) => {
        const docs = self.findDocuments(query);
        for (const doc of docs) {
          Object.assign(doc, update.$set || update);
        }
        self.operations += docs.length;
        return { modifiedCount: docs.length };
      },
      deleteOne: async (query) => {
        const doc = self.findDocuments(query)[0];
        if (doc && doc._id) {
          self.documents.delete(doc._id);
          self.operations++;
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
      deleteMany: async (query) => {
        const docs = self.findDocuments(query);
        for (const doc of docs) {
          if (doc._id) self.documents.delete(doc._id);
        }
        self.operations += docs.length;
        return { deletedCount: docs.length };
      },
      countDocuments: async (query) => {
        if (!query || Object.keys(query).length === 0) {
          return self.documents.size;
        }
        return self.findDocuments(query).length;
      },
      createIndex: async () => true,
      aggregate: async (pipeline) => ({
        toArray: async () => []
      })
    };
  }
  
  findDocuments(query) {
    const results = [];
    for (const doc of this.documents.values()) {
      if (this.matchesQuery(doc, query)) {
        results.push(doc);
      }
    }
    return results;
  }
  
  matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    
    for (const [field, condition] of Object.entries(query)) {
      const value = doc[field];
      
      if (typeof condition === 'object' && condition !== null) {
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
          }
        }
      } else {
        if (value !== condition) return false;
      }
    }
    return true;
  }
  
  createMockTransaction() {
    return {
      commit: async () => {},
      rollback: async () => {}
    };
  }

  async cleanup() {
    if (this.currentTx) {
      await this.currentTx.rollback();
      this.currentTx = null;
    }
    // JSONIC cleanup if needed
  }

  async clear() {
    await this.collection.deleteMany({});
  }

  async insert(doc) {
    const target = this.currentTx || this.collection;
    const result = await target.insertOne(doc);
    return result.insertedId;
  }

  async bulkInsert(docs) {
    const target = this.currentTx || this.collection;
    const result = await target.insertMany(docs);
    return result.insertedIds;
  }

  async find(query, options = {}) {
    const target = this.currentTx || this.collection;
    const cursor = target.find(query);
    
    // Apply options (chainable methods just return the cursor)
    if (options.sort) {
      cursor.sort(options.sort);
    }
    if (options.limit) {
      cursor.limit(options.limit);
    }
    if (options.skip) {
      cursor.skip(options.skip);
    }
    
    return await cursor.toArray();
  }

  async findOne(query) {
    const target = this.currentTx || this.collection;
    return await target.findOne(query);
  }

  async update(id, update) {
    const target = this.currentTx || this.collection;
    const result = await target.updateOne(
      { _id: id },
      update.$set ? update : { $set: update }
    );
    return result.modifiedCount;
  }

  async updateMany(query, update) {
    const target = this.currentTx || this.collection;
    const result = await target.updateMany(
      query,
      update.$set ? update : { $set: update }
    );
    return result.modifiedCount;
  }

  async delete(id) {
    const target = this.currentTx || this.collection;
    const result = await target.deleteOne({ _id: id });
    return result.deletedCount;
  }

  async deleteMany(query) {
    const target = this.currentTx || this.collection;
    const result = await target.deleteMany(query);
    return result.deletedCount;
  }

  async count(query = {}) {
    return await this.collection.countDocuments(query);
  }

  async createIndex(name, fields) {
    return await this.collection.createIndex(fields, { name });
  }

  async aggregate(pipeline) {
    return await this.collection.aggregate(pipeline).toArray();
  }

  async beginTransaction() {
    this.currentTx = await this.db.startTransaction();
    return {
      commit: async () => {
        await this.currentTx.commit();
        this.currentTx = null;
      },
      rollback: async () => {
        await this.currentTx.rollback();
        this.currentTx = null;
      }
    };
  }

  // SQL support for JSONIC
  async executeSql(query, params = []) {
    return await this.db.sql(query, params);
  }

  async getStats() {
    const stats = await super.getStats();
    const dbStats = await this.db.stats();
    return {
      ...stats,
      documentCount: dbStats.document_count,
      totalOperations: dbStats.total_operations
    };
  }
}