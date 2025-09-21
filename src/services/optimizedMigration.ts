import { jsonicService } from './jsonicService';
import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend
} from '../types/benchmark';

interface MigrationProgress {
  phase: 'checking' | 'loading' | 'migrating' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  percentage: number;
}

type ProgressCallback = (progress: MigrationProgress) => void;

// Helper to create document with type tagging
function createDocument(type: string, data: any, runId?: string): any {
  return {
    _type: type,
    _runId: runId,
    _timestamp: new Date().toISOString(),
    ...data
  };
}

// Check if migration is needed
async function isMigrationNeeded(): Promise<boolean> {
  try {
    // Initialize JSONIC first
    await jsonicService.initialize();
    
    // Check if we have data in JSONIC
    const stats = await jsonicService.getStats();
    console.log('JSONIC stats:', stats);
    
    // If we have documents, check if they're fresh
    if (stats?.document_count > 0) {
      // Get the most recent benchmark run
      const db = await jsonicService.getDatabase();
      const runs = await db.find({ _type: 'benchmark_run' })
        .sort({ timestamp: -1 })
        .limit(1)
        .exec();
      
      if (runs && runs.length > 0) {
        // Check if data is less than 5 minutes old
        const lastUpdate = new Date(runs[0]._timestamp || runs[0].timestamp);
        const now = new Date();
        const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        
        console.log(`Data age: ${ageMinutes.toFixed(1)} minutes`);
        
        // Consider data fresh if less than 5 minutes old
        if (ageMinutes < 5) {
          console.log('Data is fresh, skipping migration');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return true; // Assume migration needed on error
  }
}


// Optimized migration with progress reporting
export async function performOptimizedMigration(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    // Step 1: Check if migration is needed
    onProgress?.({
      phase: 'checking',
      current: 0,
      total: 100,
      message: 'Checking database status...',
      percentage: 0
    });
    
    const needsMigration = await isMigrationNeeded();
    
    if (!needsMigration) {
      onProgress?.({
        phase: 'complete',
        current: 100,
        total: 100,
        message: 'Database is up to date',
        percentage: 100
      });
      return true;
    }
    
    // Step 2: Load JSON data
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Loading benchmark data...',
      percentage: 10
    });
    
    const basePath = import.meta.env.BASE_URL || '/';
    const dataUrl = `${basePath}data/database.json`;
    const response = await fetch(dataUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch database.json: ${response.status}`);
    }
    
    const jsonData = await response.json();
    
    // Calculate total documents
    const totalDocs = 
      (jsonData.benchmark_runs?.length || 0) +
      (jsonData.model_performance?.length || 0) +
      (jsonData.test_results?.length || 0) +
      (jsonData.performance_trends?.length || 0);
    
    console.log(`Total documents to migrate: ${totalDocs}`);
    
    let migratedCount = 0;
    
    // Step 3: Migrate data in batches
    onProgress?.({
      phase: 'migrating',
      current: migratedCount,
      total: totalDocs,
      message: 'Migrating benchmark runs...',
      percentage: 20
    });
    
    // Prepare all documents first
    const allDocuments: any[] = [];
    
    // Prepare benchmark runs
    if (jsonData.benchmark_runs) {
      const docs = jsonData.benchmark_runs.map((run: BenchmarkRun) => 
        createDocument('benchmark_run', run)
      );
      allDocuments.push(...docs);
    }
    
    // Prepare model performance
    if (jsonData.model_performance) {
      const docs = jsonData.model_performance.map((perf: ModelPerformance) => 
        createDocument('model_performance', perf, perf.run_id)
      );
      allDocuments.push(...docs);
    }
    
    // Prepare test results (largest dataset)
    if (jsonData.test_results) {
      const docs = jsonData.test_results.map((test: TestResult) => 
        createDocument('test_result', test, test.run_id)
      );
      allDocuments.push(...docs);
    }
    
    // Prepare performance trends
    if (jsonData.performance_trends) {
      const docs = jsonData.performance_trends.map((trend: PerformanceTrend) => 
        createDocument('performance_trend', trend)
      );
      allDocuments.push(...docs);
    }
    
    // Batch insert with progress updates
    const batchSize = 50;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, Math.min(i + batchSize, allDocuments.length));
      
      // Insert batch
      await Promise.all(
        batch.map(doc => jsonicService.insert(doc))
      );
      
      migratedCount += batch.length;
      
      // Update progress
      const percentage = 20 + (migratedCount / totalDocs) * 70; // 20-90%
      onProgress?.({
        phase: 'migrating',
        current: migratedCount,
        total: totalDocs,
        message: `Migrating documents... (${migratedCount}/${totalDocs})`,
        percentage
      });
    }
    
    // Step 4: Complete
    onProgress?.({
      phase: 'complete',
      current: totalDocs,
      total: totalDocs,
      message: `Migration complete! ${totalDocs} documents loaded.`,
      percentage: 100
    });
    
    console.log(`✅ Migration complete! Total documents: ${migratedCount}`);
    return true;
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    onProgress?.({
      phase: 'error',
      current: 0,
      total: 100,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      percentage: 0
    });
    
    throw error;
  }
}

// Check and migrate with progress
export async function checkAndMigrateOptimized(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    console.log('🔍 Checking JSONIC database...');
    
    const success = await performOptimizedMigration(onProgress);
    
    if (success) {
      console.log('✅ Database ready');
    }
    
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Export for backwards compatibility
export const checkAndMigrate = checkAndMigrateOptimized;