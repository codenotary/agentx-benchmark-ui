// Database configuration for benchmark.db
export const DATABASE_CONFIG = {
  fileSize: 491520,
  chunkSize: 4096,
  lastUpdated: new Date().toISOString(),
  dbPath: '/benchmark.db',
  tables: [
    'benchmark_runs',
    'test_results', 
    'model_performance',
    'category_performance',
    'model_comparison',
    'performance_trends',
    'latest_model_performance'
  ]
};