import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

import * as jsonicApi from './api-jsonic';

// Use the current hostname when accessing remotely
const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.hostname}:3001/api`);

console.log('=== Database Configuration ===');
console.log('API_BASE:', API_BASE);
console.log('Current hostname:', window.location.hostname);
console.log('Using JSONIC database');
console.log('==============================');

export async function fetchBenchmarkRuns(): Promise<BenchmarkRun[]> {
  console.log('Fetching benchmark runs from JSONIC');
  return await jsonicApi.fetchBenchmarkRuns();
}

export async function fetchModelPerformance(runId?: string): Promise<ModelPerformance[]> {
  console.log('Fetching model performance from JSONIC');
  return await jsonicApi.fetchModelPerformance(runId);
}

export async function fetchTestResults(runId: string): Promise<TestResult[]> {
  console.log('Fetching test results from JSONIC');
  return await jsonicApi.fetchTestResults(runId);
}

export async function fetchPerformanceTrends(): Promise<PerformanceTrend[]> {
  console.log('Fetching performance trends from JSONIC');
  return await jsonicApi.fetchPerformanceTrends();
}

export async function fetchCategoryPerformance(runId?: string): Promise<CategoryPerformance[]> {
  console.log('Fetching category performance from JSONIC');
  return await jsonicApi.fetchCategoryPerformance(runId);
}

export async function fetchStats() {
  console.log('Fetching stats from JSONIC');
  return await jsonicApi.fetchStats();
}