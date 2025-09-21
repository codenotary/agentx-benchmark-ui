import { jsonicService } from './jsonicService';

interface OptimizedDatabase {
  version: string;
  timestamp: string;
  metadata: {
    totalDocuments: number;
    collections: {
      benchmark_runs: number;
      model_performance: number;
      test_results: number;
      performance_trends: number;
    };
  };
  documents: any[];
  indexes: {
    byType: Record<string, number[]>;
    byRunId: Record<string, number[]>;
  };
}

interface LoadProgress {
  phase: 'checking' | 'downloading' | 'loading' | 'indexing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  percentage: number;
}

type ProgressCallback = (progress: LoadProgress) => void;

// Cache key for version checking
const VERSION_KEY = 'jsonic_db_version';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if we have a valid cached database
async function checkCachedDatabase(): Promise<boolean> {
  try {
    // Check localStorage for version and timestamp
    const cachedVersion = localStorage.getItem(VERSION_KEY);
    if (!cachedVersion) return false;
    
    const versionData = JSON.parse(cachedVersion);
    const now = Date.now();
    const age = now - versionData.timestamp;
    
    // Consider cache valid if less than 5 minutes old
    if (age < CACHE_DURATION) {
      console.log(`Using cached database (age: ${Math.round(age / 1000)}s)`);
      
      // Check if JSONIC has data
      const stats = await jsonicService.getStats();
      return stats?.document_count > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

// Store database in OPFS for persistence
async function storeInOPFS(data: OptimizedDatabase): Promise<void> {
  try {
    // Get OPFS root
    const root = await navigator.storage.getDirectory();
    
    // Create/open database file
    const fileHandle = await root.getFileHandle('database.jsonic', { create: true });
    const writable = await fileHandle.createWritable();
    
    // Write data
    await writable.write(JSON.stringify(data));
    await writable.close();
    
    console.log('Database stored in OPFS');
  } catch (error) {
    console.warn('OPFS not available, falling back to memory:', error);
  }
}

// Load database from OPFS
async function loadFromOPFS(): Promise<OptimizedDatabase | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('database.jsonic');
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    console.log('Database loaded from OPFS');
    return JSON.parse(text);
  } catch (error) {
    console.log('No OPFS database found');
    return null;
  }
}

// Ultra-fast bulk insert using batch operations
async function bulkInsert(documents: any[], batchSize: number = 100): Promise<void> {
  const db = await jsonicService.getDatabase();
  
  // Process in larger batches for speed
  const promises: Promise<string>[] = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, Math.min(i + batchSize, documents.length));
    
    // Insert entire batch in parallel
    const batchPromises = batch.map(doc => db.insert(doc));
    promises.push(...batchPromises);
  }
  
  // Wait for all insertions to complete
  await Promise.all(promises);
}

// Ultra-fast database loader
export async function loadOptimizedDatabase(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    // Step 1: Check cache
    onProgress?.({
      phase: 'checking',
      current: 0,
      total: 100,
      message: 'Checking cache...',
      percentage: 5
    });
    
    // First check if we have valid cached data
    const hasCached = await checkCachedDatabase();
    if (hasCached) {
      onProgress?.({
        phase: 'complete',
        current: 100,
        total: 100,
        message: 'Database loaded from cache!',
        percentage: 100
      });
      return true;
    }
    
    // Step 2: Try OPFS first
    let database = await loadFromOPFS();
    
    if (!database) {
      // Step 3: Download optimized database file
      onProgress?.({
        phase: 'downloading',
        current: 0,
        total: 100,
        message: 'Downloading database...',
        percentage: 10
      });
      
      const basePath = import.meta.env.BASE_URL || '/';
      
      // Try compressed version first for faster download
      let response: Response;
      let isCompressed = false;
      
      try {
        response = await fetch(`${basePath}data/database.jsonic.gz`);
        if (response.ok) {
          isCompressed = true;
        } else {
          response = await fetch(`${basePath}data/database.jsonic`);
        }
      } catch {
        response = await fetch(`${basePath}data/database.jsonic`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to download database: ${response.status}`);
      }
      
      onProgress?.({
        phase: 'downloading',
        current: 50,
        total: 100,
        message: 'Processing database...',
        percentage: 30
      });
      
      // Decompress if needed
      let data: ArrayBuffer;
      if (isCompressed) {
        const blob = await response.blob();
        const ds = new DecompressionStream('gzip');
        const decompressedStream = blob.stream().pipeThrough(ds);
        const decompressedBlob = await new Response(decompressedStream).blob();
        data = await decompressedBlob.arrayBuffer();
      } else {
        data = await response.arrayBuffer();
      }
      
      const text = new TextDecoder().decode(data);
      database = JSON.parse(text);
      
      // Store in OPFS for next time
      if (database) {
        await storeInOPFS(database);
      }
    }
    
    // Check if we have database
    if (!database) {
      throw new Error('Failed to load database');
    }
    
    // Step 4: Initialize JSONIC
    await jsonicService.initialize();
    
    // Step 5: Bulk insert all documents at once
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: database.metadata.totalDocuments,
      message: `Loading ${database.metadata.totalDocuments} documents...`,
      percentage: 40
    });
    
    // Ultra-fast bulk insert
    const startTime = performance.now();
    await bulkInsert(database.documents, 100);
    const loadTime = performance.now() - startTime;
    
    console.log(`Loaded ${database.documents.length} documents in ${loadTime.toFixed(0)}ms`);
    console.log(`Speed: ${(database.documents.length / (loadTime / 1000)).toFixed(0)} docs/sec`);
    
    // Step 6: Update cache version
    localStorage.setItem(VERSION_KEY, JSON.stringify({
      version: database.version,
      timestamp: Date.now(),
      documentCount: database.metadata.totalDocuments
    }));
    
    // Step 7: Complete
    onProgress?.({
      phase: 'complete',
      current: database.metadata.totalDocuments,
      total: database.metadata.totalDocuments,
      message: `✨ Loaded in ${(loadTime / 1000).toFixed(1)}s!`,
      percentage: 100
    });
    
    return true;
    
  } catch (error) {
    console.error('Failed to load database:', error);
    
    onProgress?.({
      phase: 'error',
      current: 0,
      total: 100,
      message: error instanceof Error ? error.message : 'Unknown error',
      percentage: 0
    });
    
    // Fall back to original migration
    const { checkAndMigrateOptimized } = await import('./optimizedMigration');
    return checkAndMigrateOptimized(onProgress as any);
  }
}

// Check and load with ultra-fast method
export async function initializeUltraFast(
  onProgress?: ProgressCallback
): Promise<boolean> {
  try {
    console.log('⚡ Ultra-fast database initialization...');
    
    const success = await loadOptimizedDatabase(onProgress);
    
    if (success) {
      console.log('✅ Database ready (ultra-fast mode)');
    }
    
    return success;
  } catch (error) {
    console.error('Ultra-fast load failed, falling back:', error);
    
    // Fallback to optimized migration
    const { checkAndMigrateOptimized } = await import('./optimizedMigration');
    return checkAndMigrateOptimized(onProgress as any);
  }
}