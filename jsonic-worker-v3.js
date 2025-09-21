/**
 * JSONIC v3.1 Web Worker with Batch Operations and Memory Management
 * Optimized for mobile and desktop performance
 */

importScripts('./jsonic-wrapper-v3.esm.js');

let db = null;
let memoryMonitor = null;
let batchQueue = [];
let batchTimeout = null;
const BATCH_SIZE = 50;
const BATCH_DELAY = 100; // ms

// Memory monitoring for mobile devices
class MemoryMonitor {
  constructor(limit = 50 * 1024 * 1024) { // 50MB default for mobile
    this.limit = limit;
    this.checkInterval = 5000; // Check every 5 seconds
    this.warningThreshold = 0.8; // Warn at 80% usage
    this.criticalThreshold = 0.95; // Critical at 95% usage
    this.lastCheck = Date.now();
    this.memoryPressureCallbacks = [];
  }

  async checkMemory() {
    if (Date.now() - this.lastCheck < this.checkInterval) {
      return;
    }

    this.lastCheck = Date.now();
    
    // Estimate memory usage (performance.memory not available in workers)
    const estimate = await this.estimateMemoryUsage();
    const usage = estimate / this.limit;

    if (usage > this.criticalThreshold) {
      this.handleCriticalMemory();
    } else if (usage > this.warningThreshold) {
      this.handleMemoryWarning(usage);
    }

    return {
      used: estimate,
      limit: this.limit,
      percentage: (usage * 100).toFixed(2) + '%',
      level: usage > this.criticalThreshold ? 'critical' : 
             usage > this.warningThreshold ? 'warning' : 'normal'
    };
  }

  async estimateMemoryUsage() {
    if (!db) return 0;
    
    try {
      const stats = await db.stats();
      const docCount = stats.document_count || 0;
      // Estimate 1KB per document average
      return docCount * 1024;
    } catch (error) {
      return 0;
    }
  }

  handleMemoryWarning(usage) {
    postMessage({
      type: 'memory-warning',
      payload: {
        level: 'warning',
        usage: (usage * 100).toFixed(2) + '%',
        message: 'Memory usage is high. Consider clearing old data.'
      }
    });
  }

  handleCriticalMemory() {
    // Auto-clear cache to free memory
    if (db && db.clearCache) {
      db.clearCache();
    }

    postMessage({
      type: 'memory-warning',
      payload: {
        level: 'critical',
        message: 'Critical memory usage. Cache cleared automatically.'
      }
    });
  }
}

// Batch operation processor
class BatchProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(operation) {
    this.queue.push(operation);
    
    if (!this.processing) {
      this.processBatch();
    }
  }

  async processBatch() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    
    // Group operations by type for optimal processing
    const grouped = this.groupOperations(this.queue.splice(0, BATCH_SIZE));
    
    try {
      // Process inserts as batch
      if (grouped.inserts.length > 0) {
        const docs = grouped.inserts.map(op => op.data);
        const ids = await db.insertMany(docs);
        
        grouped.inserts.forEach((op, i) => {
          postMessage({
            id: op.id,
            type: 'success',
            payload: ids[i]
          });
        });
      }

      // Process updates as batch
      if (grouped.updates.length > 0) {
        // Group updates by filter for efficiency
        const updateGroups = this.groupUpdatesByFilter(grouped.updates);
        
        for (const group of updateGroups) {
          const result = await db.updateMany(group.filter, group.update);
          
          group.operations.forEach(op => {
            postMessage({
              id: op.id,
              type: 'success',
              payload: result
            });
          });
        }
      }

      // Process deletes as batch
      if (grouped.deletes.length > 0) {
        const filters = grouped.deletes.map(op => op.filter);
        const combinedFilter = { $or: filters };
        const result = await db.deleteMany(combinedFilter);
        
        grouped.deletes.forEach(op => {
          postMessage({
            id: op.id,
            type: 'success',
            payload: result
          });
        });
      }

      // Process queries (can't batch, but can cache)
      for (const query of grouped.queries) {
        const result = await this.executeQuery(query);
        postMessage({
          id: query.id,
          type: 'success',
          payload: result
        });
      }

    } catch (error) {
      // Send error for all operations in batch
      [...grouped.inserts, ...grouped.updates, ...grouped.deletes, ...grouped.queries].forEach(op => {
        postMessage({
          id: op.id,
          type: 'error',
          payload: error.message
        });
      });
    }

    // Continue processing if more in queue
    if (this.queue.length > 0) {
      setTimeout(() => this.processBatch(), BATCH_DELAY);
    } else {
      this.processing = false;
    }
  }

  groupOperations(operations) {
    return {
      inserts: operations.filter(op => op.type === 'insert'),
      updates: operations.filter(op => op.type === 'update'),
      deletes: operations.filter(op => op.type === 'delete'),
      queries: operations.filter(op => op.type === 'query')
    };
  }

  groupUpdatesByFilter(updates) {
    const groups = new Map();
    
    for (const update of updates) {
      const filterKey = JSON.stringify(update.filter);
      
      if (!groups.has(filterKey)) {
        groups.set(filterKey, {
          filter: update.filter,
          update: update.update,
          operations: []
        });
      }
      
      groups.get(filterKey).operations.push(update);
    }
    
    return Array.from(groups.values());
  }

  async executeQuery(query) {
    // Build query with options
    let dbQuery = db.find(query.filter || {});
    
    if (query.sort) {
      dbQuery = dbQuery.sort(query.sort);
    }
    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }
    if (query.skip) {
      dbQuery = dbQuery.skip(query.skip);
    }
    if (query.projection) {
      dbQuery = dbQuery.project(query.projection);
    }
    
    return dbQuery.exec();
  }
}

