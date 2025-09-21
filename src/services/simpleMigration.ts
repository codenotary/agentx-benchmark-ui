/**
 * Simple migration that runs data fetching in worker but stores in main thread
 * This avoids the data isolation issue between worker and main thread
 */

import { jsonicService } from './jsonicService';

export async function performSimpleMigration(
  onProgress?: (progress: any) => void
): Promise<boolean> {
  try {
    console.log('🚀 Starting simple migration...');
    
    // Initialize JSONIC in main thread
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Initializing database...',
      percentage: 5
    });

    await jsonicService.initialize();
    
    // Check if data already exists
    const stats = await jsonicService.getStats();
    if (stats && stats.document_count > 0) {
      console.log(`Database already contains ${stats.document_count} documents, skipping migration`);
      onProgress?.({
        phase: 'complete',
        current: stats.document_count,
        total: stats.document_count,
        message: `Database ready with ${stats.document_count} documents`,
        percentage: 100
      });
      return true;
    }

    onProgress?.({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Loading data...',
      percentage: 10
    });

    // Fetch the data
    const basePath = '/agentx-benchmark-ui/';
    const response = await fetch(`${basePath}data/database.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch database: ${response.status}`);
    }

    const jsonData = await response.json();
    
    const totalDocs = 
      (jsonData.benchmark_runs?.length || 0) +
      (jsonData.model_performance?.length || 0) +
      (jsonData.test_results?.length || 0) +
      (jsonData.performance_trends?.length || 0);

    console.log(`Loading ${totalDocs} documents into JSONIC...`);
    
    let processed = 0;
    
    // Helper to add metadata
    const addMetadata = (type: string, doc: any, runId?: string) => ({
      _type: type,
      _runId: runId,
      _timestamp: new Date().toISOString(),
      ...doc
    });

    // Process benchmark runs
    if (jsonData.benchmark_runs) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Loading benchmark runs...',
        percentage: 20
      });

      for (const run of jsonData.benchmark_runs) {
        await jsonicService.insert(addMetadata('benchmark_run', run));
        processed++;
      }
      console.log(`Loaded ${jsonData.benchmark_runs.length} benchmark runs`);
    }

    // Process model performance
    if (jsonData.model_performance) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Loading model performance...',
        percentage: 40
      });

      for (const perf of jsonData.model_performance) {
        await jsonicService.insert(addMetadata('model_performance', perf, perf.run_id));
        processed++;
      }
      console.log(`Loaded ${jsonData.model_performance.length} model performance records`);
    }

    // Process test results
    if (jsonData.test_results) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Loading test results...',
        percentage: 60
      });

      for (const result of jsonData.test_results) {
        await jsonicService.insert(addMetadata('test_result', result, result.run_id));
        processed++;
        
        // Update progress every 50 documents
        if (processed % 50 === 0) {
          const percentage = 20 + (processed / totalDocs * 60);
          onProgress?.({
            phase: 'migrating',
            current: processed,
            total: totalDocs,
            message: `Processing documents... (${processed}/${totalDocs})`,
            percentage
          });
        }
      }
      console.log(`Loaded ${jsonData.test_results.length} test results`);
    }

    // Process performance trends
    if (jsonData.performance_trends) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Loading performance trends...',
        percentage: 85
      });

      for (const trend of jsonData.performance_trends) {
        await jsonicService.insert(addMetadata('performance_trend', trend));
        processed++;
      }
      console.log(`Loaded ${jsonData.performance_trends.length} performance trends`);
    }

    // Verify the data
    const finalStats = await jsonicService.getStats();
    console.log('Migration complete. Final stats:', finalStats);

    onProgress?.({
      phase: 'complete',
      current: totalDocs,
      total: totalDocs,
      message: `✅ Migration complete! ${totalDocs} documents loaded.`,
      percentage: 100
    });

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    onProgress?.({
      phase: 'error',
      current: 0,
      total: 100,
      message: error instanceof Error ? error.message : 'Migration failed',
      percentage: 0
    });
    return false;
  }
}