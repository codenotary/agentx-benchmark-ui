/**
 * Benchmark Runner
 * Executes performance tests across multiple database adapters
 */

import { JsonicAdapter } from './adapters/jsonic.js';
import { IndexedDBAdapter } from './adapters/indexeddb.js';
import { SQLJSAdapter } from './adapters/sqljs.js';
import { LocalStorageAdapter } from './adapters/localstorage.js';
import { generateTestData, formatResults, calculateStats } from './utils.js';

export class BenchmarkRunner {
  constructor(config = {}) {
    this.config = {
      iterations: config.iterations || 3,
      warmup: config.warmup || 1,
      dataSize: config.dataSize || 'medium',
      adapters: config.adapters || ['jsonic', 'indexeddb', 'sqljs', 'localstorage'],
      scenarios: config.scenarios || ['insert', 'query', 'update', 'delete', 'aggregate'],
      ...config
    };
    
    this.results = {
      metadata: {
        timestamp: new Date().toISOString(),
        platform: this.getPlatformInfo(),
        config: this.config
      },
      tests: {}
    };
    
    this.adapters = new Map();
  }

  /**
   * Initialize all database adapters
   */
  async initializeAdapters() {
    const adapterClasses = {
      jsonic: JsonicAdapter,
      indexeddb: IndexedDBAdapter,
      sqljs: SQLJSAdapter,
      localstorage: LocalStorageAdapter
    };
    
    console.log('🚀 Initializing database adapters...');
    
    for (const name of this.config.adapters) {
      if (adapterClasses[name]) {
        try {
          const adapter = new adapterClasses[name]({ name: 'benchmark' });
          await adapter.init();
          this.adapters.set(name, adapter);
          console.log(`✅ ${adapter.name} initialized`);
        } catch (error) {
          console.error(`❌ Failed to initialize ${name}:`, error);
        }
      }
    }
  }

  /**
   * Run all benchmark scenarios
   */
  async run() {
    console.log('📊 Starting benchmark suite...');
    console.log(`Configuration: ${JSON.stringify(this.config, null, 2)}`);
    
    await this.initializeAdapters();
    
    // Generate test data
    const testData = generateTestData(this.config.dataSize);
    console.log(`📝 Generated ${testData.documents.length} test documents`);
    
    // Run each scenario
    for (const scenario of this.config.scenarios) {
      console.log(`\n🎯 Running scenario: ${scenario}`);
      
      if (this[`run${scenario.charAt(0).toUpperCase() + scenario.slice(1)}Test`]) {
        await this[`run${scenario.charAt(0).toUpperCase() + scenario.slice(1)}Test`](testData);
      } else {
        console.warn(`⚠️ Scenario ${scenario} not implemented`);
      }
    }
    
    // Cleanup adapters
    await this.cleanupAdapters();
    
    console.log('\n✨ Benchmark complete!');
    return this.results;
  }

