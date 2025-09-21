/**
 * JSONIC Debug Tools
 * Performance monitoring, query analysis, and debugging utilities
 */

interface QueryMetrics {
  query: string;
  executionTime: number;
  resultCount: number;
  timestamp: number;
  cacheHit: boolean;
}

interface PerformanceMetrics {
  queries: QueryMetrics[];
  totalQueries: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export class DebugTools {
  private queries: QueryMetrics[] = [];
  private maxQueryHistory = 100;
  private performanceObserver: PerformanceObserver | null = null;
  private enabled = false;
  
  constructor() {
    this.setupPerformanceObserver();
  }
  
  /**
   * Initialize debug tools with JSONIC instance
   */
  init(jsonic: any) {
    if (!jsonic) return;
    
    // Wrap query methods to track metrics
    this.wrapQueryMethods(jsonic);
    
    // Enable debug mode
    this.enable();
  }
  
  /**
   * Enable debug tools
   */
  enable() {
    this.enabled = true;
    console.log('[JSONIC Debug] Debug tools enabled');
  }
  
  /**
   * Disable debug tools
   */
  disable() {
    this.enabled = false;
    console.log('[JSONIC Debug] Debug tools disabled');
  }
  
  /**
   * Setup performance observer for resource timing
   */
  private setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('jsonic')) {
            this.logPerformanceEntry(entry);
          }
        }
      });
      
      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'resource'] 
      });
    } catch (error) {
      console.warn('[JSONIC Debug] Performance observer not available');
    }
  }
  
  /**
   * Wrap JSONIC query methods for tracking
   */
  private wrapQueryMethods(jsonic: any) {
    const originalQuery = jsonic.query?.bind(jsonic);
    const originalFind = jsonic.find?.bind(jsonic);
    const originalExecute = jsonic.execute?.bind(jsonic);
    
    if (originalQuery) {
      jsonic.query = (...args: any[]) => {
        return this.trackQuery('query', originalQuery, args);
      };
    }
    
    if (originalFind) {
      jsonic.find = (...args: any[]) => {
        return this.trackQuery('find', originalFind, args);
      };
    }
    
    if (originalExecute) {
      jsonic.execute = (...args: any[]) => {
        return this.trackQuery('execute', originalExecute, args);
      };
    }
  }
  
  /**
   * Track query execution
   */
  private async trackQuery(method: string, fn: Function, args: any[]) {
    if (!this.enabled) {
      return fn(...args);
    }
    
    const start = performance.now();
    const query = this.formatQuery(method, args);
    
    try {
      const result = await fn(...args);
      const executionTime = performance.now() - start;
      
      // Record metrics
      const metrics: QueryMetrics = {
        query,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        timestamp: Date.now(),
        cacheHit: executionTime < 1 // Assume cache hit if very fast
      };
      
      this.recordQuery(metrics);
      
      // Log slow queries
      if (executionTime > 100) {
        console.warn(`[JSONIC Debug] Slow query (${executionTime.toFixed(2)}ms):`, query);
      }
      
      return result;
    } catch (error) {
      console.error(`[JSONIC Debug] Query error:`, query, error);
      throw error;
    }
  }
  
  /**
   * Format query for logging
   */
  private formatQuery(method: string, args: any[]): string {
    try {
      return `${method}(${JSON.stringify(args).slice(0, 200)})`;
    } catch {
      return `${method}(...)`;
    }
  }
  
  /**
   * Record query metrics
   */
  private recordQuery(metrics: QueryMetrics) {
    this.queries.push(metrics);
    
    // Maintain history limit
    if (this.queries.length > this.maxQueryHistory) {
      this.queries.shift();
    }
  }
  
  /**
   * Log performance entry
   */
  private logPerformanceEntry(entry: PerformanceEntry) {
    if (!this.enabled) return;
    
    console.log(`[JSONIC Performance] ${entry.name}: ${entry.duration?.toFixed(2)}ms`);
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const totalQueries = this.queries.length;
    const totalTime = this.queries.reduce((sum, q) => sum + q.executionTime, 0);
    const cacheHits = this.queries.filter(q => q.cacheHit).length;
    
    return {
      queries: this.queries.slice(-10), // Last 10 queries
      totalQueries,
      averageExecutionTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      cacheHitRate: totalQueries > 0 ? cacheHits / totalQueries : 0,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Get memory usage
   */
  private getMemoryUsage() {
    const performance = (window as any).performance;
    
    if (performance?.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    
    return {
      used: 0,
      limit: 0,
      percentage: 0
    };
  }
  
  /**
   * Clear query history
   */
  clearHistory() {
    this.queries = [];
    console.log('[JSONIC Debug] Query history cleared');
  }
  
  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
  
  /**
   * Print metrics to console
   */
  printMetrics() {
    const metrics = this.getMetrics();
    
    console.group('[JSONIC Debug] Performance Metrics');
    console.log(`Total Queries: ${metrics.totalQueries}`);
    console.log(`Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Memory Usage: ${(metrics.memoryUsage.percentage).toFixed(1)}%`);
    console.table(metrics.queries.slice(-5));
    console.groupEnd();
  }
  
  /**
   * Create visual performance chart
   */
  createPerformanceChart(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    // Draw performance chart
    const queries = this.queries.slice(-20);
    const maxTime = Math.max(...queries.map(q => q.executionTime), 100);
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, 170);
    ctx.lineTo(380, 170);
    ctx.stroke();
    
    // Draw bars
    const barWidth = (340 / queries.length) - 2;
    queries.forEach((query, i) => {
      const barHeight = (query.executionTime / maxTime) * 150;
      const x = 45 + (i * (barWidth + 2));
      const y = 170 - barHeight;
      
      ctx.fillStyle = query.cacheHit ? '#4CAF50' : '#2196F3';
      ctx.fillRect(x, y, barWidth, barHeight);
    });
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px monospace';
    ctx.fillText('Execution Time (ms)', 10, 90);
    ctx.fillText(`Max: ${maxTime.toFixed(0)}ms`, 350, 20);
    
    return canvas;
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.queries = [];
    this.enabled = false;
  }
}

// Export singleton instance
export default new DebugTools();