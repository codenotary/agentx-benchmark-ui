import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

interface JsonicDB {
  insert(json: string): any;
  get(id: string): any;
  update(id: string, json: string): any;
  delete(id: string): any;
  list_ids(): any;
  stats(): any;
  query?(filter: any): any;
}

let db: JsonicDB | null = null;
let initPromise: Promise<JsonicDB | null> | null = null;

async function initJsonicDatabase(): Promise<JsonicDB> {
  if (initPromise) {
    const result = await initPromise;
    if (result) return result;
    throw new Error('Database initialization failed');
  }
  
  if (db) {
    return db;
  }
  
  initPromise = (async () => {
    try {
      // Dynamic import of JSONIC WASM module
      // This would need to be properly configured for production
      // For now, this is a placeholder that will fail gracefully
      const jsonic = await (window as any).loadJsonicWasm?.() || 
        await Promise.reject(new Error('JSONIC not available'));
      
      await jsonic.default();
      
      // Create new database instance
      db = new jsonic.JsonDB();
      
      console.log('JSONIC database initialized successfully');
      return db;
    } catch (error) {
      console.error('Failed to initialize JSONIC database:', error);
      db = null;
      initPromise = null;
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  })();
  
  const result = await initPromise;
  if (result) return result;
  throw new Error('Failed to initialize JSONIC database');
}

// Helper to store data with type tagging
function createDocument(type: string, data: any, runId?: string): string {
  const doc = {
    _type: type,
    _runId: runId,
    _timestamp: new Date().toISOString(),
    ...data
  };
  return JSON.stringify(doc);
}

// Helper to parse results
function parseResult(result: any): any {
  if (!result) return null;
  
  if (result.success && result.data) {
    // Handle document structure from JSONIC
    if (result.data.content) {
      return result.data.content;
    }
    return result.data;
  }
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result;
}

export async function storeBenchmarkRun(run: BenchmarkRun): Promise<string> {
  const jsonicDb = await initJsonicDatabase();
  const doc = createDocument('benchmark_run', run);
  const result = jsonicDb.insert(doc);
  return parseResult(result);
}

export async function storeModelPerformance(perf: ModelPerformance, runId: string): Promise<string> {
  const jsonicDb = await initJsonicDatabase();
  const doc = createDocument('model_performance', perf, runId);
  const result = jsonicDb.insert(doc);
  return parseResult(result);
}

export async function storeTestResult(test: TestResult, runId: string): Promise<string> {
  const jsonicDb = await initJsonicDatabase();
  const doc = createDocument('test_result', test, runId);
  const result = jsonicDb.insert(doc);
  return parseResult(result);
}

export async function fetchBenchmarkRunsJsonic(): Promise<BenchmarkRun[]> {
  const jsonicDb = await initJsonicDatabase();
  
  // Get all document IDs
  const idsResult = jsonicDb.list_ids();
  const ids = parseResult(idsResult) || [];
  
  // Filter and retrieve benchmark runs
  const runs: BenchmarkRun[] = [];
  for (const id of ids) {
    const docResult = jsonicDb.get(id);
    const doc = parseResult(docResult);
    
    if (doc && doc._type === 'benchmark_run') {
      const { _type, _runId, _timestamp, ...runData } = doc;
      runs.push(runData as BenchmarkRun);
    }
  }
  
  // Sort by timestamp descending
  runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return runs;
}

export async function fetchModelPerformanceJsonic(runId?: string): Promise<ModelPerformance[]> {
  const jsonicDb = await initJsonicDatabase();
  
  // Get all document IDs
  const idsResult = jsonicDb.list_ids();
  const ids = parseResult(idsResult) || [];
  
  // Filter and retrieve model performance data
  const performances: ModelPerformance[] = [];
  let latestRunId = runId;
  
  // If no runId specified or 'latest', find the latest run
  if (!runId || runId === 'latest') {
    const runs = await fetchBenchmarkRunsJsonic();
    if (runs.length > 0) {
      latestRunId = runs[0].run_id;
    }
  }
  
  for (const id of ids) {
    const docResult = jsonicDb.get(id);
    const doc = parseResult(docResult);
    
    if (doc && doc._type === 'model_performance' && doc._runId === latestRunId) {
      const { _type, _runId, _timestamp, ...perfData } = doc;
      performances.push(perfData as ModelPerformance);
    }
  }
  
  // Sort by provider and model
  performances.sort((a, b) => {
    const providerComp = a.provider.localeCompare(b.provider);
    if (providerComp !== 0) return providerComp;
    return a.model.localeCompare(b.model);
  });
  
  return performances;
}

export async function fetchTestResultsJsonic(runId: string): Promise<TestResult[]> {
  const jsonicDb = await initJsonicDatabase();
  
  // Get all document IDs
  const idsResult = jsonicDb.list_ids();
  const ids = parseResult(idsResult) || [];
  
  // Filter and retrieve test results
  const tests: TestResult[] = [];
  
  for (const id of ids) {
    const docResult = jsonicDb.get(id);
    const doc = parseResult(docResult);
    
    if (doc && doc._type === 'test_result' && doc._runId === runId) {
      const { _type, _runId, _timestamp, ...testData } = doc;
      tests.push(testData as TestResult);
    }
  }
  
  // Sort by timestamp descending and limit to 500
  tests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return tests.slice(0, 500);
}

export async function fetchPerformanceTrendsJsonic(): Promise<PerformanceTrend[]> {
  const jsonicDb = await initJsonicDatabase();
  
  // Get all document IDs
  const idsResult = jsonicDb.list_ids();
  const ids = parseResult(idsResult) || [];
  
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Filter and retrieve performance trends
  const trends: PerformanceTrend[] = [];
  
  for (const id of ids) {
    const docResult = jsonicDb.get(id);
    const doc = parseResult(docResult);
    
    if (doc && doc._type === 'performance_trend') {
      const { _type, _runId, _timestamp, ...trendData } = doc;
      const recordedAt = new Date(trendData.recorded_at);
      
      if (recordedAt >= sevenDaysAgo) {
        trends.push(trendData as PerformanceTrend);
      }
    }
  }
  
  // Sort by recorded_at descending and limit to 100
  trends.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  
  return trends.slice(0, 100);
}

export async function fetchCategoryPerformanceJsonic(runId?: string): Promise<CategoryPerformance[]> {
  await initJsonicDatabase();
  
  // Get test results for the run
  let targetRunId = runId;
  
  if (!runId || runId === 'latest') {
    const runs = await fetchBenchmarkRunsJsonic();
    if (runs.length > 0) {
      targetRunId = runs[0].run_id;
    }
  }
  
  if (!targetRunId) {
    return [];
  }
  
  const testResults = await fetchTestResultsJsonic(targetRunId);
  
  // Group by category, provider, and model to calculate averages
  const categoryMap = new Map<string, CategoryPerformance>();
  
  testResults.forEach(test => {
    const key = `${test.category}-${test.provider}-${test.model}`;
    
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: test.category,
        provider: test.provider,
        model: test.model,
        avg_ttft_ms: 0,
        avg_total_time_ms: 0,
        total_tests: 0,
        success_rate: 0,
        _ttft_sum: 0,
        _total_time_sum: 0,
        _success_count: 0,
        _test_count: 0
      } as any);
    }
    
    const perf = categoryMap.get(key) as any;
    perf._test_count++;
    perf._ttft_sum += test.time_to_first_token_ms || 0;
    perf._total_time_sum += test.total_time_ms || 0;
    if (test.success) perf._success_count++;
  });
  
  // Calculate averages
  const results: CategoryPerformance[] = [];
  categoryMap.forEach(perf => {
    const p = perf as any;
    results.push({
      category: p.category,
      provider: p.provider,
      model: p.model,
      avg_ttft_ms: p._test_count > 0 ? p._ttft_sum / p._test_count : 0,
      avg_total_time_ms: p._test_count > 0 ? p._total_time_sum / p._test_count : 0,
      total_tests: p._test_count,
      success_rate: p._test_count > 0 ? (p._success_count / p._test_count) * 100 : 0
    });
  });
  
  return results;
}

