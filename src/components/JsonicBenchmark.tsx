import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Zap } from 'lucide-react';

export default function JsonicBenchmark() {
  useEffect(() => {
    // Create iframe to load the benchmark page
    const container = document.getElementById('benchmark-container');
    if (container && !container.querySelector('iframe')) {
      const iframe = document.createElement('iframe');
      const basePath = import.meta.env.BASE_URL || '/';
      iframe.src = `${basePath}jsonic-bench/index.html`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.title = 'JSONIC Benchmarks';
      container.appendChild(iframe);
    }

    // Cleanup on unmount
    return () => {
      const container = document.getElementById('benchmark-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  JSONIC Performance Benchmarks
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Activity className="h-4 w-4" />
              <span>Compare storage solutions</span>
            </div>
          </div>
        </div>
      </header>

      {/* Iframe Container */}
      <div 
        id="benchmark-container" 
        className="w-full"
        style={{ height: 'calc(100vh - 64px)' }}
      />
    </div>
  );
}