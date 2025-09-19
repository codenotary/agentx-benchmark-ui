export interface BenchmarkRun {
  id: number;
  run_id: string;
  name: string;
  timestamp: string;
  iterations: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  metadata?: string;
}

export interface ModelPerformance {
  id: number;
  run_id: string;
  provider: string;
  model: string;
  timestamp: string;
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  success_rate: number;
  avg_ttft_ms: number;
  min_ttft_ms: number;
  max_ttft_ms: number;
  avg_total_time_ms: number;
  avg_tokens_per_second: number;
  total_tokens_generated: number;
  avg_quality_score: number;
  total_cost_usd: number;
  avg_cost_per_test: number;
  cost_per_1k_tokens: number;
}

export interface TestResult {
  id: number;
  run_id: string;
  timestamp: string;
  provider: string;
  model: string;
  prompt_id: string;
  prompt_text: string;
  category: string;
  iteration: number;
  time_to_first_token_ms: number;
  total_time_ms: number;
  tokens_generated: number;
  tokens_per_second: number;
  quality_score?: number;
  success: boolean;
  error_message?: string;
  response?: string;
  estimated_cost_usd: number;
}

export interface PerformanceTrend {
  provider: string;
  model: string;
  metric_name: string;
  metric_value: number;
  recorded_at: string;
  previous_value?: number;
  change_percentage?: number;
  is_regression: boolean;
}

export interface CategoryPerformance {
  category: string;
  provider: string;
  model: string;
  avg_ttft_ms: number;
  avg_total_time_ms: number;
  success_rate: number;
  total_tests: number;
}