export async function fetchStatsJsonic() {
  const jsonicDb = await initJsonicDatabase();
  
  const statsResult = jsonicDb.stats();
  const stats = parseResult(statsResult);
  
  // Get all document IDs to count by type
  const idsResult = jsonicDb.list_ids();
  const ids = parseResult(idsResult) || [];
  
  const typeCounts = {
    benchmark_runs: 0,
    model_performance: 0,
    test_results: 0,
    performance_trends: 0
  };
  
  for (const id of ids) {
    const docResult = jsonicDb.get(id);
    const doc = parseResult(docResult);
    
    if (doc && doc._type) {
      switch (doc._type) {
        case 'benchmark_run':
          typeCounts.benchmark_runs++;
          break;
        case 'model_performance':
          typeCounts.model_performance++;
          break;
        case 'test_result':
          typeCounts.test_results++;
          break;
        case 'performance_trend':
          typeCounts.performance_trends++;
          break;
      }
    }
  }
  
  return {
    total_documents: stats?.document_count || 0,
    ...typeCounts
  };
}

// Migration function to import existing JSON data
export async function migrateJsonDataToJsonic(jsonData: any): Promise<void> {
  console.log('Starting migration to JSONIC database...');
  
  const jsonicDb = await initJsonicDatabase();
  
  let migrated = 0;
  
  // Migrate benchmark runs
  if (jsonData.benchmark_runs) {
    for (const run of jsonData.benchmark_runs) {
      await storeBenchmarkRun(run);
      migrated++;
    }
    console.log(`Migrated ${jsonData.benchmark_runs.length} benchmark runs`);
  }
  
  // Migrate model performance
  if (jsonData.model_performance) {
    for (const perf of jsonData.model_performance) {
      await storeModelPerformance(perf, perf.run_id);
      migrated++;
    }
    console.log(`Migrated ${jsonData.model_performance.length} model performance records`);
  }
  
  // Migrate test results
  if (jsonData.test_results) {
    for (const test of jsonData.test_results) {
      await storeTestResult(test, test.run_id);
      migrated++;
    }
    console.log(`Migrated ${jsonData.test_results.length} test results`);
  }
  
  // Store performance trends
  if (jsonData.performance_trends) {
    for (const trend of jsonData.performance_trends) {
      const doc = createDocument('performance_trend', trend);
      const result = jsonicDb.insert(doc);
      parseResult(result);
      migrated++;
    }
    console.log(`Migrated ${jsonData.performance_trends.length} performance trends`);
  }
  
  console.log(`Migration complete! Total documents migrated: ${migrated}`);
}