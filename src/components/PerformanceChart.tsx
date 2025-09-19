import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ModelPerformance } from '../types/benchmark';
import { formatDuration, formatPercentage } from '../lib/utils';

interface PerformanceChartProps {
  performance: ModelPerformance[];
  title: string;
  metric: 'ttft' | 'throughput' | 'success' | 'cost';
}

export default function PerformanceChart({ performance, title, metric }: PerformanceChartProps) {
  const data = performance.map(p => {
    const modelName = p.model.replace(/-\d{8}$/, '').replace('claude-3-5-', 'Claude ').replace('gemini-', 'Gemini ');
    
    switch (metric) {
      case 'ttft':
        return {
          model: modelName,
          value: p.avg_ttft_ms,
          min: p.min_ttft_ms,
          max: p.max_ttft_ms,
        };
      case 'throughput':
        return {
          model: modelName,
          value: p.avg_tokens_per_second,
        };
      case 'success':
        return {
          model: modelName,
          value: p.success_rate,
        };
      case 'cost':
        return {
          model: modelName,
          value: p.cost_per_1k_tokens * 1000,
        };
      default:
        return { model: modelName, value: 0 };
    }
  });


  const formatTooltipValue = (value: number) => {
    switch (metric) {
      case 'ttft':
      case 'throughput':
        return formatDuration(value);
      case 'success':
        return formatPercentage(value);
      case 'cost':
        return `$${value.toFixed(3)}`;
      default:
        return value.toFixed(2);
    }
  };

  const getYAxisLabel = () => {
    switch (metric) {
      case 'ttft':
        return 'Time (ms)';
      case 'throughput':
        return 'Tokens/sec';
      case 'success':
        return 'Success Rate (%)';
      case 'cost':
        return 'Cost ($/1K tokens)';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="model" 
            angle={-45}
            textAnchor="end"
            height={100}
            className="text-xs"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            label={{ 
              value: getYAxisLabel(), 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: 12 }
            }}
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.95)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Bar 
            dataKey="value" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          {metric === 'ttft' && (
            <>
              <Bar 
                dataKey="min" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
              <Bar 
                dataKey="max" 
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}