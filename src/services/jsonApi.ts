import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

let cachedData: any = null;

async function loadDatabase() {
  if (cachedData) return cachedData;
  
  const base = import.meta.env.BASE_URL || '/';
  const dbUrl = `${window.location.origin}${base}data/database.min.json`;
  
  console.log('Loading JSON database from:', dbUrl);
  
  const response = await fetch(dbUrl);
  if (!response.ok) {
    throw new Error(`Failed to load database: ${response.status} ${response.statusText}`);
  }
  
  cachedData = await response.json();
  console.log('Database loaded successfully');
  return cachedData;
}

export async function fetchBenchmarkRunsStatic(): Promise<BenchmarkRun[]> {
  const data = await loadDatabase();
  return data.benchmark_runs || [];
}

export async function fetchModelPerformanceStatic(runId?: string): Promise<ModelPerformance[]> {
  const data = await loadDatabase();
  const allPerformance = data.model_performance || [];
  
  if (runId && runId !== 'latest') {
    return allPerformance.filter((p: ModelPerformance) => p.run_id === runId);
  }
  
  // Get latest run's performance
  const runs = data.benchmark_runs || [];
  if (runs.length === 0) return [];
  
  const latestRun = runs.sort((a: BenchmarkRun, b: BenchmarkRun) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  
  return allPerformance.filter((p: ModelPerformance) => p.run_id === latestRun.run_id);
}

export async function fetchTestResultsStatic(runId: string): Promise<TestResult[]> {
  const data = await loadDatabase();
  const allResults = data.test_results || [];
  return allResults.filter((r: TestResult) => r.run_id === runId);
}

export async function fetchPerformanceTrendsStatic(): Promise<PerformanceTrend[]> {
  const data = await loadDatabase();
  return data.performance_trends || [];
}

export async function fetchCategoryPerformanceStatic(runId?: string): Promise<CategoryPerformance[]> {
  const data = await loadDatabase();
  
  if (!runId || runId === 'latest') {
    // Return pre-computed category performance for all data
    return data.category_performance || [];
  }
  
  // Filter test results for specific run and compute category performance
  const testResults = data.test_results || [];
  const runResults = testResults.filter((r: TestResult) => r.run_id === runId);
  
  // Group by category, provider, model
  const grouped: { [key: string]: TestResult[] } = {};
  
  for (const result of runResults) {
    const key = `${result.category}|${result.provider}|${result.model}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(result);
  }
  
  // Compute averages
  const categoryPerformance: CategoryPerformance[] = [];
  
  for (const [key, results] of Object.entries(grouped)) {
    const [category, provider, model] = key.split('|');
    
    const successCount = results.filter(r => r.success).length;
    const avgTtft = results.reduce((sum, r) => sum + (r.time_to_first_token_ms || 0), 0) / results.length;
    const avgTotalTime = results.reduce((sum, r) => sum + (r.total_time_ms || 0), 0) / results.length;
    
    categoryPerformance.push({
      category,
      provider,
      model,
      avg_ttft_ms: avgTtft,
      avg_total_time_ms: avgTotalTime,
      success_rate: (successCount / results.length) * 100,
      total_tests: results.length
    });
  }
  
  return categoryPerformance;
}

export async function fetchStatsStatic() {
  const data = await loadDatabase();
  
  const runs = data.benchmark_runs || [];
  const modelPerformance = data.model_performance || [];
  
  const totalRuns = runs.length;
  const totalTests = runs.reduce((sum: number, run: BenchmarkRun) => sum + (run.total_runs || 0), 0);
  const avgSuccessRate = runs.reduce((sum: number, run: BenchmarkRun) => {
    const rate = run.successful_runs ? (run.successful_runs * 100.0 / run.total_runs) : 0;
    return sum + rate;
  }, 0) / (runs.length || 1);
  
  // Count unique models
  const uniqueModels = new Set(modelPerformance.map((m: ModelPerformance) => `${m.provider}/${m.model}`));
  
  return {
    totalRuns: { count: totalRuns },
    totalTests: { count: totalTests },
    avgSuccessRate: { rate: avgSuccessRate },
    modelCount: { count: uniqueModels.size },
    latestRun: runs.length > 0 ? runs.sort((a: BenchmarkRun, b: BenchmarkRun) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0] : {}
  };
}