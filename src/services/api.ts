import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

// Import database configuration
import { DB_CONFIG, FEATURES } from '../config/database';

// Import SQLite database functions
import {
  fetchBenchmarkRunsStatic,
  fetchModelPerformanceStatic,
  fetchTestResultsStatic,
  fetchPerformanceTrendsStatic,
  fetchCategoryPerformanceStatic,
  fetchStatsStatic
} from './sqliteApi';

// Import JSONIC database functions
import * as jsonicApi from './api-jsonic';

// Use the current hostname when accessing remotely
const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.hostname}:3001/api`);

console.log('=== Database Configuration ===');
console.log('API_BASE:', API_BASE);
console.log('Current hostname:', window.location.hostname);
console.log('Database mode:', DB_CONFIG.mode);
console.log('Using JSONIC:', FEATURES.useJsonic);
console.log('==============================');

export async function fetchBenchmarkRuns(): Promise<BenchmarkRun[]> {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching benchmark runs from JSONIC');
      return await jsonicApi.fetchBenchmarkRuns();
    } else {
      console.log('Fetching benchmark runs from SQLite/JSON');
      return await fetchBenchmarkRunsStatic();
    }
  } catch (error) {
    console.error('Failed to fetch benchmark runs from database:', error);
    throw error;
  }
}

export async function fetchModelPerformance(runId?: string): Promise<ModelPerformance[]> {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching model performance from JSONIC');
      return await jsonicApi.fetchModelPerformance(runId);
    } else {
      console.log('Fetching model performance from SQLite/JSON');
      return await fetchModelPerformanceStatic(runId);
    }
  } catch (error) {
    console.error('Failed to fetch model performance from database:', error);
    throw error;
  }
}

export async function fetchTestResults(runId: string): Promise<TestResult[]> {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching test results from JSONIC');
      return await jsonicApi.fetchTestResults(runId);
    } else {
      console.log('Fetching test results from SQLite/JSON');
      return await fetchTestResultsStatic(runId);
    }
  } catch (error) {
    console.error('Failed to fetch test results from database:', error);
    throw error;
  }
}

export async function fetchPerformanceTrends(): Promise<PerformanceTrend[]> {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching performance trends from JSONIC');
      return await jsonicApi.fetchPerformanceTrends();
    } else {
      console.log('Fetching performance trends from SQLite/JSON');
      return await fetchPerformanceTrendsStatic();
    }
  } catch (error) {
    console.error('Failed to fetch performance trends from database:', error);
    throw error;
  }
}

export async function fetchCategoryPerformance(runId?: string): Promise<CategoryPerformance[]> {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching category performance from JSONIC');
      return await jsonicApi.fetchCategoryPerformance(runId);
    } else {
      console.log('Fetching category performance from SQLite/JSON');
      return await fetchCategoryPerformanceStatic(runId);
    }
  } catch (error) {
    console.error('Failed to fetch category performance from database:', error);
    throw error;
  }
}

// Export fetchStats function
export async function fetchStats() {
  try {
    if (FEATURES.useJsonic) {
      console.log('Fetching stats from JSONIC');
      return await jsonicApi.fetchStats();
    } else {
      console.log('Fetching stats from SQLite/JSON');
      return await fetchStatsStatic();
    }
  } catch (error) {
    console.error('Failed to fetch stats from database:', error);
    throw error;
  }
}