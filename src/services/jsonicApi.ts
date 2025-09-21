import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

import { jsonicService } from './jsonicService';

// Helper to create document with type tagging
function createDocument(type: string, data: any, runId?: string): any {
  return {
    _type: type,
    _runId: runId,
    _timestamp: new Date().toISOString(),
    ...data
  };
}

export async function storeBenchmarkRun(run: BenchmarkRun): Promise<string> {
  const doc = createDocument('benchmark_run', run);
  return await jsonicService.insert(doc);
}

export async function storeModelPerformance(perf: ModelPerformance, runId: string): Promise<string> {
  const doc = createDocument('model_performance', perf, runId);
  return await jsonicService.insert(doc);
}

export async function storeTestResult(test: TestResult, runId: string): Promise<string> {
  const doc = createDocument('test_result', test, runId);
  return await jsonicService.insert(doc);
}

export async function fetchBenchmarkRunsJsonic(): Promise<BenchmarkRun[]> {
  // Use MongoDB-like query with native sorting
  const docs = await jsonicService.findDocuments(
    { _type: 'benchmark_run' },
    { sort: [['timestamp', -1]] }
  );
  
  const runs: BenchmarkRun[] = docs.map(doc => {
    const { id, _type, _runId, _timestamp, ...runData } = doc;
    return runData as BenchmarkRun;
  });
  
  return runs;
}

export async function fetchModelPerformanceJsonic(runId?: string): Promise<ModelPerformance[]> {
  let latestRunId = runId;
  
  // If no runId specified or 'latest', find the latest run
  if (!runId || runId === 'latest') {
    const runs = await fetchBenchmarkRunsJsonic();
    if (runs.length > 0) {
      latestRunId = runs[0].run_id;
    }
  }
  
  // Use MongoDB-like query with compound filter and sorting
  const docs = await jsonicService.findDocuments(
    { _type: 'model_performance', _runId: latestRunId },
    { sort: [['provider', 1], ['model', 1]] }
  );
  
  const performances: ModelPerformance[] = docs.map(doc => {
    const { id, _type, _runId, _timestamp, ...perfData } = doc;
    return perfData as ModelPerformance;
  });
  
  // Group by unique model+provider and aggregate data
  const uniqueModels = new Map<string, ModelPerformance>();
  
  performances.forEach(perf => {
    const key = `${perf.provider}-${perf.model}`;
    const existing = uniqueModels.get(key);
    
    if (!existing) {
      uniqueModels.set(key, perf);
    } else {
      // Aggregate data - take averages and sums where appropriate
      uniqueModels.set(key, {
        ...existing,
        total_tests: existing.total_tests + perf.total_tests,
        successful_tests: existing.successful_tests + perf.successful_tests,
        failed_tests: existing.failed_tests + perf.failed_tests,
        avg_ttft_ms: (existing.avg_ttft_ms + perf.avg_ttft_ms) / 2,
        min_ttft_ms: Math.min(existing.min_ttft_ms, perf.min_ttft_ms),
        max_ttft_ms: Math.max(existing.max_ttft_ms, perf.max_ttft_ms),
        avg_total_time_ms: (existing.avg_total_time_ms + perf.avg_total_time_ms) / 2,
        total_tokens_generated: existing.total_tokens_generated + perf.total_tokens_generated,
        avg_tokens_per_second: (existing.avg_tokens_per_second + perf.avg_tokens_per_second) / 2,
        avg_quality_score: (existing.avg_quality_score + perf.avg_quality_score) / 2,
        cost_per_1k_tokens: perf.cost_per_1k_tokens, // Keep latest
        success_rate: ((existing.successful_tests + perf.successful_tests) / 
                      (existing.total_tests + perf.total_tests)) * 100
      });
    }
  });
  
  return Array.from(uniqueModels.values());
}

export async function fetchTestResultsJsonic(runId: string): Promise<TestResult[]> {
  // Use MongoDB-like query with filtering, sorting, and limit
  const docs = await jsonicService.findDocuments(
    { _type: 'test_result', _runId: runId },
    { sort: [['timestamp', -1]], limit: 500 }
  );
  
  const tests: TestResult[] = docs.map(doc => {
    const { id, _type, _runId, _timestamp, ...testData } = doc;
    return testData as TestResult;
  });
  
  return tests;
}

export async function fetchPerformanceTrendsJsonic(): Promise<PerformanceTrend[]> {
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isoDate = sevenDaysAgo.toISOString();
  
  // Use MongoDB-like query with $gte operator for date comparison
  const docs = await jsonicService.findDocuments(
    { 
      _type: 'performance_trend',
      recorded_at: { $gte: isoDate }
    },
    { sort: [['recorded_at', -1]], limit: 100 }
  );
  
  const trends: PerformanceTrend[] = docs.map(doc => {
    const { id, _type, _runId, _timestamp, ...trendData } = doc;
    return trendData as PerformanceTrend;
  });
  
  return trends;
}

export async function fetchCategoryPerformanceJsonic(runId?: string): Promise<CategoryPerformance[]> {
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
  const stats = await jsonicService.getStats();
  
  const ids = await jsonicService.listIds();
  
  const typeCounts = {
    benchmark_runs: 0,
    model_performance: 0,
    test_results: 0,
    performance_trends: 0
  };
  
  for (const id of ids) {
    const doc = await jsonicService.get(id);
    
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
    total_documents: stats?.document_count || ids.length || 0,
    ...typeCounts
  };
}

// Migration function to import existing JSON data
export async function migrateJsonDataToJsonic(jsonData: any): Promise<void> {
  console.log('Starting migration to JSONIC database...');
  
  await jsonicService.initialize();
  
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
      await jsonicService.insert(doc);
      migrated++;
    }
    console.log(`Migrated ${jsonData.performance_trends.length} performance trends`);
  }
  
  console.log(`Migration complete! Total documents migrated: ${migrated}`);
}