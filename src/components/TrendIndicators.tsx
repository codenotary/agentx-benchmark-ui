import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { PerformanceTrend } from '../types/benchmark';

interface TrendIndicatorsProps {
  trends: PerformanceTrend[];
}

export default function TrendIndicators({ trends }: TrendIndicatorsProps) {
  // Find significant trends
  const regressions = trends.filter(t => t.is_regression);
  const improvements = trends.filter(t => !t.is_regression && t.change_percentage && t.change_percentage < -10);
  
  if (regressions.length === 0 && improvements.length === 0) {
    return null;
  }

  const formatModelName = (provider: string, model: string) => {
    return `${provider}/${model.replace(/-\d{8}$/, '')}`;
  };

  return (
    <div className="space-y-4">
      {regressions.length > 0 && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-error-800 dark:text-error-200 mb-2">
                Performance Regressions Detected
              </h3>
              <div className="space-y-1">
                {regressions.slice(0, 3).map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-error-700 dark:text-error-300">
                      {formatModelName(trend.provider, trend.model)} - {trend.metric_name}
                    </span>
                    <span className="font-medium text-error-800 dark:text-error-200">
                      <TrendingDown className="inline h-4 w-4 mr-1" />
                      {Math.abs(trend.change_percentage || 0).toFixed(1)}% slower
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="h-5 w-5 text-success-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-success-800 dark:text-success-200 mb-2">
                Performance Improvements
              </h3>
              <div className="space-y-1">
                {improvements.slice(0, 3).map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-success-700 dark:text-success-300">
                      {formatModelName(trend.provider, trend.model)} - {trend.metric_name}
                    </span>
                    <span className="font-medium text-success-800 dark:text-success-200">
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                      {Math.abs(trend.change_percentage || 0).toFixed(1)}% faster
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}