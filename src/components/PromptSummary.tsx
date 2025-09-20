import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTestResults } from '../services/api';
import { FileText, Hash, Zap, Activity, BarChart, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { TestResult } from '../types/benchmark';

interface PromptSummaryProps {
  runId?: string;
}

interface PromptStats {
  prompt_id: string;
  prompt_text: string;
  category: string;
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  avg_time_ms: number;
  avg_tokens: number;
  providers: string[];
}

export default function PromptSummary({ runId }: PromptSummaryProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  
  const { data: testResults, isLoading } = useQuery({
    queryKey: ['testResults', runId],
    queryFn: () => runId ? fetchTestResults(runId) : Promise.resolve([]),
    enabled: !!runId,
  });

  const promptStats: PromptStats[] = [];
  
  if (testResults) {
    const promptMap = new Map<string, PromptStats>();
    
    testResults.forEach((result: TestResult) => {
      const key = result.prompt_id;
      if (!promptMap.has(key)) {
        promptMap.set(key, {
          prompt_id: result.prompt_id,
          prompt_text: result.prompt_text,
          category: result.category,
          total_tests: 0,
          successful_tests: 0,
          failed_tests: 0,
          avg_time_ms: 0,
          avg_tokens: 0,
          providers: [],
        });
      }
      
      const stats = promptMap.get(key)!;
      stats.total_tests++;
      if (result.success) {
        stats.successful_tests++;
      } else {
        stats.failed_tests++;
      }
      stats.avg_time_ms += result.total_time_ms || 0;
      stats.avg_tokens += result.tokens_generated || 0;
      
      const providerKey = `${result.provider}/${result.model}`;
      if (!stats.providers.includes(providerKey)) {
        stats.providers.push(providerKey);
      }
    });
    
    // Calculate averages
    promptMap.forEach((stats) => {
      stats.avg_time_ms = stats.avg_time_ms / stats.total_tests;
      stats.avg_tokens = Math.round(stats.avg_tokens / stats.total_tests);
    });
    
    promptStats.push(...Array.from(promptMap.values()));
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      math: <Hash className="h-4 w-4" />,
      coding: <FileText className="h-4 w-4" />,
      reasoning: <Zap className="h-4 w-4" />,
      technical: <Activity className="h-4 w-4" />,
      creative: <FileText className="h-4 w-4" />,
      mcp_tools: <BarChart className="h-4 w-4" />,
    };
    return icons[category] || <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      math: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      coding: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      reasoning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      technical: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      mcp_tools: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (promptStats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No test prompts found for this run</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>{promptStats.length}</strong> unique prompts tested across <strong>{promptStats.reduce((acc, p) => acc + p.providers.length, 0)}</strong> model configurations
      </div>
      
      {promptStats.map((prompt) => {
        const successRate = (prompt.successful_tests / prompt.total_tests) * 100;
        const isExpanded = expandedPrompt === prompt.prompt_id;
        
        return (
          <div
            key={prompt.prompt_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <div
              className="p-4 cursor-pointer select-none"
              onClick={() => setExpandedPrompt(isExpanded ? null : prompt.prompt_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(prompt.category)}`}>
                      {getCategoryIcon(prompt.category)}
                      {prompt.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {prompt.prompt_id}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {prompt.prompt_text}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      {successRate >= 80 ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : successRate >= 50 ? (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      {successRate.toFixed(0)}% success
                    </span>
                    <span>{prompt.total_tests} runs</span>
                    <span>{(prompt.avg_time_ms / 1000).toFixed(1)}s avg</span>
                    <span>{prompt.avg_tokens} tokens avg</span>
                  </div>
                </div>
                
                <div className="ml-4 text-gray-400">
                  <svg className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Full Prompt:</strong>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {prompt.prompt_text}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Test Results</div>
                      <div className="flex gap-2">
                        <span className="text-sm text-green-600 dark:text-green-400">
                          ✓ {prompt.successful_tests} passed
                        </span>
                        <span className="text-sm text-red-600 dark:text-red-400">
                          ✗ {prompt.failed_tests} failed
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tested Models</div>
                      <div className="flex flex-wrap gap-1">
                        {prompt.providers.map((provider) => (
                          <span key={provider} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}