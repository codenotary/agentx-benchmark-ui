/**
 * JSONIC Benchmark Library
 * Browser and Node.js compatible benchmark suite
 * 
 * @module jsonic-benchmark
 */

import { BenchmarkRunner } from './src/runner.js';
import { JsonicAdapter } from './src/adapters/jsonic.js';
import { IndexedDBAdapter } from './src/adapters/indexeddb.js';
import { SQLJSAdapter } from './src/adapters/sqljs.js';
import { LocalStorageAdapter } from './src/adapters/localstorage.js';
import { generateTestData, calculateStats, formatResults } from './src/utils.js';

/**
 * Main benchmark class for browser and Node.js
 */
export class JSonicBenchmark {
  constructor(options = {}) {
    this.options = {
      dataSize: options.dataSize || 'medium',
      iterations: options.iterations || 3,
      warmup: options.warmup || 1,
      adapters: options.adapters || ['jsonic', 'indexeddb'],
      scenarios: options.scenarios || ['insert', 'query'],
      onProgress: options.onProgress || null,
      ...options
    };
    
    this.runner = null;
    this.results = null;
  }

  /**
   * Run benchmarks
   * @returns {Promise<BenchmarkResult>}
   */
  async run() {
    this.runner = new BenchmarkRunner(this.options);
    
    // Add progress tracking
    if (this.options.onProgress) {
      this._trackProgress();
    }
    
    this.results = await this.runner.run();
    return this.results;
  }

  /**
   * Run quick benchmark (minimal config)
   * @returns {Promise<BenchmarkResult>}
   */
  static async quick() {
    const benchmark = new JSonicBenchmark({
      dataSize: 'small',
      iterations: 1,
      warmup: 0,
      adapters: ['jsonic', 'indexeddb'],
      scenarios: ['insert', 'query']
    });
    
    return benchmark.run();
  }

  /**
   * Run full benchmark suite
   * @returns {Promise<BenchmarkResult>}
   */
  static async full() {
    const benchmark = new JSonicBenchmark({
      dataSize: 'large',
      iterations: 5,
      warmup: 2,
      adapters: ['jsonic', 'indexeddb', 'sqljs', 'localstorage'],
      scenarios: ['insert', 'query', 'update', 'delete', 'aggregate', 'transaction']
    });
    
    return benchmark.run();
  }

  /**
   * Compare specific databases
   * @param {string[]} databases - Database names to compare
   * @returns {Promise<BenchmarkResult>}
   */
  static async compare(databases = ['jsonic', 'indexeddb']) {
    const benchmark = new JSonicBenchmark({
      dataSize: 'medium',
      iterations: 3,
      adapters: databases,
      scenarios: ['insert', 'query', 'update']
    });
    
    return benchmark.run();
  }

  /**
   * Test specific scenario
   * @param {string} scenario - Scenario name
   * @param {object} options - Additional options
   * @returns {Promise<BenchmarkResult>}
   */
  static async testScenario(scenario, options = {}) {
    const benchmark = new JSonicBenchmark({
      dataSize: 'medium',
      iterations: 3,
      adapters: ['jsonic', 'indexeddb'],
      scenarios: [scenario],
      ...options
    });
    
    return benchmark.run();
  }

  /**
   * Get formatted results
   * @param {string} format - Output format (html, markdown, json, csv)
   * @returns {string}
   */
  getResults(format = 'json') {
    if (!this.results) {
      throw new Error('No results available. Run benchmarks first.');
    }
    
    if (format === 'json') {
      return JSON.stringify(this.results, null, 2);
    }
    
    return formatResults(this.results, format);
  }

  /**
   * Get summary of results
   * @returns {object}
   */
  getSummary() {
    if (!this.results) {
      throw new Error('No results available. Run benchmarks first.');
    }
    
    const summary = {
      winner: null,
      rankings: {},
      insights: []
    };
    
    // Determine winner for each test
    for (const [testName, testResults] of Object.entries(this.results.tests)) {
      const sorted = Object.entries(testResults)
        .filter(([_, r]) => r.stats)
        .sort((a, b) => a[1].stats.mean - b[1].stats.mean);
      
      if (sorted.length > 0) {
        summary.rankings[testName] = sorted.map(([db, result]) => ({
          database: db,
          mean: result.stats.mean,
          relative: sorted[0][1].stats.mean / result.stats.mean
        }));
      }
    }
    
    // Overall winner
    const scores = {};
    for (const rankings of Object.values(summary.rankings)) {
      for (let i = 0; i < rankings.length; i++) {
        const db = rankings[i].database;
        scores[db] = (scores[db] || 0) + (rankings.length - i);
      }
    }
    
    const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    summary.winner = winner ? winner[0] : 'unknown';
    
    // Generate insights
    summary.insights = this._generateInsights(summary);
    
    return summary;
  }

  /**
   * Export results to file (browser)
   * @param {string} format - Export format
   * @param {string} filename - Output filename
   */
  export(format = 'json', filename = null) {
    const data = this.getResults(format);
    const mimeType = {
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
      markdown: 'text/markdown'
    }[format] || 'text/plain';
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `benchmark-${Date.now()}.${format}`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Track progress during benchmark
   * @private
   */
  _trackProgress() {
    let completed = 0;
    const total = this.options.scenarios.length * this.options.adapters.length;
    
    // Simulate progress updates
    const interval = setInterval(() => {
      if (completed < total) {
        completed++;
        const progress = (completed / total) * 100;
        
        if (this.options.onProgress) {
          this.options.onProgress({
            completed,
            total,
            progress,
            message: `Running test ${completed} of ${total}`
          });
        }
      } else {
        clearInterval(interval);
      }
    }, 500);
  }

  /**
   * Generate insights from results
   * @private
   */
  _generateInsights(summary) {
    const insights = [];
    
    // Check JSONIC performance
    for (const [test, rankings] of Object.entries(summary.rankings)) {
      const jsonic = rankings.find(r => r.database === 'jsonic' || r.database === 'JSONIC');
      if (jsonic && rankings[0].database === jsonic.database) {
        const speedup = rankings[1] ? rankings[1].mean / jsonic.mean : 0;
        if (speedup > 2) {
          insights.push(`JSONIC is ${speedup.toFixed(1)}x faster at ${test}`);
        }
      }
    }
    
    return insights;
  }
}

/**
 * Simple API for quick benchmarking
 */
export const benchmark = {
  /**
   * Quick benchmark with default settings
   */
  quick: () => JSonicBenchmark.quick(),
  
  /**
   * Full benchmark suite
   */
  full: () => JSonicBenchmark.full(),
  
  /**
   * Compare specific databases
   */
  compare: (databases) => JSonicBenchmark.compare(databases),
  
  /**
   * Test specific scenario
   */
  test: (scenario, options) => JSonicBenchmark.testScenario(scenario, options),
  
  /**
   * Custom benchmark
   */
  custom: (options) => new JSonicBenchmark(options).run()
};

// Export adapters for advanced usage
export {
  BenchmarkRunner,
  JsonicAdapter,
  IndexedDBAdapter,
  SQLJSAdapter,
  LocalStorageAdapter,
  generateTestData,
  calculateStats,
  formatResults
};

// Default export for convenience
export default JSonicBenchmark;

// Browser global
if (typeof window !== 'undefined') {
  window.JSonicBenchmark = JSonicBenchmark;
  window.benchmark = benchmark;
}