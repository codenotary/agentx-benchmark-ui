/**
 * Insert Performance Profiler
 *
 * Detailed profiling tool to analyze JSONIC insert operations
 * and identify bottlenecks with performance.mark/measure API
 */

export class InsertProfiler {
  constructor() {
    this.profiles = [];
    this.enabled = typeof performance !== 'undefined' && performance.mark;
  }

  /**
   * Profile a single insert operation
   */
  async profileInsertOne(adapter, doc) {
    if (!this.enabled) return await adapter.insert(doc);

    const profileId = `insert-${Date.now()}`;

    performance.mark(`${profileId}-start`);

    // ID generation
    performance.mark(`${profileId}-id-start`);
    const idGenStart = performance.now();
    // This would be inside adapter.insert()
    performance.mark(`${profileId}-id-end`);
    const idGenTime = performance.now() - idGenStart;

    // Actual insert
    performance.mark(`${profileId}-insert-start`);
    const result = await adapter.insert(doc);
    performance.mark(`${profileId}-insert-end`);

    performance.mark(`${profileId}-end`);

    // Measure phases
    performance.measure(`${profileId}-total`, `${profileId}-start`, `${profileId}-end`);
    performance.measure(`${profileId}-id-gen`, `${profileId}-id-start`, `${profileId}-id-end`);
    performance.measure(`${profileId}-insert`, `${profileId}-insert-start`, `${profileId}-insert-end`);

    const measures = performance.getEntriesByType('measure')
      .filter(m => m.name.startsWith(profileId));

    this.profiles.push({
      operation: 'insertOne',
      timestamp: Date.now(),
      measures: measures.map(m => ({ name: m.name, duration: m.duration }))
    });

    // Cleanup
    performance.clearMarks(profileId);
    performance.clearMeasures(profileId);

    return result;
  }

  /**
   * Profile batch insert operation with detailed breakdown
   */
  async profileBatchInsert(adapter, docs) {
    if (!this.enabled) return await adapter.bulkInsert(docs);

    const profileId = `batch-insert-${Date.now()}`;
    const metrics = {
      totalDocs: docs.length,
      phases: {}
    };

    performance.mark(`${profileId}-start`);
    const totalStart = performance.now();

    // Phase 1: ID Generation
    performance.mark(`${profileId}-id-gen-start`);
    const idGenStart = performance.now();
    const ids = [];
    let idCounter = 0;
    for (let i = 0; i < docs.length; i++) {
      ids.push(++idCounter);
    }
    const idGenTime = performance.now() - idGenStart;
    performance.mark(`${profileId}-id-gen-end`);
    metrics.phases.idGeneration = {
      time: idGenTime,
      avgPerDoc: idGenTime / docs.length,
      docsPerSec: Math.round(docs.length / (idGenTime / 1000))
    };

    // Phase 2: Document Enrichment
    performance.mark(`${profileId}-enrich-start`);
    const enrichStart = performance.now();
    const enrichedDocs = [];
    for (let i = 0; i < docs.length; i++) {
      enrichedDocs.push({ ...docs[i], _id: ids[i] });
    }
    const enrichTime = performance.now() - enrichStart;
    performance.mark(`${profileId}-enrich-end`);
    metrics.phases.enrichment = {
      time: enrichTime,
      avgPerDoc: enrichTime / docs.length,
      docsPerSec: Math.round(docs.length / (enrichTime / 1000))
    };

    // Phase 3: Map Insertion
    performance.mark(`${profileId}-map-insert-start`);
    const mapInsertStart = performance.now();
    // This simulates the actual Map insertion
    const tempMap = new Map();
    for (let i = 0; i < enrichedDocs.length; i++) {
      tempMap.set(ids[i], enrichedDocs[i]);
    }
    const mapInsertTime = performance.now() - mapInsertStart;
    performance.mark(`${profileId}-map-insert-end`);
    metrics.phases.mapInsertion = {
      time: mapInsertTime,
      avgPerDoc: mapInsertTime / docs.length,
      docsPerSec: Math.round(docs.length / (mapInsertTime / 1000))
    };

    // Actual bulk insert
    performance.mark(`${profileId}-bulk-insert-start`);
    const result = await adapter.bulkInsert(docs);
    performance.mark(`${profileId}-bulk-insert-end`);

    const totalTime = performance.now() - totalStart;
    performance.mark(`${profileId}-end`);

    // Create measurements
    performance.measure(`${profileId}-total`, `${profileId}-start`, `${profileId}-end`);
    performance.measure(`${profileId}-id-gen`, `${profileId}-id-gen-start`, `${profileId}-id-gen-end`);
    performance.measure(`${profileId}-enrich`, `${profileId}-enrich-start`, `${profileId}-enrich-end`);
    performance.measure(`${profileId}-map`, `${profileId}-map-insert-start`, `${profileId}-map-insert-end`);

    metrics.total = {
      time: totalTime,
      avgPerDoc: totalTime / docs.length,
      docsPerSec: Math.round(docs.length / (totalTime / 1000)),
      breakdown: {
        idGeneration: ((idGenTime / totalTime) * 100).toFixed(1) + '%',
        enrichment: ((enrichTime / totalTime) * 100).toFixed(1) + '%',
        mapInsertion: ((mapInsertTime / totalTime) * 100).toFixed(1) + '%'
      }
    };

    this.profiles.push({
      operation: 'batchInsert',
      timestamp: Date.now(),
      metrics
    });

    // Cleanup
    performance.clearMarks(profileId);
    performance.clearMeasures(profileId);

    return result;
  }

