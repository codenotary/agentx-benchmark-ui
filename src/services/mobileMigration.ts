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

// Mobile detection
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints ? navigator.maxTouchPoints > 1 : false);
}

// Helper to create document with type tagging
function createDocument(type: string, data: any, runId?: string): any {
  return {
    _type: type,
    _runId: runId,
    _timestamp: new Date().toISOString(),
    ...data
  };
}

// Mobile-optimized migration with tiny batches
export async function performMobileMigration(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    console.log('📱 Starting mobile-optimized migration...');
    
    // Step 1: Check if we have cached data in localStorage
    onProgress?.({
      phase: 'checking',
      current: 0,
      total: 100,
      message: 'Checking mobile cache...',
      percentage: 5
    });
    
    const cacheKey = 'mobile_db_cache';
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    
    // Use cache if less than 2 minutes old (shorter for mobile)
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 2 * 60 * 1000) { // 2 minutes
        console.log('📱 Using mobile cache');
        
        await jsonicService.initialize();
        
        // Quick validation
        const stats = await jsonicService.getStats();
        if (stats?.document_count > 0) {
          onProgress?.({
            phase: 'complete',
            current: 100,
            total: 100,
            message: 'Loaded from mobile cache!',
            percentage: 100
          });
          return true;
        }
      }
    }
    
    // Step 2: Load JSON data
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Loading data...',
      percentage: 10
    });
    
    const basePath = import.meta.env.BASE_URL || '/';
    const dataUrl = `${basePath}data/database.json`;
    const response = await fetch(dataUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch database.json: ${response.status}`);
    }
    
    const jsonData = await response.json();
    
    // Calculate total documents for mobile (smaller batch)
    const totalDocs = 
      (jsonData.benchmark_runs?.length || 0) +
      (jsonData.model_performance?.length || 0) +
      (jsonData.test_results?.length || 0) +
      (jsonData.performance_trends?.length || 0);
    
    console.log(`📱 Mobile migration: ${totalDocs} documents`);
    
    // Step 3: Initialize JSONIC
    await jsonicService.initialize();
    
    let migratedCount = 0;
    
    // Step 4: Migrate data with VERY small batches for mobile
    onProgress?.({
      phase: 'migrating',
      current: migratedCount,
      total: totalDocs,
      message: 'Processing data...',
      percentage: 20
    });
    
    const MOBILE_BATCH_SIZE = 5; // Tiny batches for mobile
    
    // Helper function for mobile-optimized insertion
    async function insertMobileBatch(documents: any[]): Promise<void> {
      for (let i = 0; i < documents.length; i += MOBILE_BATCH_SIZE) {
        const batch = documents.slice(i, Math.min(i + MOBILE_BATCH_SIZE, documents.length));
        
        // Insert one by one to avoid mobile memory issues
        for (const doc of batch) {
          await jsonicService.insert(doc);
        }
        
        migratedCount += batch.length;
        
        // Update progress more frequently
        const percentage = 20 + (migratedCount / totalDocs) * 70;
        onProgress?.({
          phase: 'migrating',
          current: migratedCount,
          total: totalDocs,
          message: `Processing... (${migratedCount}/${totalDocs})`,
          percentage
        });
        
        // Give browser time to breathe on mobile
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Migrate benchmark runs
    if (jsonData.benchmark_runs) {
      const docs = jsonData.benchmark_runs.map((run: BenchmarkRun) => 
        createDocument('benchmark_run', run)
      );
      await insertMobileBatch(docs);
    }
    
    // Migrate model performance
    if (jsonData.model_performance) {
      const docs = jsonData.model_performance.map((perf: ModelPerformance) => 
        createDocument('model_performance', perf, perf.run_id)
      );
      await insertMobileBatch(docs);
    }
    
    // Migrate test results (largest dataset) - process in smaller chunks
    if (jsonData.test_results) {
      const docs = jsonData.test_results.map((test: TestResult) => 
        createDocument('test_result', test, test.run_id)
      );
      await insertMobileBatch(docs);
    }
    
    // Migrate performance trends
    if (jsonData.performance_trends) {
      const docs = jsonData.performance_trends.map((trend: PerformanceTrend) => 
        createDocument('performance_trend', trend)
      );
      await insertMobileBatch(docs);
    }
    
    // Step 5: Cache success for mobile
    localStorage.setItem(cacheKey, 'true');
    localStorage.setItem(cacheKey + '_time', Date.now().toString());
    
    // Step 6: Complete
    onProgress?.({
      phase: 'complete',
      current: totalDocs,
      total: totalDocs,
      message: `Mobile migration complete! ${totalDocs} documents loaded.`,
      percentage: 100
    });
    
    console.log(`📱 Mobile migration complete! Total documents: ${migratedCount}`);
    return true;
    
  } catch (error) {
    console.error('📱 Mobile migration failed:', error);
    
    onProgress?.({
      phase: 'error',
      current: 0,
      total: 100,
      message: `Mobile migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      percentage: 0
    });
    
    throw error;
  }
}

// Check and migrate with mobile optimization
export async function checkAndMigrateMobile(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    if (isMobileDevice()) {
      console.log('📱 Mobile device detected - using optimized migration');
      return await performMobileMigration(onProgress);
    } else {
      console.log('💻 Desktop device - using standard migration');
      // Fall back to standard migration for desktop
      const { checkAndMigrateOptimized } = await import('./optimizedMigration');
      return checkAndMigrateOptimized(onProgress);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Export for backwards compatibility
export const checkAndMigrate = checkAndMigrateMobile;