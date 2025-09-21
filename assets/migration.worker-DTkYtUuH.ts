// Web Worker for JSONIC database operations
// This runs in a separate thread to avoid blocking the main UI thread

import { jsonicService } from './jsonicService';

// Post messages back to the main thread
const postProgress = (progress: any) => {
  self.postMessage({ type: 'progress', payload: progress });
};

const performMigration = async () => {
  try {
    console.log('🔧 WORKER: Starting JSONIC migration...');
    postProgress({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Loading data in background...',
      percentage: 10,
    });

    // In a worker, we need to construct the full URL to the data file
    const basePath = '/agentx-benchmark-ui/'; // GitHub Pages base path
    const dataUrl = new URL(`${basePath}data/database.json`, self.location.origin).href;

    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch database.json: ${response.status}`);
    }
    const jsonData = await response.json();

    const totalDocs =
      (jsonData.benchmark_runs?.length || 0) +
      (jsonData.model_performance?.length || 0) +
      (jsonData.test_results?.length || 0) +
      (jsonData.performance_trends?.length || 0);

    console.log(`🔧 WORKER: Processing ${totalDocs} documents`);

    postProgress({
      phase: 'migrating',
      current: 0,
      total: totalDocs,
      message: 'Initializing JSONIC in worker...',
      percentage: 15,
    });

    // Initialize JSONIC in the worker thread
    await jsonicService.initialize();

    let migratedCount = 0;
    const BATCH_SIZE = 50; // Larger batches are fine in a worker

    const insertBatch = async (documents: any[]) => {
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, Math.min(i + BATCH_SIZE, documents.length));

        // Insert batch in parallel within worker
        await Promise.all(
          batch.map(doc => jsonicService.insert(doc))
        );

        migratedCount += batch.length;
        const percentage = 20 + (migratedCount / totalDocs) * 70;
        
        postProgress({
          phase: 'migrating',
          current: migratedCount,
          total: totalDocs,
          message: `Processing documents... (${migratedCount}/${totalDocs})`,
          percentage,
        });
      }
    };

    // Helper to create document with type tagging
    const createDocument = (type: string, data: any, runId?: string) => ({
      _type: type,
      _runId: runId,
      _timestamp: new Date().toISOString(),
      ...data
    });

    // Process data in order of importance
    if (jsonData.benchmark_runs) {
      const docs = jsonData.benchmark_runs.map((run: any) => 
        createDocument('benchmark_run', run)
      );
      await insertBatch(docs);
      console.log(`🔧 WORKER: Migrated ${docs.length} benchmark runs`);
    }

    if (jsonData.model_performance) {
      const docs = jsonData.model_performance.map((perf: any) => 
        createDocument('model_performance', perf, perf.run_id)
      );
      await insertBatch(docs);
      console.log(`🔧 WORKER: Migrated ${docs.length} model performance records`);
    }

    if (jsonData.test_results) {
      const docs = jsonData.test_results.map((test: any) => 
        createDocument('test_result', test, test.run_id)
      );
      await insertBatch(docs);
      console.log(`🔧 WORKER: Migrated ${docs.length} test results`);
    }

    if (jsonData.performance_trends) {
      const docs = jsonData.performance_trends.map((trend: any) => 
        createDocument('performance_trend', trend)
      );
      await insertBatch(docs);
      console.log(`🔧 WORKER: Migrated ${docs.length} performance trends`);
    }

    postProgress({
      phase: 'complete',
      current: totalDocs,
      total: totalDocs,
      message: `✅ Migration complete! ${totalDocs} documents processed.`,
      percentage: 100,
    });

    console.log(`🎉 WORKER: Migration successful - ${totalDocs} documents`);
    self.postMessage({ type: 'migrationComplete', payload: true });

  } catch (error) {
    console.error('❌ WORKER: Migration failed:', error);
    postProgress({
      phase: 'error',
      current: 0,
      total: 100,
      message: error instanceof Error ? error.message : 'Unknown worker error',
      percentage: 0,
    });
    self.postMessage({ type: 'migrationComplete', payload: false });
  }
};

// Listen for messages from the main thread
self.onmessage = (event) => {
  if (event.data.type === 'startMigration') {
    performMigration();
  }
};

export {};