  /**
   * Run insert performance test
   */
  async runInsertTest(testData) {
    const results = {};
    
    for (const [name, adapter] of this.adapters) {
      console.log(`  Testing ${name}...`);
      
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        // Clear data before each iteration
        await adapter.clear();
        
        const start = performance.now();
        
        // Test bulk insert
        await adapter.bulkInsert(testData.documents);
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
      }
      
      results[name] = {
        times,
        stats: calculateStats(times),
        docsPerSecond: Math.round((testData.documents.length / (calculateStats(times).mean / 1000)))
      };
      
      console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms | Docs/sec: ${results[name].docsPerSecond}`);
    }
    
    this.results.tests.insert = results;
  }

  /**
   * Run query performance test
   */
  async runQueryTest(testData) {
    const results = {};
    
    // Prepare data
    for (const [name, adapter] of this.adapters) {
      await adapter.clear();
      await adapter.bulkInsert(testData.documents);
      
      // Create index if supported
      if (adapter.features.indexes) {
        await adapter.createIndex('age', 'age');
      }
    }
    
    // Test queries
    const queries = [
      { age: 30 }, // Simple equality
      { age: { $gt: 25 } }, // Range query
      { age: { $gte: 25, $lte: 35 } }, // Range with bounds
      { city: { $in: ['New York', 'Los Angeles'] } }, // IN query
      { $and: [{ age: { $gt: 25 } }, { status: 'active' }] } // Complex query
    ];
    
    for (const [name, adapter] of this.adapters) {
      console.log(`  Testing ${name}...`);
      
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        const start = performance.now();
        
        // Run all queries
        for (const query of queries) {
          await adapter.find(query, { limit: 100 });
        }
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
      }
      
      results[name] = {
        times,
        stats: calculateStats(times),
        queriesPerSecond: Math.round((queries.length / (calculateStats(times).mean / 1000)))
      };
      
      console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms | Queries/sec: ${results[name].queriesPerSecond}`);
    }
    
    this.results.tests.query = results;
  }

  /**
   * Run update performance test
   */
  async runUpdateTest(testData) {
    const results = {};
    
    // Prepare data
    for (const [name, adapter] of this.adapters) {
      await adapter.clear();
      await adapter.bulkInsert(testData.documents.slice(0, 1000)); // Use subset for updates
    }
    
    for (const [name, adapter] of this.adapters) {
      console.log(`  Testing ${name}...`);
      
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        const start = performance.now();
        
        // Update many documents
        await adapter.updateMany(
          { age: { $gte: 25, $lte: 35 } },
          { $set: { status: 'updated', lastModified: Date.now() } }
        );
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
        
        // Reset status for next iteration
        await adapter.updateMany(
          { status: 'updated' },
          { $set: { status: 'active' } }
        );
      }
      
      results[name] = {
        times,
        stats: calculateStats(times),
        updatesPerSecond: Math.round((100 / (calculateStats(times).mean / 1000))) // Approximate
      };
      
      console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms | Updates/sec: ${results[name].updatesPerSecond}`);
    }
    
    this.results.tests.update = results;
  }

  /**
   * Run delete performance test
   */
  async runDeleteTest(testData) {
    const results = {};
    
    for (const [name, adapter] of this.adapters) {
      console.log(`  Testing ${name}...`);
      
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        // Prepare data for each iteration
        await adapter.clear();
        await adapter.bulkInsert(testData.documents.slice(0, 1000));
        
        const start = performance.now();
        
        // Delete many documents
        await adapter.deleteMany({ age: { $lt: 30 } });
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
      }
      
      results[name] = {
        times,
        stats: calculateStats(times),
        deletesPerSecond: Math.round((300 / (calculateStats(times).mean / 1000))) // Approximate
      };
      
      console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms | Deletes/sec: ${results[name].deletesPerSecond}`);
    }
    
    this.results.tests.delete = results;
  }

  /**
   * Run aggregation performance test
   */
  async runAggregateTest(testData) {
    const results = {};
    
    // Prepare data
    for (const [name, adapter] of this.adapters) {
      await adapter.clear();
      await adapter.bulkInsert(testData.documents);
    }
    
    const pipeline = [
      { $match: { age: { $gte: 25 } } },
      { $group: {
        _id: '$city',
        avgAge: { $avg: '$age' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];
    
    for (const [name, adapter] of this.adapters) {
      if (!adapter.features.aggregation) {
        console.log(`  ${name}: Not supported`);
        continue;
      }
      
      console.log(`  Testing ${name}...`);
      
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        const start = performance.now();
        
        try {
          await adapter.aggregate(pipeline);
        } catch (error) {
          console.error(`    Error: ${error.message}`);
          break;
        }
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
      }
      
      if (times.length > 0) {
        results[name] = {
          times,
          stats: calculateStats(times)
        };
        
        console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms`);
      }
    }
    
    this.results.tests.aggregate = results;
  }

  /**
   * Run memory usage test
   */
  async runMemoryTest(testData) {
    const results = {};
    
    for (const [name, adapter] of this.adapters) {
      console.log(`  Testing ${name}...`);
      
      await adapter.clear();
      
      // Measure initial memory
      if (typeof gc !== 'undefined') {
        gc(); // Force garbage collection if available
      }
      
      const initialMemory = await adapter.getMemoryUsage();
      
      // Insert data
      await adapter.bulkInsert(testData.documents);
      
      // Measure after insert
      const afterMemory = await adapter.getMemoryUsage();
      
      if (initialMemory && afterMemory) {
        const usedMemory = afterMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
        
        results[name] = {
          initialMemory: initialMemory.usedJSHeapSize,
          afterMemory: afterMemory.usedJSHeapSize,
          usedMemory,
          usedMemoryMB
        };
        
        console.log(`    Memory used: ${usedMemoryMB} MB`);
      } else {
        console.log(`    Memory measurement not available`);
      }
    }
    
    this.results.tests.memory = results;
  }

  /**
   * Run transaction performance test
   */
  async runTransactionTest(testData) {
    const results = {};
    
    for (const [name, adapter] of this.adapters) {
      if (!adapter.features.transactions) {
        console.log(`  ${name}: Not supported`);
        continue;
      }
      
      console.log(`  Testing ${name}...`);
      
      await adapter.clear();
      const times = [];
      
      for (let i = 0; i < this.config.iterations + this.config.warmup; i++) {
        const start = performance.now();
        
        // Run transaction with multiple operations
        const tx = await adapter.beginTransaction();
        
        try {
          // Insert some documents
          for (let j = 0; j < 10; j++) {
            await adapter.insert(testData.documents[j]);
          }
          
          // Update some
          await adapter.update(1, { $set: { status: 'modified' } });
          await adapter.update(2, { $set: { status: 'modified' } });
          
          // Delete one
          await adapter.delete(3);
          
          await tx.commit();
        } catch (error) {
          await tx.rollback();
          console.error(`    Transaction error: ${error.message}`);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        if (i >= this.config.warmup) {
          times.push(duration);
        }
      }
      
      results[name] = {
        times,
        stats: calculateStats(times),
        transactionsPerSecond: Math.round((1000 / calculateStats(times).mean))
      };
      
      console.log(`    Mean: ${results[name].stats.mean.toFixed(2)}ms | TPS: ${results[name].transactionsPerSecond}`);
    }
    
    this.results.tests.transaction = results;
  }

  /**
   * Clean up all adapters
   */
  async cleanupAdapters() {
    console.log('\n🧹 Cleaning up...');
    
    for (const [name, adapter] of this.adapters) {
      try {
        await adapter.clear();
        await adapter.cleanup();
        console.log(`  ✅ ${name} cleaned up`);
      } catch (error) {
        console.error(`  ❌ Failed to cleanup ${name}:`, error);
      }
    }
  }

  /**
   * Get platform information
   */
  getPlatformInfo() {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown'
    };
    
    // Browser detection
    if (navigator.userAgent.includes('Chrome')) {
      info.browser = 'Chrome';
    } else if (navigator.userAgent.includes('Firefox')) {
      info.browser = 'Firefox';
    } else if (navigator.userAgent.includes('Safari')) {
      info.browser = 'Safari';
    } else if (navigator.userAgent.includes('Edge')) {
      info.browser = 'Edge';
    } else {
      info.browser = 'Unknown';
    }
    
    return info;
  }

  /**
   * Export results to different formats
   */
  exportResults(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.results, null, 2);
      
      case 'csv':
        return this.resultsToCSV();
      
      case 'html':
        return this.resultsToHTML();
      
      case 'markdown':
        return this.resultsToMarkdown();
      
      default:
        return this.results;
    }
  }

  /**
   * Convert results to CSV format
   */
  resultsToCSV() {
    const rows = [['Test', 'Database', 'Mean (ms)', 'StdDev', 'Min', 'Max', 'Ops/sec']];
    
    for (const [testName, testResults] of Object.entries(this.results.tests)) {
      for (const [dbName, dbResults] of Object.entries(testResults)) {
        if (dbResults.stats) {
          rows.push([
            testName,
            dbName,
            dbResults.stats.mean.toFixed(2),
            dbResults.stats.stdDev.toFixed(2),
            dbResults.stats.min.toFixed(2),
            dbResults.stats.max.toFixed(2),
            dbResults.docsPerSecond || dbResults.queriesPerSecond || dbResults.updatesPerSecond || 'N/A'
          ]);
        }
      }
    }
    
    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert results to HTML format
   */
  resultsToHTML() {
    return formatResults(this.results, 'html');
  }

  /**
   * Convert results to Markdown format
   */
  resultsToMarkdown() {
    return formatResults(this.results, 'markdown');
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BenchmarkRunner };
}