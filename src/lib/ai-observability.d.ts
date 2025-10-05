/**
 * AI Observability and Debugging Tools
 * Monitor, debug, and optimize AI operations
 */
import { JSONIC } from './index-new';
/**
 * AI Operation Metrics
 */
export interface AIMetrics {
    operationType: 'embedding' | 'completion' | 'search' | 'rag' | 'function_call';
    latency: number;
    tokensUsed?: number;
    cost?: number;
    success: boolean;
    error?: string;
    metadata?: any;
    timestamp: number;
}
/**
 * AI Performance Monitor
 */
export declare class AIPerformanceMonitor {
    private metrics;
    private activeOperations;
    private costCalculator;
    private alertThresholds;
    constructor(db: JSONIC);
    /**
     * Start tracking an operation
     */
    startOperation(operationId: string, type: string): void;
    /**
     * End tracking and record metrics
     */
    endOperation(operationId: string, success: boolean, metadata?: {
        tokensUsed?: number;
        model?: string;
        error?: string;
        [key: string]: any;
    }): Promise<void>;
    /**
     * Check and trigger alerts
     */
    private checkAlerts;
    /**
     * Get performance statistics
     */
    getStats(timeRange?: {
        start: number;
        end: number;
    }): Promise<{
        totalOperations: number;
        successRate: number;
        averageLatency: number;
        totalCost: number;
        operationBreakdown: Record<string, number>;
        errorRate: number;
        p95Latency: number;
    }>;
    /**
     * Get detailed operation trace
     */
    getOperationTrace(operationId: string): Promise<any>;
    /**
     * Set alert threshold
     */
    setAlertThreshold(metric: string, threshold: number): void;
}
/**
 * Prompt Debugger
 */
export declare class PromptDebugger {
    private promptHistory;
    private comparisonResults;
    constructor(db: JSONIC);
    /**
     * Log a prompt execution
     */
    logPrompt(prompt: string, response: string, metadata?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        variables?: Record<string, any>;
        [key: string]: any;
    }): Promise<string>;
    /**
     * A/B test prompts
     */
    abTestPrompts(promptA: string, promptB: string, testCases: Array<{
        input: any;
        expectedOutput?: string;
    }>, evaluator: (response: string, expected?: string) => number): Promise<{
        promptA: {
            averageScore: number;
            results: any[];
        };
        promptB: {
            averageScore: number;
            results: any[];
        };
        winner: 'A' | 'B' | 'tie';
    }>;
    /**
     * Analyze prompt patterns
     */
    analyzePromptPatterns(): Promise<{
        commonPatterns: string[];
        averageLength: number;
        tokenDistribution: Record<string, number>;
        successPatterns: string[];
    }>;
    /**
     * Simulate prompt execution (mock)
     */
    private simulatePrompt;
    /**
     * Extract common patterns from prompts
     */
    private extractPatterns;
}
/**
 * Embedding Quality Analyzer
 */
export declare class EmbeddingAnalyzer {
    private embeddingStats;
    constructor(db: JSONIC);
    /**
     * Analyze embedding quality
     */
    analyzeEmbeddingQuality(embeddings: Array<{
        id: string;
        vector: Float32Array;
        text: string;
    }>): Promise<{
        averageMagnitude: number;
        sparsity: number;
        diversity: number;
        clusters: number;
        outliers: string[];
        recommendations: string[];
    }>;
    /**
     * Calculate sparsity of embeddings
     */
    private calculateSparsity;
    /**
     * Calculate diversity of embeddings
     */
    private calculateDiversity;
    /**
     * Find outlier embeddings
     */
    private findOutliers;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Calculate cosine similarity
     */
    private cosineSimilarity;
}
/**
 * AI Debug Dashboard
 */
export declare class AIDebugDashboard {
    private monitor;
    private promptDebugger;
    private embeddingAnalyzer;
    constructor(db: JSONIC);
    /**
     * Get comprehensive dashboard data
     */
    getDashboardData(): Promise<{
        performance: any;
        prompts: any;
        embeddings: any;
        alerts: string[];
        recommendations: string[];
    }>;
    /**
     * Export debug report
     */
    exportReport(format?: 'json' | 'html'): Promise<string>;
    /**
     * Start real-time monitoring
     */
    startMonitoring(interval?: number): NodeJS.Timer;
}
//# sourceMappingURL=ai-observability.d.ts.map