import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Clock, 
  DollarSign,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { 
  fetchBenchmarkRuns, 
  fetchModelPerformance, 
  fetchPerformanceTrends,
  fetchCategoryPerformance
} from '../services/api';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import ModelComparisonTable from './ModelComparisonTable';
import CategoryBreakdown from './CategoryBreakdown';
import RecentRuns from './RecentRuns';
import TrendIndicators from './TrendIndicators';
import TestResultsTable from './TestResultsTable';
import PromptSummary from './PromptSummary';

export default function Dashboard() {
  const [isTestResultsExpanded, setIsTestResultsExpanded] = useState(false);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(true);
  const [isModelComparisonExpanded, setIsModelComparisonExpanded] = useState(true);
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['benchmarkRuns'],
    queryFn: fetchBenchmarkRuns,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['modelPerformance'],
    queryFn: () => fetchModelPerformance(),
    refetchInterval: 60000,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['performanceTrends'],
    queryFn: fetchPerformanceTrends,
    refetchInterval: 60000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categoryPerformance'],
    queryFn: () => fetchCategoryPerformance(),
    refetchInterval: 60000,
  });

  const latestRun = runs?.[0];
  const totalTests = latestRun?.total_runs || 0;
  const successRate = latestRun 
    ? (latestRun.successful_runs / latestRun.total_runs) * 100 
    : 0;
  const avgTTFT = performance
    ? performance.reduce((acc, p) => acc + p.avg_ttft_ms, 0) / performance.length
    : 0;
  const totalCost = performance
    ? performance.reduce((acc, p) => acc + p.total_cost_usd, 0)
    : 0;

  if (runsLoading || perfLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AgentX Benchmark Dashboard
              </h1>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {latestRun ? new Date(latestRun.timestamp).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Tests"
            value={totalTests}
            icon={<Activity className="h-5 w-5" />}
            trend={runs && runs.length > 1 
              ? ((runs[0].total_runs - runs[1].total_runs) / runs[1].total_runs) * 100
              : 0}
            format="number"
          />
          <MetricCard
            title="Success Rate"
            value={successRate}
            icon={<CheckCircle className="h-5 w-5" />}
            trend={runs && runs.length > 1 
              ? successRate - (runs[1].successful_runs / runs[1].total_runs) * 100
              : 0}
            format="percentage"
            invertTrend={false}
          />
          <MetricCard
            title="Avg TTFT"
            value={avgTTFT}
            icon={<Clock className="h-5 w-5" />}
            trend={trends 
              ? trends.find(t => t.metric_name === 'avg_ttft_ms')?.change_percentage || 0
              : 0}
            format="duration"
            invertTrend={true}
          />
          <MetricCard
            title="Total Cost"
            value={totalCost}
            icon={<DollarSign className="h-5 w-5" />}
            trend={0}
            format="currency"
            invertTrend={true}
          />
        </div>

        {/* Performance Trends */}
        {trends && !trendsLoading && (
          <div className="mb-8">
            <TrendIndicators trends={trends} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart 
            performance={performance || []} 
            title="Response Time by Model"
            metric="ttft"
          />
          <PerformanceChart 
            performance={performance || []} 
            title="Success Rate by Model"
            metric="success"
          />
        </div>

        {/* Model Comparison Table - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div 
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={() => setIsModelComparisonExpanded(!isModelComparisonExpanded)}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Model Performance Comparison
              </h2>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                {isModelComparisonExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
          {isModelComparisonExpanded && (
            <ModelComparisonTable performance={performance || []} />
          )}
        </div>

        {/* Category Breakdown and Recent Runs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CategoryBreakdown categories={categories || []} />
          <RecentRuns runs={runs || []} />
        </div>

        {/* Prompt Summary - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div 
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Test Prompts Overview
                </h2>
              </div>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                {isPromptsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
          {isPromptsExpanded && (
            <PromptSummary runId={latestRun?.run_id} />
          )}
        </div>

        {/* Detailed Test Results - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div 
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={() => setIsTestResultsExpanded(!isTestResultsExpanded)}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Test Results
              </h2>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                {isTestResultsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
          {isTestResultsExpanded && (
            <TestResultsTable runId={latestRun?.run_id} />
          )}
        </div>
      </main>
    </div>
  );
}