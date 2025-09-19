import type { ModelPerformance } from '../types/benchmark';
import { cn, formatDuration, formatPercentage, formatTokens } from '../lib/utils';

interface ModelComparisonTableProps {
  performance: ModelPerformance[];
}

export default function ModelComparisonTable({ performance }: ModelComparisonTableProps) {
  const sortedPerformance = [...performance].sort((a, b) => b.success_rate - a.success_rate);

  const getBadgeColor = (successRate: number) => {
    if (successRate >= 95) return 'bg-success-50 text-success-700';
    if (successRate >= 80) return 'bg-warning-50 text-warning-700';
    return 'bg-error-50 text-error-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Model
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Success Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Avg TTFT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Throughput
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Tokens
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cost/1K
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quality
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedPerformance.map((model) => (
            <tr key={`${model.provider}-${model.model}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {model.model.replace(/-\d{8}$/, '')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {model.provider}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={cn(
                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                  getBadgeColor(model.success_rate)
                )}>
                  {formatPercentage(model.success_rate)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                <div className="flex flex-col">
                  <span>{formatDuration(model.avg_ttft_ms)}</span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(model.min_ttft_ms)} - {formatDuration(model.max_ttft_ms)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {model.avg_tokens_per_second.toFixed(1)} tok/s
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {formatTokens(model.total_tokens_generated)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={cn(
                  'font-medium',
                  model.cost_per_1k_tokens < 0.002 ? 'text-success-600' : 
                  model.cost_per_1k_tokens < 0.005 ? 'text-warning-600' : 'text-error-600'
                )}>
                  ${(model.cost_per_1k_tokens * 1000).toFixed(3)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {model.avg_quality_score > 0 ? (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-16">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${model.avg_quality_score * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                      {(model.avg_quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}