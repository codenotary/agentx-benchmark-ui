import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

// Import static SQLite functions
import {
  fetchBenchmarkRunsStatic,
  fetchModelPerformanceStatic,
  fetchTestResultsStatic,
  fetchPerformanceTrendsStatic,
  fetchCategoryPerformanceStatic,
} from './sqliteApi';

// Use the current hostname when accessing remotely
const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.hostname}:3001/api`);

console.log('API_BASE:', API_BASE);
console.log('Current hostname:', window.location.hostname);

// Configuration flags
const USE_MOCK_DATA = false;
// Use static SQLite when explicitly set or on production GitHub Pages
const USE_STATIC_SQLITE = import.meta.env.VITE_USE_STATIC_SQLITE === 'true' || 
                          (window.location.protocol === 'https:' && 
                           window.location.hostname.includes('github.io'));

console.log('USE_STATIC_SQLITE:', USE_STATIC_SQLITE);

export async function fetchBenchmarkRuns(): Promise<BenchmarkRun[]> {
  if (USE_MOCK_DATA) {
    return generateMockRuns();
  }
  
  if (USE_STATIC_SQLITE) {
    try {
      return await fetchBenchmarkRunsStatic();
    } catch (error) {
      console.error('Failed to fetch from static SQLite, falling back to API:', error);
      // Fall through to API if static fails
    }
  }
  
  try {
    console.log('Fetching from:', `${API_BASE}/benchmark/runs`);
    const response = await fetch(`${API_BASE}/benchmark/runs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch benchmark runs:', error);
    throw error;
  }
}

export async function fetchModelPerformance(runId?: string): Promise<ModelPerformance[]> {
  if (USE_MOCK_DATA) {
    return generateMockModelPerformance();
  }
  
  if (USE_STATIC_SQLITE) {
    try {
      return await fetchModelPerformanceStatic(runId);
    } catch (error) {
      console.error('Failed to fetch from static SQLite, falling back to API:', error);
    }
  }
  
  const url = runId 
    ? `${API_BASE}/benchmark/performance/${runId}`
    : `${API_BASE}/benchmark/performance/latest`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchTestResults(runId: string): Promise<TestResult[]> {
  if (USE_MOCK_DATA) {
    return generateMockTestResults();
  }
  
  if (USE_STATIC_SQLITE) {
    try {
      return await fetchTestResultsStatic(runId);
    } catch (error) {
      console.error('Failed to fetch from static SQLite, falling back to API:', error);
    }
  }
  
  const response = await fetch(`${API_BASE}/benchmark/results/${runId}`);
  return response.json();
}

export async function fetchPerformanceTrends(): Promise<PerformanceTrend[]> {
  if (USE_MOCK_DATA) {
    return generateMockTrends();
  }
  
  if (USE_STATIC_SQLITE) {
    try {
      return await fetchPerformanceTrendsStatic();
    } catch (error) {
      console.error('Failed to fetch from static SQLite, falling back to API:', error);
    }
  }
  
  const response = await fetch(`${API_BASE}/benchmark/trends`);
  return response.json();
}

export async function fetchCategoryPerformance(runId?: string): Promise<CategoryPerformance[]> {
  if (USE_MOCK_DATA) {
    return generateMockCategoryPerformance();
  }
  
  if (USE_STATIC_SQLITE) {
    try {
      return await fetchCategoryPerformanceStatic(runId);
    } catch (error) {
      console.error('Failed to fetch from static SQLite, falling back to API:', error);
    }
  }
  
  const url = runId
    ? `${API_BASE}/benchmark/categories/${runId}`
    : `${API_BASE}/benchmark/categories/latest`;
  const response = await fetch(url);
  return response.json();
}

// Mock data generators (unchanged)
function generateMockRuns(): BenchmarkRun[] {
  const now = new Date();
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    run_id: `bench-${Date.now() - i * 3600000}`,
    name: `Daily Benchmark ${i === 0 ? '(Latest)' : ''}`,
    timestamp: new Date(now.getTime() - i * 86400000).toISOString(),
    iterations: 3,
    total_runs: 144,
    successful_runs: Math.floor(140 - Math.random() * 20),
    failed_runs: Math.floor(4 + Math.random() * 20),
    metadata: JSON.stringify({ version: '1.0.0' })
  }));
}

