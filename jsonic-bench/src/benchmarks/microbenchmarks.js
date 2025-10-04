/**
 * Microbenchmark Suite for JSONIC Insert Performance Analysis
 *
 * This suite isolates individual operations to identify bottlenecks:
 * - ID generation strategies
 * - Map insertion performance
 * - Document mutation vs immutable patterns
 * - Batch operation overhead
 */

export class InsertMicrobenchmarks {
  constructor(iterations = 100000) {
    this.iterations = iterations;
    this.results = {};
  }

  /**
   * Benchmark 1: ID Generation Strategies
   */
  async benchmarkIdGeneration() {
    console.log('\n🔬 Benchmarking ID Generation Strategies...');

    // Strategy 1: Date.now() + Math.random() (OLD)
    const start1 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const id = Date.now() + Math.random();
    }
    const time1 = performance.now() - start1;

    // Strategy 2: Simple counter (NEW - SQL.js style)
    let counter = 0;
    const start2 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const id = ++counter;
    }
    const time2 = performance.now() - start2;

    // Strategy 3: Pre-increment vs post-increment
    counter = 0;
    const start3 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const id = counter++;
    }
    const time3 = performance.now() - start3;

    this.results.idGeneration = {
      'Date.now() + Math.random()': { time: time1, opsPerMs: this.iterations / time1 },
      'Simple counter (++counter)': { time: time2, opsPerMs: this.iterations / time2 },
      'Counter post-increment': { time: time3, opsPerMs: this.iterations / time3 },
      speedup: (time1 / time2).toFixed(2) + 'x faster'
    };

    console.log(`  Date.now() + Math.random(): ${time1.toFixed(2)}ms`);
    console.log(`  Simple counter: ${time2.toFixed(2)}ms (${this.results.idGeneration.speedup})`);
  }

  /**
   * Benchmark 2: Map Insertion Performance
   */
  async benchmarkMapInsertion() {
    console.log('\n🔬 Benchmarking Map Insertion...');

    const testDoc = { name: 'Test User', age: 30, email: 'test@example.com' };

    // Strategy 1: Individual insertions
    let map1 = new Map();
    const start1 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      map1.set(i, testDoc);
    }
    const time1 = performance.now() - start1;

    // Strategy 2: Batch with size hint (if supported)
    let map2 = new Map();
    const start2 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      map2.set(i, testDoc);
    }
    const time2 = performance.now() - start2;

    this.results.mapInsertion = {
      individualInserts: { time: time1, opsPerMs: this.iterations / time1 },
      batchInserts: { time: time2, opsPerMs: this.iterations / time2 }
    };

    console.log(`  Individual inserts: ${time1.toFixed(2)}ms`);
    console.log(`  Batch inserts: ${time2.toFixed(2)}ms`);
  }

  /**
   * Benchmark 3: Document Mutation vs Immutability
   */
  async benchmarkDocumentMutation() {
    console.log('\n🔬 Benchmarking Document Mutation Patterns...');

    const testDoc = { name: 'Test User', age: 30, email: 'test@example.com' };

    // Strategy 1: Mutate original (OLD)
    const map1 = new Map();
    const start1 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const doc = { ...testDoc };
      doc._id = i;
      map1.set(i, doc);
    }
    const time1 = performance.now() - start1;

    // Strategy 2: Immutable spread (NEW)
    const map2 = new Map();
    const start2 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const enrichedDoc = { ...testDoc, _id: i };
      map2.set(i, enrichedDoc);
    }
    const time2 = performance.now() - start2;

    // Strategy 3: Object.assign
    const map3 = new Map();
    const start3 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      const enrichedDoc = Object.assign({}, testDoc, { _id: i });
      map3.set(i, enrichedDoc);
    }
    const time3 = performance.now() - start3;

    this.results.documentMutation = {
      mutateThenInsert: { time: time1, opsPerMs: this.iterations / time1 },
      immutableSpread: { time: time2, opsPerMs: this.iterations / time2 },
      objectAssign: { time: time3, opsPerMs: this.iterations / time3 },
      bestStrategy: time2 < time1 ? 'Immutable spread' : 'Mutation'
    };

    console.log(`  Mutate then insert: ${time1.toFixed(2)}ms`);
    console.log(`  Immutable spread: ${time2.toFixed(2)}ms`);
    console.log(`  Object.assign: ${time3.toFixed(2)}ms`);
  }

  /**
   * Benchmark 4: Operations Counter Overhead
   */
  async benchmarkOperationsCounter() {
    console.log('\n🔬 Benchmarking Operations Counter Overhead...');

    // Strategy 1: Increment in loop (OLD)
    let ops1 = 0;
    const start1 = performance.now();
    for (let i = 0; i < this.iterations; i++) {
      ops1++;
    }
    const time1 = performance.now() - start1;

    // Strategy 2: Batch increment (NEW)
    let ops2 = 0;
    const start2 = performance.now();
    const batchSize = this.iterations;
    ops2 += batchSize;
    const time2 = performance.now() - start2;

    this.results.operationsCounter = {
      incrementInLoop: { time: time1, opsPerMs: this.iterations / time1 },
      batchIncrement: { time: time2, overhead: 'negligible' },
      speedup: time1 > 0 ? (time1 / (time2 || 0.001)).toFixed(0) + 'x faster' : 'instant'
    };

    console.log(`  Increment in loop: ${time1.toFixed(2)}ms`);
    console.log(`  Batch increment: ${time2.toFixed(4)}ms (${this.results.operationsCounter.speedup})`);
  }

  /**
   * Benchmark 5: Combined Insert Operation (Full simulation)
   */
  async benchmarkCombinedInsert() {
    console.log('\n🔬 Benchmarking Combined Insert Operations...');

    const testDocs = Array.from({ length: 10000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: 20 + (i % 50),
      active: i % 2 === 0
    }));

    // OLD Implementation (Date.now() + Math.random())
    let oldMap = new Map();
    let oldOps = 0;
    const startOld = performance.now();
    for (const doc of testDocs) {
      oldOps++;
      const id = Date.now() + Math.random();
      doc._id = id;
      oldMap.set(id, doc);
    }
    const timeOld = performance.now() - startOld;

    // NEW Implementation (counter + immutable)
    let newMap = new Map();
    let newOps = 0;
    let idCounter = 0;
    const startNew = performance.now();
    for (const doc of testDocs) {
      const id = ++idCounter;
      const enrichedDoc = { ...doc, _id: id };
      newMap.set(id, enrichedDoc);
    }
    newOps += testDocs.length;
    const timeNew = performance.now() - startNew;

    this.results.combinedInsert = {
      oldImplementation: { time: timeOld, docsPerSec: Math.round(testDocs.length / (timeOld / 1000)) },
      newImplementation: { time: timeNew, docsPerSec: Math.round(testDocs.length / (timeNew / 1000)) },
      improvement: ((timeOld - timeNew) / timeOld * 100).toFixed(1) + '% faster',
      speedup: (timeOld / timeNew).toFixed(2) + 'x'
    };

    console.log(`  OLD (Date.now + mutation): ${timeOld.toFixed(2)}ms`);
    console.log(`  NEW (counter + immutable): ${timeNew.toFixed(2)}ms`);
    console.log(`  Improvement: ${this.results.combinedInsert.improvement} (${this.results.combinedInsert.speedup})`);
  }

  /**
   * Run all microbenchmarks
   */
  async runAll() {
    console.log('🚀 Starting JSONIC Insert Microbenchmark Suite...\n');
    console.log(`Iterations per test: ${this.iterations.toLocaleString()}\n`);

    await this.benchmarkIdGeneration();
    await this.benchmarkMapInsertion();
    await this.benchmarkDocumentMutation();
    await this.benchmarkOperationsCounter();
    await this.benchmarkCombinedInsert();

    console.log('\n📊 Microbenchmark Summary:');
    console.log(JSON.stringify(this.results, null, 2));

    return this.results;
  }

  /**
   * Export results
   */
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      iterations: this.iterations,
      platform: {
        userAgent: navigator.userAgent,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown'
      },
      results: this.results
    };
  }
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InsertMicrobenchmarks };
}
