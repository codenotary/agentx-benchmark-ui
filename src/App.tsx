import { useEffect } from 'react';
import AppRouter from './components/AppRouter';
import { PerformanceMonitor } from './components/PerformanceMonitor';

function App() {
  useEffect(() => {
    console.log('[APP] Application started');
    console.log('[APP] Environment:', {
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL,
      location: window.location.href,
      pathname: window.location.pathname,
      origin: window.location.origin
    });
    
    // Log browser capabilities
    console.log('[APP] Browser capabilities:', {
      serviceWorker: 'serviceWorker' in navigator,
      webWorker: typeof Worker !== 'undefined',
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      webAssembly: typeof WebAssembly !== 'undefined'
    });
  }, []);
  
  return (
    <>
      <AppRouter />
      {import.meta.env.DEV && <PerformanceMonitor enabled={true} />}
    </>
  );
}

export default App;