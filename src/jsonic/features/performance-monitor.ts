/**
 * JSONIC Performance Monitor
 * Real-time performance tracking and optimization suggestions
 */

interface PerformanceSnapshot {
  timestamp: number;
  metrics: {
    fps: number;
    memory: number;
    domNodes: number;
    jsHeapSize: number;
    layoutDuration: number;
    scriptDuration: number;
  };
}

interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  domNodes: { warning: number; critical: number };
  jsHeapSize: { warning: number; critical: number };
}

export class PerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = [];
  private maxSnapshots = 60; // 1 minute of data at 1fps
  private monitoring = false;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;
  
  private thresholds: PerformanceThresholds = {
    fps: { warning: 30, critical: 15 },
    memory: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }, // MB
    domNodes: { warning: 1500, critical: 3000 },
    jsHeapSize: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 } // MB
  };
  
  private callbacks = new Set<(snapshot: PerformanceSnapshot) => void>();
  
  /**
   * Start monitoring performance
   */
  start() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.lastFrameTime = performance.now();
    this.measureFrame();
    
    console.log('[JSONIC Performance] Monitoring started');
  }
  
  /**
   * Stop monitoring performance
   */
  stop() {
    this.monitoring = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    console.log('[JSONIC Performance] Monitoring stopped');
  }
  
  /**
   * Measure frame performance
   */
  private measureFrame = () => {
    if (!this.monitoring) return;
    
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    
    // Calculate FPS
    this.frameCount++;
    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFrameTime = now;
      
      // Take snapshot
      this.takeSnapshot();
    }
    
    this.rafId = requestAnimationFrame(this.measureFrame);
  };
  
  /**
   * Take performance snapshot
   */
  private takeSnapshot() {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      metrics: {
        fps: this.fps,
        memory: this.getMemoryUsage(),
        domNodes: document.getElementsByTagName('*').length,
        jsHeapSize: this.getJSHeapSize(),
        layoutDuration: this.getLayoutDuration(),
        scriptDuration: this.getScriptDuration()
      }
    };
    
    // Add snapshot
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    // Check thresholds
    this.checkThresholds(snapshot);
    
    // Notify callbacks
    this.callbacks.forEach(cb => cb(snapshot));
  }
  
  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    const performance = (window as any).performance;
    if (performance?.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }
  
  /**
   * Get JS heap size
   */
  private getJSHeapSize(): number {
    const performance = (window as any).performance;
    if (performance?.memory) {
      return performance.memory.totalJSHeapSize;
    }
    return 0;
  }
  
  /**
   * Get layout duration from Performance API
   */
  private getLayoutDuration(): number {
    try {
      const entries = performance.getEntriesByType('measure');
      const layoutEntries = entries.filter(e => e.name.includes('layout'));
      
      if (layoutEntries.length > 0) {
        const lastEntry = layoutEntries[layoutEntries.length - 1];
        return lastEntry.duration || 0;
      }
    } catch (error) {
      // Silent fail
    }
    return 0;
  }
  
  /**
   * Get script duration from Performance API
   */
  private getScriptDuration(): number {
    try {
      const entries = performance.getEntriesByType('measure');
      const scriptEntries = entries.filter(e => e.name.includes('script'));
      
      if (scriptEntries.length > 0) {
        const lastEntry = scriptEntries[scriptEntries.length - 1];
        return lastEntry.duration || 0;
      }
    } catch (error) {
      // Silent fail
    }
    return 0;
  }
  
  /**
   * Check performance thresholds
   */
  private checkThresholds(snapshot: PerformanceSnapshot) {
    const { metrics } = snapshot;
    
    // Check FPS
    if (metrics.fps < this.thresholds.fps.critical) {
      console.error('[JSONIC Performance] Critical: FPS below', this.thresholds.fps.critical);
    } else if (metrics.fps < this.thresholds.fps.warning) {
      console.warn('[JSONIC Performance] Warning: FPS below', this.thresholds.fps.warning);
    }
    
    // Check memory
    if (metrics.memory > this.thresholds.memory.critical) {
      console.error('[JSONIC Performance] Critical: Memory usage above', 
        (this.thresholds.memory.critical / 1024 / 1024).toFixed(0), 'MB');
    } else if (metrics.memory > this.thresholds.memory.warning) {
      console.warn('[JSONIC Performance] Warning: Memory usage above', 
        (this.thresholds.memory.warning / 1024 / 1024).toFixed(0), 'MB');
    }
    
    // Check DOM nodes
    if (metrics.domNodes > this.thresholds.domNodes.critical) {
      console.error('[JSONIC Performance] Critical: DOM nodes above', this.thresholds.domNodes.critical);
    } else if (metrics.domNodes > this.thresholds.domNodes.warning) {
      console.warn('[JSONIC Performance] Warning: DOM nodes above', this.thresholds.domNodes.warning);
    }
  }
  
  /**
   * Subscribe to performance updates
   */
  subscribe(callback: (snapshot: PerformanceSnapshot) => void) {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }
  
  /**
   * Get current performance stats
   */
  getStats() {
    if (this.snapshots.length === 0) {
      return null;
    }
    
    const latest = this.snapshots[this.snapshots.length - 1];
    const average = this.calculateAverages();
    
    return {
      current: latest.metrics,
      average,
      trend: this.calculateTrend(),
      recommendations: this.getRecommendations(latest.metrics)
    };
  }
  
  /**
   * Calculate average metrics
   */
  private calculateAverages() {
    if (this.snapshots.length === 0) {
      return null;
    }
    
    const totals = this.snapshots.reduce((acc, snapshot) => {
      acc.fps += snapshot.metrics.fps;
      acc.memory += snapshot.metrics.memory;
      acc.domNodes += snapshot.metrics.domNodes;
      acc.jsHeapSize += snapshot.metrics.jsHeapSize;
      return acc;
    }, {
      fps: 0,
      memory: 0,
      domNodes: 0,
      jsHeapSize: 0
    });
    
    const count = this.snapshots.length;
    
    return {
      fps: Math.round(totals.fps / count),
      memory: Math.round(totals.memory / count),
      domNodes: Math.round(totals.domNodes / count),
      jsHeapSize: Math.round(totals.jsHeapSize / count)
    };
  }
  
  /**
   * Calculate performance trend
   */
  private calculateTrend() {
    if (this.snapshots.length < 2) {
      return 'stable';
    }
    
    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);
    
    if (older.length === 0) {
      return 'stable';
    }
    
    const recentAvgFps = recent.reduce((sum, s) => sum + s.metrics.fps, 0) / recent.length;
    const olderAvgFps = older.reduce((sum, s) => sum + s.metrics.fps, 0) / older.length;
    
    if (recentAvgFps < olderAvgFps * 0.8) {
      return 'declining';
    } else if (recentAvgFps > olderAvgFps * 1.2) {
      return 'improving';
    }
    
    return 'stable';
  }
  
  /**
   * Get performance recommendations
   */
  private getRecommendations(metrics: PerformanceSnapshot['metrics']): string[] {
    const recommendations: string[] = [];
    
    if (metrics.fps < this.thresholds.fps.warning) {
      recommendations.push('Consider reducing animation complexity or using requestAnimationFrame');
    }
    
    if (metrics.memory > this.thresholds.memory.warning) {
      recommendations.push('Memory usage is high - consider clearing unused data or optimizing data structures');
    }
    
    if (metrics.domNodes > this.thresholds.domNodes.warning) {
      recommendations.push('High DOM node count detected - consider virtual scrolling or pagination');
    }
    
    if (metrics.jsHeapSize > this.thresholds.jsHeapSize.warning) {
      recommendations.push('JavaScript heap is large - review memory allocations and potential leaks');
    }
    
    return recommendations;
  }
  
  /**
   * Export performance data
   */
  exportData(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      stats: this.getStats(),
      timestamp: Date.now()
    }, null, 2);
  }
  
  /**
   * Clear performance data
   */
  clear() {
    this.snapshots = [];
    this.frameCount = 0;
    this.fps = 60;
  }
  
  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds
    };
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    this.stop();
    this.clear();
    this.callbacks.clear();
  }
}

// Export singleton instance
export default new PerformanceMonitor();