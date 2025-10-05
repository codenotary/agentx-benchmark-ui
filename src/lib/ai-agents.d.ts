/**
 * Pre-built AI Agent Templates
 * Ready-to-use agents for common AI use cases
 */
import { JSONIC } from './index-new';
import { StreamingLLMProvider } from './ai-streaming';
/**
 * Base Agent Interface
 */
export interface Agent {
    name: string;
    description: string;
    capabilities: string[];
    initialize(db: JSONIC, provider: StreamingLLMProvider): Promise<void>;
    execute(input: string, context?: any): Promise<any>;
    reset(): void;
}
/**
 * QA Bot Agent - Question Answering over Documents
 */
export declare class QABotAgent implements Agent {
    name: string;
    description: string;
    capabilities: string[];
    private rag?;
    private db?;
    private provider?;
    private documents?;
    private hybridSearch?;
    initialize(db: JSONIC, provider: StreamingLLMProvider): Promise<void>;
    indexDocument(content: string, metadata?: any): Promise<void>;
    execute(question: string, context?: any): Promise<any>;
    private calculateConfidence;
    reset(): void;
}
/**
 * Code Assistant Agent - Programming Help
 */
export declare class CodeAssistantAgent implements Agent {
    name: string;
    description: string;
    capabilities: string[];
    private functionAgent?;
    private db?;
    private provider?;
    private codeHistory?;
    private memory?;
    initialize(db: JSONIC, provider: StreamingLLMProvider): Promise<void>;
    execute(input: string, context?: any): Promise<any>;
    private generateCode;
    private debugCode;
    private refactorCode;
    private generateTests;
    private explainCode;
    reset(): void;
}
/**
 * Data Analyst Agent - Data Analysis and Insights
 */
export declare class DataAnalystAgent implements Agent {
    name: string;
    description: string;
    capabilities: string[];
    private db?;
    private provider?;
    private analysisResults?;
    private functionAgent?;
    initialize(db: JSONIC, provider: StreamingLLMProvider): Promise<void>;
    execute(input: string, context?: any): Promise<any>;
    private analyzeData;
    private findPatterns;
    private generateInsights;
    private predictTrends;
    private calculateMedian;
    private calculateStdDev;
    reset(): void;
}
/**
 * Customer Support Agent
 */
export declare class CustomerSupportAgent implements Agent {
    name: string;
    description: string;
    capabilities: string[];
    private db?;
    private provider?;
    private knowledgeBase?;
    private tickets?;
    private rag?;
    initialize(db: JSONIC, provider: StreamingLLMProvider): Promise<void>;
    addKnowledgeArticle(title: string, content: string, category: string): Promise<void>;
    execute(input: string, context?: any): Promise<any>;
    private analyzeSentiment;
    reset(): void;
}
/**
 * Agent Factory
 */
export declare class AgentFactory {
    private static agents;
    /**
     * Create an agent by type
     */
    static createAgent(type: string, db: JSONIC, provider: StreamingLLMProvider): Promise<Agent>;
    /**
     * Register custom agent
     */
    static registerAgent(type: string, agentClass: new () => Agent): void;
    /**
     * Get available agent types
     */
    static getAvailableAgents(): Array<{
        type: string;
        name: string;
        description: string;
    }>;
}
//# sourceMappingURL=ai-agents.d.ts.map