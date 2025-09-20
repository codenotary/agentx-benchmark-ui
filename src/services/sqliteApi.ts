import * as Comlink from 'comlink';
import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

// Worker interface
interface SqliteWorker {
  init(dbUrl: string): Promise<boolean>;
  query(sql: string, params?: any[]): Promise<any[]>;
  close(): Promise<void>;
}

let worker: Worker | null = null;
let sqliteApi: Comlink.Remote<SqliteWorker> | null = null;
let initPromise: Promise<Comlink.Remote<SqliteWorker> | null> | null = null;

async function initDatabase() {
  // Return existing initialization promise if one is in progress
  if (initPromise) {
    return initPromise;
  }
  
  // Return existing API if already initialized
  if (sqliteApi) {
    return sqliteApi;
  }
  
  // Start initialization
  initPromise = (async () => {
    try {
      // Create worker
      worker = new Worker(
        new URL('./sqlite.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Wrap with Comlink
      sqliteApi = Comlink.wrap<SqliteWorker>(worker);
      
      // Initialize with the base URL for the database files
      const base = import.meta.env.BASE_URL || '/';
      const baseUrl = `${window.location.origin}${base}`;
      console.log('Initializing SQLite database with baseUrl:', baseUrl);
      
      await sqliteApi.init(baseUrl);
      console.log('SQLite database initialized successfully');
      
      return sqliteApi;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      // Clear state on error
      sqliteApi = null;
      initPromise = null;
      if (worker) {
        worker.terminate();
        worker = null;
      }
      throw error;
    }
  })();
  
  return initPromise;
}

export async function fetchBenchmarkRunsStatic(): Promise<BenchmarkRun[]> {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  const query = `
    SELECT * FROM benchmark_runs 
    ORDER BY timestamp DESC 
    LIMIT 100
  `;
  
  return db.query(query);
}

export async function fetchModelPerformanceStatic(runId?: string): Promise<ModelPerformance[]> {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  let query: string;
  
  if (runId && runId !== 'latest') {
    query = `
      SELECT * FROM model_performance 
      WHERE run_id = '${runId}'
      ORDER BY provider, model
    `;
  } else {
    query = `
      SELECT * FROM model_performance 
      WHERE run_id = (
        SELECT run_id FROM benchmark_runs 
        ORDER BY timestamp DESC 
        LIMIT 1
      )
      ORDER BY provider, model
    `;
  }
  
  return db.query(query);
}

export async function fetchTestResultsStatic(runId: string): Promise<TestResult[]> {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  const query = `
    SELECT * FROM test_results 
    WHERE run_id = '${runId}'
    ORDER BY timestamp DESC
    LIMIT 500
  `;
  
  return db.query(query);
}

export async function fetchPerformanceTrendsStatic(): Promise<PerformanceTrend[]> {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  const query = `
    SELECT * FROM performance_trends 
    WHERE recorded_at >= datetime('now', '-7 days')
    ORDER BY recorded_at DESC
    LIMIT 100
  `;
  
  return db.query(query);
}

export async function fetchCategoryPerformanceStatic(runId?: string): Promise<CategoryPerformance[]> {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  let query: string;
  
  if (runId && runId !== 'latest') {
    query = `
      SELECT 
        category,
        provider,
        model,
        AVG(time_to_first_token_ms) as avg_ttft_ms,
        AVG(total_time_ms) as avg_total_time_ms,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        COUNT(*) as total_tests
      FROM test_results
      WHERE run_id = '${runId}'
      GROUP BY category, provider, model
      ORDER BY category, provider, model
    `;
  } else {
    query = `
      SELECT 
        category,
        provider,
        model,
        AVG(time_to_first_token_ms) as avg_ttft_ms,
        AVG(total_time_ms) as avg_total_time_ms,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        COUNT(*) as total_tests
      FROM test_results
      WHERE run_id = (
        SELECT run_id FROM benchmark_runs 
        ORDER BY timestamp DESC 
        LIMIT 1
      )
      GROUP BY category, provider, model
      ORDER BY category, provider, model
    `;
  }
  
  return db.query(query);
}

export async function fetchStatsStatic() {
  const db = await initDatabase();
  if (!db) throw new Error('Database initialization failed');
  
  const queries = {
    totalRuns: `SELECT COUNT(*) as count FROM benchmark_runs`,
    totalTests: `SELECT SUM(total_runs) as count FROM benchmark_runs`,
    avgSuccessRate: `
      SELECT AVG(successful_runs * 100.0 / total_runs) as rate 
      FROM benchmark_runs
    `,
    modelCount: `SELECT COUNT(DISTINCT provider || '/' || model) as count FROM model_performance`,
    latestRun: `SELECT * FROM benchmark_runs ORDER BY timestamp DESC LIMIT 1`
  };
  
  const results: any = {};
  
  for (const [key, sql] of Object.entries(queries)) {
    const result = await db.query(sql);
    results[key] = result[0] || {};
  }
  
  return results;
}

// Cleanup function
export async function closeDatabaseConnection() {
  if (sqliteApi) {
    await sqliteApi.close();
    sqliteApi = null;
    initPromise = null;
  }
  if (worker) {
    worker.terminate();
    worker = null;
  }
}