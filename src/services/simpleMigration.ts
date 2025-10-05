/**
 * Optimized migration using batch inserts for high performance
 * Uses JSONIC's native insert_many for bulk operations
 */

import { jsonicService } from './jsonicService';

// Declare the extended database interface with insert_many
interface ExtendedDatabase {
  insert(data: any): Promise<string>;
  insert_many?(documents: string): Promise<string>; // WASM method for batch insert
  get(id: string): Promise<any>;
  update(id: string, data: any): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  list(): Promise<string[]>;
  stats(): Promise<any>;
  query(filter: any, options?: any): Promise<any[]>;
  find(filter?: any): any;
  findOne(filter?: any): Promise<any>;
}

export async function performSimpleMigration(
  onProgress?: (progress: any) => void
): Promise<boolean> {
  try {
    console.log('🚀 Starting optimized batch migration...');
    
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
    const basePath = import.meta.env.BASE_URL || '/';
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

    console.log(`Loading ${totalDocs} documents into JSONIC using batch insert...`);
    
    let processed = 0;
    
    // Helper to add metadata
    const addMetadata = (type: string, doc: any, runId?: string) => ({
      _type: type,
      _runId: runId,
      _timestamp: new Date().toISOString(),
      ...doc
    });

    // Get the raw database instance for batch operations
    const db = await jsonicService.getDatabase() as ExtendedDatabase;
    
    // Process benchmark runs using batch insert
    if (jsonData.benchmark_runs && jsonData.benchmark_runs.length > 0) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Batch loading benchmark runs...',
        percentage: 20
      });

      const benchmarkDocs = jsonData.benchmark_runs.map((run: any) => 
        addMetadata('benchmark_run', run)
      );
      
      // Use batch insert if available, otherwise fall back to parallel inserts
      if (db.insert_many) {
        const result = await db.insert_many(JSON.stringify(benchmarkDocs));
        // Handle both string and object responses
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsed.success || parsed.data) {
          processed += benchmarkDocs.length;
          console.log(`Batch loaded ${benchmarkDocs.length} benchmark runs`);
        }
      } else {
        // Fallback to parallel inserts
        const promises = benchmarkDocs.map((doc: any) => jsonicService.insert(doc));
        await Promise.all(promises);
        processed += benchmarkDocs.length;
        console.log(`Loaded ${benchmarkDocs.length} benchmark runs in parallel`);
      }
    }

    // Process model performance using batch insert
    if (jsonData.model_performance && jsonData.model_performance.length > 0) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Batch loading model performance...',
        percentage: 40
      });

      const perfDocs = jsonData.model_performance.map((perf: any) => 
        addMetadata('model_performance', perf, perf.run_id)
      );
      
      if (db.insert_many) {
        const result = await db.insert_many(JSON.stringify(perfDocs));
        // Handle both string and object responses
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsed.success || parsed.data) {
          processed += perfDocs.length;
          console.log(`Batch loaded ${perfDocs.length} model performance records`);
        }
      } else {
        const promises = perfDocs.map((doc: any) => jsonicService.insert(doc));
        await Promise.all(promises);
        processed += perfDocs.length;
        console.log(`Loaded ${perfDocs.length} model performance records in parallel`);
      }
    }

    // Process test results using batch insert with chunking for large datasets
    if (jsonData.test_results && jsonData.test_results.length > 0) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Batch loading test results...',
        percentage: 60
      });

      const testDocs = jsonData.test_results.map((result: any) => 
        addMetadata('test_result', result, result.run_id)
      );
      
      // Process in chunks to avoid memory issues and provide progress updates
      const chunkSize = 100;
      for (let i = 0; i < testDocs.length; i += chunkSize) {
        const chunk = testDocs.slice(i, Math.min(i + chunkSize, testDocs.length));
        
        if (db.insert_many) {
          const result = await db.insert_many(JSON.stringify(chunk));
          // Handle both string and object responses
          const parsed = typeof result === 'string' ? JSON.parse(result) : result;
          if (parsed.success || parsed.data) {
            processed += chunk.length;
          }
        } else {
          const promises = chunk.map((doc: any) => jsonicService.insert(doc));
          await Promise.all(promises);
          processed += chunk.length;
        }
        
        // Update progress
        const percentage = 60 + ((processed - jsonData.benchmark_runs.length - jsonData.model_performance.length) / jsonData.test_results.length * 25);
        onProgress?.({
          phase: 'migrating',
          current: processed,
          total: totalDocs,
          message: `Processing test results... (${processed}/${totalDocs})`,
          percentage
        });
      }
      
      console.log(`Batch loaded ${testDocs.length} test results`);
    }

    // Process performance trends using batch insert
    if (jsonData.performance_trends && jsonData.performance_trends.length > 0) {
      onProgress?.({
        phase: 'migrating',
        current: processed,
        total: totalDocs,
        message: 'Batch loading performance trends...',
        percentage: 85
      });

      const trendDocs = jsonData.performance_trends.map((trend: any) => 
        addMetadata('performance_trend', trend)
      );
      
      if (db.insert_many) {
        const result = await db.insert_many(JSON.stringify(trendDocs));
        // Handle both string and object responses
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsed.success || parsed.data) {
          processed += trendDocs.length;
          console.log(`Batch loaded ${trendDocs.length} performance trends`);
        }
      } else {
        const promises = trendDocs.map((doc: any) => jsonicService.insert(doc));
        await Promise.all(promises);
        processed += trendDocs.length;
        console.log(`Loaded ${trendDocs.length} performance trends in parallel`);
      }
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