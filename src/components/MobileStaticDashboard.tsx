import { Link } from 'react-router-dom';
import { Activity, Clock, DollarSign, CheckCircle, Zap, Smartphone } from 'lucide-react';

// Static data for mobile fallback
const STATIC_MOBILE_DATA = {
  totalTests: 715,
  successRate: 87.4,
  avgTTFT: 2340,
  totalCost: 0.45,
  latestRun: {
    timestamp: '2024-09-21T06:00:00Z',
    total_runs: 715,
    successful_runs: 625
  }
};

export default function MobileStaticDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AgentX Benchmark Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/jsonic-bench"
                className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md text-sm"
              >
                <Zap className="h-4 w-4" />
                <span>Benchmarks</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Mobile Optimized View
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Showing static data for optimal mobile performance. For interactive features, visit on desktop.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {STATIC_MOBILE_DATA.totalTests.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {STATIC_MOBILE_DATA.successRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg TTFT</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {STATIC_MOBILE_DATA.avgTTFT}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${STATIC_MOBILE_DATA.totalCost}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Latest Run Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Latest Run Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(STATIC_MOBILE_DATA.latestRun.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tests Completed:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {STATIC_MOBILE_DATA.latestRun.total_runs}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Successful:</span>
              <span className="text-sm font-medium text-green-600">
                {STATIC_MOBILE_DATA.latestRun.successful_runs}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            to="/jsonic-bench"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              <span>View JSONIC Performance Benchmarks</span>
            </div>
          </Link>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Desktop Features Available:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Interactive performance charts</li>
              <li>• Detailed test results tables</li>
              <li>• Model comparison analytics</li>
              <li>• Real-time data filtering</li>
              <li>• Export capabilities</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}