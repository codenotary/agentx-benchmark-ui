import React, { useState, useEffect, useCallback } from 'react';
import { jsonicService } from '../services/jsonicService';
import { jsonicGraphQL } from '../services/jsonicGraphQL';

interface DebugInfo {
  cache: {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
  profiler: {
    totalQueries: number;
    avgDuration: string;
    slowQueries: number;
  };
  slowQueries: Array<{
    operation: string;
    duration: number;
    details: unknown;
  }>;
  indexes: Array<{
    field: string;
    type: string;
    entries: number;
  }>;
  memory: {
    used: number;
    limit: number;
    percentage: string;
  };
}

interface DBStats {
  documentCount: number;
  wasmInitialized: boolean;
}

interface DebugPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const JsonicDebugPanel: React.FC<DebugPanelProps> = ({ isOpen = false, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'cache' | 'indexes'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadDebugInfo = useCallback(async () => {
    try {
      // TODO: Update to use JSONIC v3.3 debug API when available
      const stats = await jsonicGraphQL.getStats();
      setDbStats(stats);

      // Mock debug info for now
      setDebugInfo({
        cache: { size: 0, maxSize: 0, hits: 0, misses: 0, hitRate: '0%' },
        profiler: { totalQueries: 0, avgDuration: '0ms', slowQueries: 0 },
        slowQueries: [],
        indexes: [],
        memory: { used: 0, limit: 0, percentage: '0%' }
      });
    } catch (error) {
      console.error('Failed to load debug info:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDebugInfo();
      const interval = setInterval(loadDebugInfo, 2000); // Refresh every 2 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isOpen, refreshInterval, loadDebugInfo]);

  const handleClearCache = async () => {
    // TODO: Implement with JSONIC v3.3 API
    console.log('Cache clear not available in v3.3 yet');
    await loadDebugInfo();
  };

  const handleClearProfiler = async () => {
    // TODO: Implement with JSONIC v3.3 API
    console.log('Profiler clear not available in v3.3 yet');
    await loadDebugInfo();
  };

  if (!isOpen || !import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-gray-900 text-white shadow-2xl rounded-tl-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">JSONIC Debug Panel v3.1</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {(['overview', 'queries', 'cache', 'indexes'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-xs font-medium capitalize ${
              activeTab === tab
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-gray-400 mb-1">Database Stats</h4>
              <div className="bg-gray-800 rounded p-2 space-y-1">
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span className="text-blue-400">{dbStats?.documentCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>WASM Status:</span>
                  <span className={dbStats?.wasmInitialized ? 'text-green-400' : 'text-red-400'}>
                    {dbStats?.wasmInitialized ? 'Initialized' : 'Not Initialized'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 mb-1">Memory Usage</h4>
              <div className="bg-gray-800 rounded p-2 space-y-1">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span className="text-blue-400">
                    {((debugInfo?.memory?.used || 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Limit:</span>
                  <span className="text-gray-400">
                    {((debugInfo?.memory?.limit || 0) / 1024 / 1024).toFixed(0)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span className={
                    parseFloat(debugInfo?.memory?.percentage || '0') > 80
                      ? 'text-red-400'
                      : 'text-green-400'
                  }>
                    {debugInfo?.memory?.percentage || '0%'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 mb-1">Performance</h4>
              <div className="bg-gray-800 rounded p-2 space-y-1">
                <div className="flex justify-between">
                  <span>Total Queries:</span>
                  <span className="text-blue-400">{debugInfo?.profiler?.totalQueries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Duration:</span>
                  <span className="text-yellow-400">{debugInfo?.profiler?.avgDuration || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Queries:</span>
                  <span className="text-red-400">{debugInfo?.profiler?.slowQueries || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-gray-400">Slow Queries (&gt;100ms)</h4>
              <button
                onClick={handleClearProfiler}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            {debugInfo?.slowQueries && debugInfo.slowQueries.length > 0 ? (
              <div className="space-y-2">
                {debugInfo?.slowQueries?.slice(0, 5).map((query, i) => (
                  <div key={i} className="bg-gray-800 rounded p-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-blue-400">{query.operation}</span>
                      <span className="text-red-400">{query.duration.toFixed(2)}ms</span>
                    </div>
                    {query.details && (
                      <div className="text-gray-500 text-xs truncate">
                        {typeof query.details === 'string' ? query.details : JSON.stringify(query.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No slow queries detected</p>
            )}
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-gray-400">Query Cache</h4>
              <button
                onClick={handleClearCache}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-800 rounded p-2 space-y-1">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="text-blue-400">
                  {debugInfo?.cache?.size || 0} / {debugInfo?.cache?.maxSize || 100}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hits:</span>
                <span className="text-green-400">{debugInfo?.cache?.hits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Misses:</span>
                <span className="text-yellow-400">{debugInfo?.cache?.misses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className={
                  parseFloat(debugInfo?.cache?.hitRate || '0') > 50
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }>
                  {debugInfo?.cache?.hitRate || '0%'}
                </span>
              </div>
            </div>

            {/* Cache effectiveness visualization */}
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400 mb-1">Cache Effectiveness</div>
              <div className="h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400"
                  style={{ width: debugInfo?.cache?.hitRate || '0%' }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'indexes' && (
          <div className="space-y-3">
            <h4 className="text-gray-400 mb-2">Active Indexes</h4>
            {debugInfo?.indexes && debugInfo.indexes.length > 0 ? (
              <div className="space-y-2">
                {debugInfo?.indexes?.map((index) => (
                  <div key={index.field} className="bg-gray-800 rounded p-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-blue-400">{index.field}</span>
                      <span className="text-gray-400 text-xs">{index.type}</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {index.entries} unique values
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No indexes configured</p>
            )}

            <div className="mt-4 p-2 bg-gray-800 rounded">
              <p className="text-gray-400 text-xs">
                Indexes improve query performance for equality conditions.
                Configure index hints in JSONIC initialization for optimal performance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
        <div className="flex justify-between">
          <span>Auto-refresh: 2s</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};