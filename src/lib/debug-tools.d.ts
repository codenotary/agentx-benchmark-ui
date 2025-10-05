/**
 * JSONIC Debugging Tools
 * Provides comprehensive debugging, profiling, and monitoring capabilities
 */
export interface JSONIC {
    collection(name: string): any;
}
export interface QueryExecutionPlan {
    query: any;
    indexUsed: string | null;
    scanType: 'index' | 'collection' | 'hybrid';
    estimatedRows: number;
    actualRows?: number;
    executionTimeMs?: number;
    steps: ExecutionStep[];
}
export interface ExecutionStep {
    operation: string;
    description: string;
    timeMs: number;
    rowsProcessed: number;
    indexHit?: boolean;
    cacheHit?: boolean;
}
export interface PerformanceMetrics {
    queryCount: number;
    totalTimeMs: number;
    averageTimeMs: number;
    slowQueries: QueryExecutionPlan[];
    cacheHitRate: number;
    indexUtilization: number;
    memoryUsageMB: number;
}
export interface IndexRecommendation {
    collection: string;
    fields: string[];
    estimatedImprovement: number;
    affectedQueries: number;
    reason: string;
}
/**
 * Debug Tools for JSONIC
 */
export declare class DebugTools {
    private db;
    private enabled;
    private queryLog;
    private performanceData;
    private devToolsPanel?;
    private maxQueryLogSize;
    private slowQueryThresholdMs;
    constructor(db: JSONIC);
    /**
     * Enable debugging and profiling
     */
    enable(): void;
    /**
     * Disable debugging
     */
    disable(): void;
    /**
     * Analyze query and generate execution plan
     */
    analyzeQuery(collection: string, query: any, options?: any): Promise<QueryExecutionPlan>;
    /**
     * Get performance metrics for a collection
     */
    getMetrics(collection?: string): PerformanceMetrics | Map<string, PerformanceMetrics>;
    /**
     * Get index recommendations
     */
    getIndexRecommendations(collection?: string): IndexRecommendation[];
    /**
     * Export debug data for analysis
     */
    exportDebugData(): string;
    /**
     * Clear debug data
     */
    clear(): void;
    private initializeDevTools;
    private interceptQueries;
    private wrapCollectionMethods;
    private determineIndexUsage;
    private hasPartialIndexMatch;
    private estimateRowCount;
    private generateExecutionSteps;
    private logSlowQuery;
    private updateStatistics;
    private createEmptyMetrics;
    private analyzeQueryPatterns;
    private logQueryExecution;
    private memoryInterval?;
    private startMemoryMonitoring;
    private stopMemoryMonitoring;
    private getMemoryUsage;
}
/**
 * Export debug tools instance
 */
export declare function createDebugTools(db: JSONIC): DebugTools;
/**
 * Console helper for quick debugging
 */
export declare function enableJSONICDebug(): void;
//# sourceMappingURL=debug-tools.d.ts.map