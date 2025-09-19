import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryPerformance } from '../types/benchmark';
import { formatDuration, formatPercentage } from '../lib/utils';

interface CategoryBreakdownProps {
  categories: CategoryPerformance[];
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  // Group by category and calculate averages
  const categoryData = categories.reduce((acc, cat) => {
    if (!acc[cat.category]) {
      acc[cat.category] = {
        category: cat.category,
        avgTTFT: 0,
        avgSuccessRate: 0,
        totalTests: 0,
        count: 0,
      };
    }
    
    acc[cat.category].avgTTFT += cat.avg_ttft_ms;
    acc[cat.category].avgSuccessRate += cat.success_rate;
    acc[cat.category].totalTests += cat.total_tests;
    acc[cat.category].count++;
    
    return acc;
  }, {} as Record<string, any>);

  const data = Object.values(categoryData).map((cat: any) => ({
    name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    value: cat.totalTests,
    avgTTFT: cat.avgTTFT / cat.count,
    successRate: cat.avgSuccessRate / cat.count,
  }));

  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Tests: {data.value}</p>
          <p className="text-sm">Avg TTFT: {formatDuration(data.avgTTFT)}</p>
          <p className="text-sm">Success: {formatPercentage(data.successRate)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance by Category
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.map((cat, index) => (
          <div key={cat.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">{cat.value}</span> tests • 
              <span className="ml-1">{formatPercentage(cat.successRate)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}