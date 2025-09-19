import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDuration, formatCost, formatPercentage } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: number;
  format: 'number' | 'percentage' | 'duration' | 'currency';
  invertTrend?: boolean;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend = 0,
  format,
  invertTrend = false,
}: MetricCardProps) {
  const formatValue = () => {
    switch (format) {
      case 'percentage':
        return formatPercentage(value);
      case 'duration':
        return formatDuration(value);
      case 'currency':
        return formatCost(value);
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (Math.abs(trend) < 0.5) {
      return <Minus className="h-4 w-4" />;
    }
    return trend > 0 
      ? <TrendingUp className="h-4 w-4" />
      : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (Math.abs(trend) < 0.5) return 'text-gray-500';
    const isPositive = trend > 0;
    const isGood = invertTrend ? !isPositive : isPositive;
    return isGood ? 'text-success-500' : 'text-error-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          {icon}
        </span>
      </div>
      
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue()}
        </span>
        
        {trend !== 0 && (
          <div className={cn('flex items-center text-sm', getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-1">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}