import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './Dashboard';
import JsonicBenchmark from './JsonicBenchmark';
import MobileStaticDashboard from './MobileStaticDashboard';
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

// Mobile detection
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints ? navigator.maxTouchPoints > 1 : false);
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
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    // Check if we're on the benchmark page - skip initialization
    const path = window.location.pathname;
    setCurrentPath(path);
    
    if (path.includes('/jsonic-bench')) {
      setIsReady(true);
      return;
    }

    // For mobile devices, skip database initialization and use static dashboard
    if (isMobile) {
      console.log('📱 Mobile device detected - using static dashboard');
      setIsReady(true);
      return;
    }

    // Set up progress callback for desktop app
    setMigrationProgressCallback((progress) => {
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

    // Start loading for desktop app
    setMigrationProgress({
      phase: 'checking',
      current: 0,
      total: 100,
      message: 'Initializing database...',
      percentage: 0
    });
  }, [isMobile]);

  // Use hash routing for GitHub Pages compatibility
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={basename}>
        {!isReady && !currentPath.includes('/jsonic-bench') && !isMobile && (
          <LoadingOverlay
            {...migrationProgress}
            onComplete={() => setIsReady(true)}
          />
        )}
        
        <Routes>
          <Route path="/" element={isReady ? (isMobile ? <MobileStaticDashboard /> : <Dashboard />) : null} />
          <Route path="/jsonic-bench" element={<JsonicBenchmark />} />
        </Routes>
        
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  );
}