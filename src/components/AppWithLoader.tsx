import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './Dashboard';
import LoadingOverlay from './LoadingOverlay';
import { setMigrationProgressCallback } from '../services/api-jsonic';

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

export default function AppWithLoader() {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    message: '',
    percentage: 0
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set up progress callback
    setMigrationProgressCallback((progress) => {
      console.log('Migration progress:', progress);
      setMigrationProgress(progress);
      
      if (progress.phase === 'complete') {
        // Small delay to show completion state
        setTimeout(() => {
          setIsReady(true);
        }, 500);
      } else if (progress.phase === 'error') {
        // Handle error case
        console.error('Migration error:', progress.message);
      }
    });

    // Start loading immediately
    setMigrationProgress({
      phase: 'checking',
      current: 0,
      total: 100,
      message: 'Initializing database...',
      percentage: 0
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!isReady && (
        <LoadingOverlay
          {...migrationProgress}
          onComplete={() => setIsReady(true)}
        />
      )}
      {isReady && <Dashboard />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}