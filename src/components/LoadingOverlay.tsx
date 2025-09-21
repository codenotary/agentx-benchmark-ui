import { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  phase: 'checking' | 'loading' | 'migrating' | 'complete' | 'error' | 'idle';
  current: number;
  total: number;
  message: string;
  percentage: number;
  onComplete?: () => void;
}

export default function LoadingOverlay({
  phase,
  current,
  total,
  message,
  percentage,
  onComplete
}: LoadingOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (phase === 'complete') {
      // Add a small delay to show completion
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  if (!isVisible || phase === 'idle') {
    return null;
  }

  const getIcon = () => {
    switch (phase) {
      case 'checking':
      case 'loading':
      case 'migrating':
        return <Loader2 className="h-8 w-8 animate-spin text-primary-600" />;
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Database className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProgressColor = () => {
    switch (phase) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-primary-600';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className="flex items-center justify-center">
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {phase === 'checking' && 'Initializing Database'}
            {phase === 'loading' && 'Loading Data'}
            {phase === 'migrating' && 'Processing Documents'}
            {phase === 'complete' && 'Ready!'}
            {phase === 'error' && 'Error'}
          </h2>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {message}
          </p>

          {/* Progress Bar */}
          {phase !== 'error' && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>
                  {phase === 'migrating' ? `${current} / ${total} documents` : ''}
                </span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Additional Info for Migration */}
          {phase === 'migrating' && total > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
              <div>Processing at ~{Math.round(current / (percentage / 100) / 10) * 10} docs/sec</div>
              {percentage > 0 && percentage < 100 && (
                <div>
                  Est. time remaining: {Math.ceil((total - current) / (current / (percentage / 20)))}s
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {phase === 'error' && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-400 font-mono">
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}