import type {
  BenchmarkRun,
  ModelPerformance,
  TestResult,
  PerformanceTrend,
  CategoryPerformance
} from '../types/benchmark';

// Import JSONIC database functions
import {
  fetchBenchmarkRunsJsonic,
  fetchModelPerformanceJsonic,
  fetchTestResultsJsonic,
  fetchPerformanceTrendsJsonic,
  fetchCategoryPerformanceJsonic,
  fetchStatsJsonic
} from './jsonicApi';

// Import migration utilities - use Web Worker for mobile compatibility
import { checkAndMigrateWorker } from './workerMigration';

// Track initialization
let initialized = false;
let initializationPromise: Promise<boolean> | null = null;

// Progress callback for migration
let migrationProgressCallback: ((progress: any) => void) | undefined;

export function setMigrationProgressCallback(callback: (progress: any) => void) {
  migrationProgressCallback = callback;
}

async function ensureInitialized() {
  if (initialized) return;
  
  // Ensure we only initialize once
  if (!initializationPromise) {
    // Use Web Worker migration for mobile and desktop compatibility
    initializationPromise = checkAndMigrateWorker(migrationProgressCallback);
  }
  
  const success = await initializationPromise;
  if (success) {
    initialized = true;
  }
}

export async function fetchBenchmarkRuns(): Promise<BenchmarkRun[]> {
  try {
    await ensureInitialized();
    return await fetchBenchmarkRunsJsonic();
  } catch (error) {
    console.error('Failed to fetch benchmark runs from JSONIC:', error);
    throw error;
  }
}

export async function fetchModelPerformance(runId?: string): Promise<ModelPerformance[]> {
  try {
    await ensureInitialized();
    return await fetchModelPerformanceJsonic(runId);
  } catch (error) {
    console.error('Failed to fetch model performance from JSONIC:', error);
    throw error;
  }
}

export async function fetchTestResults(runId: string): Promise<TestResult[]> {
  try {
    await ensureInitialized();
    return await fetchTestResultsJsonic(runId);
  } catch (error) {
    console.error('Failed to fetch test results from JSONIC:', error);
    throw error;
  }
}

export async function fetchPerformanceTrends(): Promise<PerformanceTrend[]> {
  try {
    await ensureInitialized();
    return await fetchPerformanceTrendsJsonic();
  } catch (error) {
    console.error('Failed to fetch performance trends from JSONIC:', error);
    throw error;
  }
}

export async function fetchCategoryPerformance(runId?: string): Promise<CategoryPerformance[]> {
  try {
    await ensureInitialized();
    return await fetchCategoryPerformanceJsonic(runId);
  } catch (error) {
    console.error('Failed to fetch category performance from JSONIC:', error);
    throw error;
  }
}

export async function fetchStats() {
  try {
    await ensureInitialized();
    return await fetchStatsJsonic();
  } catch (error) {
    console.error('Failed to fetch stats from JSONIC:', error);
    throw error;
  }
}