import React, { useEffect, useState } from 'react';
import { jsonicService } from '../services/jsonicService';

interface PerformanceTiming {
  phase: string;
  duration: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  const [timings, setTimings] = useState<PerformanceTiming[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Hook into console.log to capture JSONIC timing logs
    const originalLog = console.log;
    const capturedTimings: PerformanceTiming[] = [];

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      
      // Capture JSONIC timing logs
      const message = args[0];
      if (typeof message === 'string' && message.includes('[JSONIC]')) {
        const match = message.match(/(\d+\.?\d*)\s*ms/);
        if (match) {
          const duration = parseFloat(match[1]);
          capturedTimings.push({
            phase: message.replace(/\[JSONIC\]\s*/, '').replace(/:\s*\d+\.?\d*\s*ms/, ''),
            duration,
            timestamp: Date.now()
          });
          setTimings([...capturedTimings]);
        }
      }
    };

    // Track initial page load performance
    if (window.performance && window.performance.timing) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      
      console.log(`[Performance] Page Load: ${pageLoadTime}ms`);
      console.log(`[Performance] DOM Ready: ${domReadyTime}ms`);
      
      // Check resource timings for JSONIC files
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsonicResources = resources.filter(r => 
        r.name.includes('jsonic') || r.name.includes('wasm')
      );
      
      jsonicResources.forEach(resource => {
        const name = resource.name.split('/').pop() || resource.name;
        const duration = resource.duration;
        const size = (resource as any).transferSize || 0;
        
        console.log(`[Performance] Resource ${name}: ${duration.toFixed(2)}ms (${(size / 1024).toFixed(2)}KB)`);
        
        capturedTimings.push({
          phase: `Load ${name}`,
          duration,
          timestamp: Date.now()
        });
      });
      
      setTimings([...capturedTimings]);
    }

    // Keyboard shortcut for visibility toggle (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      console.log = originalLog;
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [enabled]);

  if (!enabled || !isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
        >
          Perf Monitor (Ctrl+Shift+P)
        </button>
      </div>
    );
  }

  const totalTime = timings.reduce((sum, t) => sum + t.duration, 0);
  const slowestPhase = timings.reduce((max, t) => t.duration > max.duration ? t : max, { duration: 0 } as any);

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white p-4 rounded shadow-2xl w-96 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {timings.length === 0 ? (
        <p className="text-gray-400 text-xs">No timing data yet. Refresh the page to capture initialization timings.</p>
      ) : (
        <>
          <div className="mb-3 p-2 bg-gray-800 rounded">
            <div className="text-xs text-gray-400 mb-1">Summary</div>
            <div className="flex justify-between text-xs">
              <span>Total Time:</span>
              <span className={totalTime > 1000 ? 'text-red-400' : 'text-green-400'}>
                {totalTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Phases:</span>
              <span>{timings.length}</span>
            </div>
            {slowestPhase.duration > 0 && (
              <div className="flex justify-between text-xs mt-1">
                <span>Slowest:</span>
                <span className="text-yellow-400">
                  {slowestPhase.phase.substring(0, 30)}... ({slowestPhase.duration.toFixed(2)}ms)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-400 mb-1">Timeline</div>
            {timings.map((timing, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="flex-1 truncate pr-2">{timing.phase}</div>
                <div className="w-20 text-right">
                  <span className={
                    timing.duration > 500 ? 'text-red-400' :
                    timing.duration > 200 ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {timing.duration.toFixed(2)}ms
                  </span>
                </div>
                <div className="w-32 ml-2">
                  <div className="h-2 bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full ${
                        timing.duration > 500 ? 'bg-red-400' :
                        timing.duration > 200 ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`}
                      style={{ width: `${Math.min((timing.duration / totalTime) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              <p>Press Ctrl+Shift+P to toggle</p>
              <p>Red: &gt;500ms | Yellow: &gt;200ms | Green: &lt;200ms</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};