const batchProcessor = new BatchProcessor();

// Initialize database
async function initDatabase(config = {}) {
  try {
    // Configure JSONIC with v3.1 optimizations
    self.JSONIC_V3.configure({
      wasmUrl: '/agentx-benchmark-ui/jsonic_wasm_bg.wasm',
      debug: config.debug || false,
      enablePersistence: true,
      persistenceKey: config.persistenceKey || 'agentx_worker_db',
      cacheSize: config.mobile ? 50 : 100, // Smaller cache for mobile
      enableQueryCache: true,
      enableBatchOptimization: true,
      memoryLimit: config.mobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024,
      indexHints: {
        'testId': 'hash',
        'timestamp': 'btree',
        'status': 'hash',
        'agentId': 'hash',
        'type': 'hash'
      }
    });

    db = await self.JSONIC_V3.createDatabase({
      enablePersistence: true,
      persistenceKey: config.persistenceKey || 'agentx_worker_db',
      cacheSize: config.mobile ? 50 : 100,
      enableQueryCache: true,
      enableBatchOptimization: true,
      memoryLimit: config.mobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024,
      debug: config.debug || false
    });

    // Initialize memory monitor for mobile
    if (config.mobile) {
      memoryMonitor = new MemoryMonitor(config.maxMemoryMB * 1024 * 1024);
      
      // Start periodic memory checks
      setInterval(async () => {
        const memStatus = await memoryMonitor.checkMemory();
        if (memStatus && memStatus.level !== 'normal') {
          postMessage({
            type: 'memory-status',
            payload: memStatus
          });
        }
      }, 5000);
    }

    return { success: true };
  } catch (error) {
    console.error('Worker initialization failed:', error);
    return { success: false, error: error.message };
  }
}

// Message handler
self.onmessage = async function(event) {
  const { id, type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'init':
        result = await initDatabase(payload);
        break;

      case 'insert':
        // Check memory before insert
        if (memoryMonitor) {
          await memoryMonitor.checkMemory();
        }
        
        // Use batch processor for inserts
        if (payload.batch && Array.isArray(payload.data)) {
          result = await db.insertMany(payload.data);
        } else {
          await batchProcessor.add({
            id,
            type: 'insert',
            data: payload
          });
          return; // Batch processor will send response
        }
        break;

      case 'insertMany':
        // Direct batch insert
        result = await db.insertMany(payload);
        break;

      case 'get':
        result = await db.get(payload);
        break;

      case 'update':
        if (payload.batch) {
          await batchProcessor.add({
            id,
            type: 'update',
            filter: payload.filter,
            update: payload.update
          });
          return;
        } else {
          result = await db.update(payload.id, payload.data);
        }
        break;

      case 'updateMany':
        result = await db.updateMany(payload.filter, payload.update);
        break;

      case 'delete':
        if (payload.batch) {
          await batchProcessor.add({
            id,
            type: 'delete',
            filter: payload.filter || { id: payload }
          });
          return;
        } else {
          result = await db.delete(payload);
        }
        break;

      case 'deleteMany':
        result = await db.deleteMany(payload.filter);
        break;

      case 'query':
        // Use batch processor for queries to benefit from caching
        await batchProcessor.add({
          id,
          type: 'query',
          filter: payload.filter,
          sort: payload.sort,
          limit: payload.limit,
          skip: payload.skip,
          projection: payload.projection
        });
        return;

      case 'aggregate':
        result = await db.aggregate(payload.pipeline);
        break;

      case 'list':
        result = await db.list();
        break;

      case 'stats':
        const stats = await db.stats();
        
        // Add memory info if available
        if (memoryMonitor) {
          const memStatus = await memoryMonitor.checkMemory();
          stats.memory = memStatus;
        }
        
        result = stats;
        break;

      case 'clearCache':
        db.clearCache();
        result = { success: true };
        break;

      case 'clearProfiler':
        db.clearProfiler();
        result = { success: true };
        break;

      case 'getDebugInfo':
        result = db.getDebugInfo();
        break;

      case 'compact':
        // Compact database to free memory
        if (db.compact) {
          await db.compact();
        } else {
          // Manual compaction: export and re-import
          const allDocs = await db.find({}).exec();
          await db.deleteMany({});
          await db.insertMany(allDocs);
        }
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown operation: ${type}`);
    }

    postMessage({
      id,
      type: 'success',
      payload: result
    });

  } catch (error) {
    postMessage({
      id,
      type: 'error',
      payload: error.message
    });
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initDatabase, BatchProcessor, MemoryMonitor };
}