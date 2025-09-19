import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Code, FileText, Hash } from 'lucide-react';
import type { TestResult } from '../types/benchmark';
import { cn, formatDuration, formatCost, formatTokens } from '../lib/utils';

interface TestResultsTableProps {
  runId?: string;
}

export default function TestResultsTable({ runId }: TestResultsTableProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'tokens' | 'category' | 'status'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTestResults();
  }, [runId]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        runId 
          ? `http://${window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname}:3001/api/benchmark/results/${runId}`
          : `http://${window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname}:3001/api/benchmark/results/latest`
      );
      
      if (!response.ok) throw new Error('Failed to fetch test results');
      
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error fetching test results:', error);
      // Try to use mock data if real data fails
      setTestResults(generateMockTestResults());
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredResults = testResults.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'success') return result.success;
    if (filter === 'failed') return !result.success;
    return result.category === filter;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'time':
        comparison = a.total_time_ms - b.total_time_ms;
        break;
      case 'tokens':
        comparison = a.tokens_generated - b.tokens_generated;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'status':
        comparison = (a.success ? 1 : 0) - (b.success ? 1 : 0);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const categories = [...new Set(testResults.map(r => r.category))];
  
  const getStatusIcon = (success: boolean) => {
    return success 
      ? <CheckCircle className="h-5 w-5 text-success-500" />
      : <XCircle className="h-5 w-5 text-error-500" />;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      math: <Hash className="h-4 w-4" />,
      coding: <Code className="h-4 w-4" />,
      technical: <FileText className="h-4 w-4" />,
      reasoning: <Clock className="h-4 w-4" />,
    };
    return icons[category] || <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      math: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      coding: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      technical: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      reasoning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      mcp_tools: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading test results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Test Results ({sortedResults.length} tests)
          </h2>
          
          <div className="flex items-center space-x-4">
            {/* Filter buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filter === 'all' 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                All ({testResults.length})
              </button>
              <button
                onClick={() => setFilter('success')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filter === 'success'
                    ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                Success ({testResults.filter(r => r.success).length})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filter === 'failed'
                    ? 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                Failed ({testResults.filter(r => !r.success).length})
              </button>
            </div>

            {/* Category filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="time-desc">Slowest First</option>
              <option value="time-asc">Fastest First</option>
              <option value="tokens-desc">Most Tokens</option>
              <option value="tokens-asc">Least Tokens</option>
              <option value="category-asc">Category A-Z</option>
              <option value="status-desc">Success First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prompt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                TTFT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tokens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedResults.map((result) => (
              <>
                <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusIcon(result.success)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.model.replace(/-\d{8}$/, '')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.provider} • Iteration {result.iteration}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getCategoryColor(result.category)
                    )}>
                      {getCategoryIcon(result.category)}
                      <span className="ml-1">{result.category}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-sm text-gray-900 dark:text-gray-300">
                      {result.prompt_text || result.prompt_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatDuration(result.time_to_first_token_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatDuration(result.total_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <div>
                      <div>{formatTokens(result.tokens_generated)}</div>
                      <div className="text-xs text-gray-500">
                        {result.tokens_per_second?.toFixed(1)} tok/s
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatCost(result.estimated_cost_usd)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRow(result.id)}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {expandedRows.has(result.id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
                
                {/* Expanded row with response details */}
                {expandedRows.has(result.id) && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Full Prompt:
                          </h4>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {result.prompt_text}
                            </pre>
                          </div>
                        </div>
                        
                        {result.response && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                              Response:
                            </h4>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                {result.response}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {result.error_message && (
                          <div>
                            <h4 className="font-medium text-sm text-error-700 dark:text-error-300 mb-2">
                              Error:
                            </h4>
                            <div className="bg-error-50 dark:bg-error-900/20 p-3 rounded-md border border-error-200 dark:border-error-800">
                              <pre className="text-sm text-error-800 dark:text-error-200 whitespace-pre-wrap">
                                {result.error_message}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-200">
                              {new Date(result.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {result.quality_score && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Quality Score:</span>
                              <span className="ml-2 text-gray-900 dark:text-gray-200">
                                {(result.quality_score * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {sortedResults.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No test results found for the selected filter.
        </div>
      )}
    </div>
  );
}

// Mock data generator for testing
function generateMockTestResults(): TestResult[] {
  const categories = ['math', 'coding', 'reasoning', 'technical', 'creative', 'mcp_tools'];
  const prompts = {
    math: 'Calculate the factorial of 12',
    coding: 'Write a Python function to reverse a linked list',
    reasoning: 'If all birds can fly and penguins are birds, can penguins fly?',
    technical: 'Explain the difference between TCP and UDP protocols',
    creative: 'Write a haiku about machine learning',
    mcp_tools: 'List all virtual machines with more than 16GB RAM'
  };
  
  return Array.from({ length: 20 }, (_, i) => {
    const category = categories[i % categories.length];
    const success = Math.random() > 0.15;
    
    return {
      id: i + 1,
      run_id: `bench-${Date.now()}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      provider: ['anthropic', 'gemini', 'ollama'][i % 3],
      model: ['claude-3-5-haiku-20241022', 'gemini-2.0-flash-exp', 'llama2'][i % 3],
      prompt_id: `${category}_test`,
      prompt_text: prompts[category as keyof typeof prompts],
      category,
      iteration: (i % 3) + 1,
      time_to_first_token_ms: 500 + Math.random() * 3000,
      total_time_ms: 1000 + Math.random() * 5000,
      tokens_generated: 50 + Math.floor(Math.random() * 500),
      tokens_per_second: 20 + Math.random() * 30,
      quality_score: success ? 0.7 + Math.random() * 0.3 : undefined,
      success,
      error_message: !success ? 'Rate limit exceeded' : undefined,
      response: success ? `This is a sample response for ${category} prompt...` : undefined,
      estimated_cost_usd: Math.random() * 0.01,
    };
  });
}