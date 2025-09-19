import { Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BenchmarkRun } from '../types/benchmark';
import { cn, formatPercentage } from '../lib/utils';

interface RecentRunsProps {
  runs: BenchmarkRun[];
}

export default function RecentRuns({ runs }: RecentRunsProps) {
  const getStatusIcon = (run: BenchmarkRun) => {
    const successRate = (run.successful_runs / run.total_runs) * 100;
    if (successRate >= 95) {
      return <CheckCircle className="h-5 w-5 text-success-500" />;
    } else if (successRate >= 80) {
      return <Clock className="h-5 w-5 text-warning-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-error-500" />;
    }
  };

  const getStatusColor = (run: BenchmarkRun) => {
    const successRate = (run.successful_runs / run.total_runs) * 100;
    if (successRate >= 95) return 'border-success-200 bg-success-50';
    if (successRate >= 80) return 'border-warning-200 bg-warning-50';
    return 'border-error-200 bg-error-50';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Benchmark Runs
      </h3>
      
      <div className="space-y-3">
        {runs.slice(0, 5).map((run, index) => (
          <div
            key={run.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors hover:shadow-md cursor-pointer',
              index === 0 ? getStatusColor(run) : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            )}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(run)}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {run.name || `Benchmark #${run.id}`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(run.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {run.successful_runs}/{run.total_runs}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatPercentage((run.successful_runs / run.total_runs) * 100)} success
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {runs.length > 5 && (
        <button className="mt-4 w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all {runs.length} runs →
        </button>
      )}
    </div>
  );
}