  /**
   * Compare old vs new implementation
   */
  async compareImplementations(testDocs) {
    console.log('🔍 Comparing Old vs New Insert Implementation...\n');

    const results = {
      oldImplementation: {},
      newImplementation: {},
      comparison: {}
    };

    // OLD: Date.now() + Math.random() + mutation
    console.log('Testing OLD implementation (Date.now + mutation)...');
    const oldMap = new Map();
    let oldOps = 0;

    const oldStart = performance.now();
    performance.mark('old-impl-start');

    for (const doc of testDocs) {
      oldOps++;
      const id = Date.now() + Math.random();
      doc._id = id;
      oldMap.set(id, doc);
    }

    performance.mark('old-impl-end');
    const oldTime = performance.now() - oldStart;
    performance.measure('old-impl', 'old-impl-start', 'old-impl-end');

    results.oldImplementation = {
      time: oldTime,
      avgPerDoc: oldTime / testDocs.length,
      docsPerSec: Math.round(testDocs.length / (oldTime / 1000))
    };

    // NEW: Simple counter + immutable
    console.log('Testing NEW implementation (counter + immutable)...');
    const newMap = new Map();
    let newOps = 0;
    let idCounter = 0;

    const newStart = performance.now();
    performance.mark('new-impl-start');

    for (const doc of testDocs) {
      const id = ++idCounter;
      const enrichedDoc = { ...doc, _id: id };
      newMap.set(id, enrichedDoc);
    }
    newOps += testDocs.length;

    performance.mark('new-impl-end');
    const newTime = performance.now() - newStart;
    performance.measure('new-impl', 'new-impl-start', 'new-impl-end');

    results.newImplementation = {
      time: newTime,
      avgPerDoc: newTime / testDocs.length,
      docsPerSec: Math.round(testDocs.length / (newTime / 1000))
    };

    // Comparison
    results.comparison = {
      speedup: (oldTime / newTime).toFixed(2) + 'x',
      improvement: ((oldTime - newTime) / oldTime * 100).toFixed(1) + '%',
      timeSaved: (oldTime - newTime).toFixed(2) + 'ms',
      docsPerSecGain: results.newImplementation.docsPerSec - results.oldImplementation.docsPerSec
    };

    console.log('\n📊 Comparison Results:');
    console.log(`  OLD: ${oldTime.toFixed(2)}ms (${results.oldImplementation.docsPerSec} docs/sec)`);
    console.log(`  NEW: ${newTime.toFixed(2)}ms (${results.newImplementation.docsPerSec} docs/sec)`);
    console.log(`  Speedup: ${results.comparison.speedup}`);
    console.log(`  Improvement: ${results.comparison.improvement}`);

    return results;
  }

  /**
   * Get profiling summary
   */
  getSummary() {
    if (this.profiles.length === 0) {
      return { message: 'No profiles collected' };
    }

    const batchProfiles = this.profiles.filter(p => p.operation === 'batchInsert');
    const singleProfiles = this.profiles.filter(p => p.operation === 'insertOne');

    return {
      totalProfiles: this.profiles.length,
      batchOperations: batchProfiles.length,
      singleOperations: singleProfiles.length,
      profiles: this.profiles
    };
  }

  /**
   * Clear all profiles
   */
  clear() {
    this.profiles = [];
    if (this.enabled) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Export profiling data
   */
  export() {
    return {
      timestamp: new Date().toISOString(),
      platform: {
        userAgent: navigator?.userAgent || 'Unknown',
        cores: navigator?.hardwareConcurrency || 'Unknown',
        memory: navigator?.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown'
      },
      summary: this.getSummary(),
      profiles: this.profiles
    };
  }
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InsertProfiler };
}
