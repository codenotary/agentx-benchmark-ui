/**
 * Base adapter interface for benchmark databases
 * All adapters must implement these methods for fair comparison
 */
export class DatabaseAdapter {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.type = 'unknown';
    this.features = {
      transactions: false,
      indexes: false,
      sql: false,
      aggregation: false,
      reactive: false
    };
  }

  /**
   * Initialize the database
   */
  async init() {
    throw new Error('init() must be implemented');
  }

  /**
   * Clean up and close the database
   */
  async cleanup() {
    throw new Error('cleanup() must be implemented');
  }

  /**
   * Clear all data
   */
  async clear() {
    throw new Error('clear() must be implemented');
  }

  /**
   * Insert a single document
   */
  async insert(doc) {
    throw new Error('insert() must be implemented');
  }

  /**
   * Insert multiple documents
   */
  async bulkInsert(docs) {
    throw new Error('bulkInsert() must be implemented');
  }

  /**
   * Find documents by query
   */
  async find(query, options = {}) {
    throw new Error('find() must be implemented');
  }

  /**
   * Find one document by query
   */
  async findOne(query) {
    throw new Error('findOne() must be implemented');
  }

  /**
   * Update a document by ID
   */
  async update(id, update) {
    throw new Error('update() must be implemented');
  }

  /**
   * Update multiple documents
   */
  async updateMany(query, update) {
    throw new Error('updateMany() must be implemented');
  }

  /**
   * Delete a document by ID
   */
  async delete(id) {
    throw new Error('delete() must be implemented');
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(query) {
    throw new Error('deleteMany() must be implemented');
  }

  /**
   * Count documents
   */
  async count(query = {}) {
    throw new Error('count() must be implemented');
  }

  /**
   * Create an index
   */
  async createIndex(name, fields) {
    if (!this.features.indexes) {
      return false;
    }
    throw new Error('createIndex() must be implemented');
  }

  /**
   * Execute an aggregation pipeline
   */
  async aggregate(pipeline) {
    if (!this.features.aggregation) {
      throw new Error('Aggregation not supported');
    }
    throw new Error('aggregate() must be implemented');
  }

  /**
   * Begin a transaction
   */
  async beginTransaction() {
    if (!this.features.transactions) {
      throw new Error('Transactions not supported');
    }
    throw new Error('beginTransaction() must be implemented');
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      };
    }
    return null;
  }

  /**
   * Get database statistics
   */
  async getStats() {
    return {
      name: this.name,
      type: this.type,
      features: this.features
    };
  }
}