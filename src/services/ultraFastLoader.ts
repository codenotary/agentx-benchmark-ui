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
const CACHE_DURATION = 30 * 1000; // 30 seconds for debugging

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
      return true; // Trust the cache timestamp - don't check JSONIC stats yet
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
  const startTime = performance.now();
  console.log('🚀 Starting ultra-fast database loader...');
  
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
    console.log('⏰ Checking cache...');
    const cacheCheckStart = performance.now();
    const hasCached = await checkCachedDatabase();
    console.log(`⏰ Cache check took: ${(performance.now() - cacheCheckStart).toFixed(0)}ms`);
    
    if (hasCached) {
      console.log('✅ Cache hit! Initializing JSONIC...');
      const initStart = performance.now();
      
      // Initialize JSONIC to verify we actually have data
      await jsonicService.initialize();
      console.log(`⏰ JSONIC init took: ${(performance.now() - initStart).toFixed(0)}ms`);
      
      // Quick validation that we have data
      try {
        const statsStart = performance.now();
        const stats = await jsonicService.getStats();
        console.log(`⏰ Stats check took: ${(performance.now() - statsStart).toFixed(0)}ms`);
        
        if (stats?.document_count > 0) {
          console.log(`✅ Cache validated: ${stats.document_count} documents found`);
          console.log(`🎉 Total cached load time: ${(performance.now() - startTime).toFixed(0)}ms`);
          
          onProgress?.({
            phase: 'complete',
            current: 100,
            total: 100,
            message: 'Database loaded from cache!',
            percentage: 100
          });
          return true;
        } else {
          console.log('❌ Cache validation failed: no documents found');
        }
      } catch (error) {
        console.log('❌ Cache validation failed:', error);
      }
    } else {
      console.log('❌ No valid cache found');
    }
    
    // Step 2: Try OPFS first
    console.log('💾 Checking OPFS...');
    const opfsStart = performance.now();
    let database = await loadFromOPFS();
    console.log(`⏰ OPFS check took: ${(performance.now() - opfsStart).toFixed(0)}ms`);
    
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
    console.log('🔧 Initializing JSONIC for new database...');
    const jsonicInitStart = performance.now();
    await jsonicService.initialize();
    console.log(`⏰ JSONIC init took: ${(performance.now() - jsonicInitStart).toFixed(0)}ms`);
    
    // Step 5: Bulk insert all documents at once
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: database.metadata.totalDocuments,
      message: `Loading ${database.metadata.totalDocuments} documents...`,
      percentage: 40
    });
    
    // Ultra-fast bulk insert
    console.log(`📥 Starting bulk insert of ${database.documents.length} documents...`);
    const bulkInsertStart = performance.now();
    await bulkInsert(database.documents, 100);
    const loadTime = performance.now() - bulkInsertStart;
    console.log(`⏰ Bulk insert took: ${loadTime.toFixed(0)}ms`);
    
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
    console.error('❌ Ultra-fast loader failed:', error);
    console.log('🔄 Falling back to optimized migration...');
    
    onProgress?.({
      phase: 'loading',
      current: 0,
      total: 100,
      message: 'Falling back to standard loading...',
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
    
    // HOTFIX: For debugging, skip ultra-fast loader and use original migration
    const BYPASS_ULTRA_FAST = localStorage.getItem('BYPASS_ULTRA_FAST') === 'true';
    
    if (BYPASS_ULTRA_FAST) {
      console.log('🚧 BYPASSING ultra-fast loader - using original migration');
      const { checkAndMigrateOptimized } = await import('./optimizedMigration');
      return checkAndMigrateOptimized(onProgress as any);
    }
    
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