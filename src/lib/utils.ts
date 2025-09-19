import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 1000).toFixed(2)}/1K`;
  return `$${usd.toFixed(4)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  return `${(tokens / 1000).toFixed(1)}K`;
}

export function getStatusColor(successRate: number): string {
  if (successRate >= 95) return 'text-success-500';
  if (successRate >= 80) return 'text-warning-500';
  return 'text-error-500';
}

export function getTrendIcon(change: number): string {
  if (Math.abs(change) < 5) return '→';
  return change > 0 ? '↑' : '↓';
}

export function getTrendColor(change: number, isPositiveBetter: boolean = false): string {
  if (Math.abs(change) < 5) return 'text-gray-500';
  const isGood = isPositiveBetter ? change > 0 : change < 0;
  return isGood ? 'text-success-500' : 'text-error-500';
}