function generateMockModelPerformance(): ModelPerformance[] {
  const models = [
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', baseTime: 2500 },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', baseTime: 3500 },
    { provider: 'gemini', model: 'gemini-2.0-flash-exp', baseTime: 1500 },
    { provider: 'gemini', model: 'gemini-1.5-pro-002', baseTime: 2000 },
    { provider: 'ollama', model: 'llama2', baseTime: 5000 },
  ];

  return models.map((m, i) => ({
    id: i + 1,
    run_id: `bench-${Date.now()}`,
    provider: m.provider,
    model: m.model,
    timestamp: new Date().toISOString(),
    total_tests: 50,
    successful_tests: Math.floor(45 + Math.random() * 5),
    failed_tests: Math.floor(Math.random() * 5),
    success_rate: 90 + Math.random() * 10,
    avg_ttft_ms: m.baseTime + Math.random() * 500,
    min_ttft_ms: m.baseTime - 500,
    max_ttft_ms: m.baseTime + 1500,
    avg_total_time_ms: m.baseTime + Math.random() * 1000,
    avg_tokens_per_second: 20 + Math.random() * 30,
    total_tokens_generated: 5000 + Math.floor(Math.random() * 5000),
    avg_quality_score: 0.8 + Math.random() * 0.2,
    total_cost_usd: Math.random() * 0.5,
    avg_cost_per_test: Math.random() * 0.01,
    cost_per_1k_tokens: 0.001 + Math.random() * 0.005,
  }));
}

function generateMockTestResults(): TestResult[] {
  const categories = ['math', 'coding', 'reasoning', 'technical', 'creative', 'mcp_tools'];
  const prompts = [
    'Calculate factorial',
    'Write Python function',
    'Logic puzzle',
    'Explain REST API',
    'Write haiku',
    'Query VM metrics'
  ];
  
  return Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    run_id: `bench-${Date.now()}`,
    timestamp: new Date().toISOString(),
    provider: ['anthropic', 'gemini', 'ollama'][i % 3],
    model: ['claude-3-5-haiku', 'gemini-2.0-flash', 'llama2'][i % 3],
    prompt_id: `prompt_${i % 6}`,
    prompt_text: prompts[i % 6],
    category: categories[i % 6],
    iteration: (i % 3) + 1,
    time_to_first_token_ms: 500 + Math.random() * 3000,
    total_time_ms: 1000 + Math.random() * 5000,
    tokens_generated: 50 + Math.floor(Math.random() * 500),
    tokens_per_second: 20 + Math.random() * 30,
    quality_score: Math.random() > 0.3 ? 0.7 + Math.random() * 0.3 : undefined,
    success: Math.random() > 0.1,
    error_message: Math.random() > 0.9 ? 'Rate limited' : undefined,
    estimated_cost_usd: Math.random() * 0.01,
  }));
}

function generateMockTrends(): PerformanceTrend[] {
  const metrics = ['avg_ttft_ms', 'success_rate', 'tokens_per_second'];
  return Array.from({ length: 15 }, (_, i) => ({
    provider: ['anthropic', 'gemini', 'ollama'][i % 3],
    model: ['claude-3-5-haiku', 'gemini-2.0-flash', 'llama2'][i % 3],
    metric_name: metrics[i % 3],
    metric_value: 1000 + Math.random() * 2000,
    recorded_at: new Date().toISOString(),
    previous_value: 1100 + Math.random() * 2000,
    change_percentage: -10 + Math.random() * 20,
    is_regression: Math.random() > 0.7,
  }));
}

function generateMockCategoryPerformance(): CategoryPerformance[] {
  const categories = ['math', 'coding', 'reasoning', 'technical', 'creative', 'mcp_tools'];
  const providers = [
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
    { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
  ];
  
  return categories.flatMap(category =>
    providers.map(p => ({
      category,
      provider: p.provider,
      model: p.model,
      avg_ttft_ms: 500 + Math.random() * 3000,
      avg_total_time_ms: 1000 + Math.random() * 5000,
      success_rate: 85 + Math.random() * 15,
      total_tests: 10 + Math.floor(Math.random() * 20),
    }))
  );
}