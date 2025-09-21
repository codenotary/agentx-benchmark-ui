import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './Dashboard';
import JsonicBenchmark from './JsonicBenchmark';
import LoadingOverlay from './LoadingOverlay';
import { setMigrationProgressCallback } from '../services/api-jsonic';
import { checkAndMigrateWorker } from '../services/workerMigration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

interface MigrationProgress {
  phase: 'checking' | 'loading' | 'migrating' | 'complete' | 'error' | 'idle';
  current: number;
  total: number;
  message: string;
  percentage: number;
}

export default function AppRouter() {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    message: '',
    percentage: 0
  });

  const [isReady, setIsReady] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const initializeDatabase = async () => {
      // Check if we're on the benchmark page - skip initialization
      const path = window.location.pathname;
      setCurrentPath(path);
      
      if (path.includes('/jsonic-bench')) {
        setIsReady(true);
        return;
      }

      try {
        // Set up progress callback for Web Worker migration
        setMigrationProgressCallback((progress) => {
          console.log('Worker migration progress:', progress);
          setMigrationProgress(progress);
          
          if (progress.phase === 'complete') {
            setTimeout(() => {
              setIsReady(true);
            }, 500);
          } else if (progress.phase === 'error') {
            console.error('Worker migration error:', progress.message);
          }
        });

        // Start loading with Web Worker (works on mobile and desktop)
        setMigrationProgress({
          phase: 'checking',
          current: 0,
          total: 100,
          message: 'Initializing database...',
          percentage: 0
        });

        // Actually trigger the migration!
        console.log('🚀 Starting database migration...');
        const success = await checkAndMigrateWorker((progress) => {
          console.log('Migration progress:', progress);
          setMigrationProgress(progress);
          
          if (progress.phase === 'complete') {
            setTimeout(() => {
              setIsReady(true);
            }, 500);
          } else if (progress.phase === 'error') {
            console.error('Migration error:', progress.message);
          }
        });

        if (success) {
          console.log('✅ Database migration completed successfully');
        } else {
          console.error('❌ Database migration failed');
          setMigrationProgress({
            phase: 'error',
            current: 0,
            total: 100,
            message: 'Database initialization failed',
            percentage: 0
          });
        }
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        setMigrationProgress({
          phase: 'error',
          current: 0,
          total: 100,
          message: 'Database initialization failed',
          percentage: 0
        });
      }
    };

    initializeDatabase();
  }, []);

  // Use hash routing for GitHub Pages compatibility
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={basename}>
        {!isReady && !currentPath.includes('/jsonic-bench') && (
          <LoadingOverlay
            {...migrationProgress}
            onComplete={() => setIsReady(true)}
          />
        )}
        
        <Routes>
          <Route path="/" element={isReady ? <Dashboard /> : null} />
          <Route path="/jsonic-bench" element={<JsonicBenchmark />} />
        </Routes>
        
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  );
}