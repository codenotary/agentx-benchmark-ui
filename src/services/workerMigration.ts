// Web Worker-based migration service for mobile compatibility
// This ensures JSONIC operations don't block the main UI thread

// Import worker with Vite's special syntax
import MigrationWorker from './migration.worker.ts?worker';

interface MigrationProgress {
  phase: 'checking' | 'loading' | 'migrating' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  percentage: number;
}

type ProgressCallback = (progress: MigrationProgress) => void;

let worker: Worker | null = null;

export function checkAndMigrateWorker(onProgress?: ProgressCallback): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Ensure this runs only in the browser
    if (typeof window === 'undefined') {
      console.error('Worker migration only available in browser');
      return resolve(false);
    }

    // Check if we already have a worker running
    if (worker) {
      console.log('Worker already running, terminating...');
      worker.terminate();
      worker = null;
    }

    try {
      console.log('🚀 Creating JSONIC migration worker...');
      
      // Create the worker using the imported constructor
      worker = new MigrationWorker();
      console.log('Worker created successfully');

      worker.onmessage = (event) => {
        if (event.data.type === 'progress') {
          onProgress?.(event.data.payload);
        } else if (event.data.type === 'migrationComplete') {
          if (event.data.payload) {
            console.log('✅ Worker migration completed successfully');
            resolve(true);
          } else {
            console.error('❌ Worker migration failed');
            reject(new Error('Migration failed in worker'));
          }
          
          // Clean up worker
          worker?.terminate();
          worker = null;
        }
      };

      worker.onerror = (error) => {
        console.error('❌ Worker error:', error);
        onProgress?.({
          phase: 'error',
          message: 'Worker failed to initialize',
          percentage: 0,
          current: 0,
          total: 0,
        });
        reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
        
        // Clean up worker
        worker?.terminate();
        worker = null;
      };

      worker.onmessageerror = (error) => {
        console.error('❌ Worker message error:', error);
        onProgress?.({
          phase: 'error',
          message: 'Worker communication error',
          percentage: 0,
          current: 0,
          total: 0,
        });
        reject(new Error('Worker communication error'));
        
        // Clean up worker
        worker?.terminate();
        worker = null;
      };

      // Start the migration
      console.log('📤 Starting worker migration...');
      worker.postMessage({ type: 'startMigration' });

    } catch (error) {
      console.error('❌ Failed to create worker:', error);
      onProgress?.({
        phase: 'error',
        message: 'Failed to create worker',
        percentage: 0,
        current: 0,
        total: 0,
      });
      reject(error);
    }
  });
}

// Cleanup function to terminate worker if needed
export function terminateWorker() {
  if (worker) {
    console.log('🛑 Terminating migration worker...');
    worker.terminate();
    worker = null;
  }
}

// Export for backwards compatibility
export const checkAndMigrate = checkAndMigrateWorker;