/**
 * AI/LLM Integration for JSONIC
 * Complete implementation with OpenAI, Anthropic, and local model support
 */
import { VectorIndex } from './ai-store';
import { Collection } from './collection';
import { JSONIC } from './index-new';
export interface LLMProvider {
    name: string;
    generateEmbedding(text: string): Promise<Float32Array>;
    generateCompletion(prompt: string, options?: any): Promise<string>;
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
}
export interface RAGOptions {
    chunkSize?: number;
    chunkOverlap?: number;
    topK?: number;
    minScore?: number;
    contextWindow?: number;
    temperature?: number;
}
export interface AgentMemory {
    shortTerm: Map<string, any>;
    longTerm: Collection<any>;
    episodic: Array<{
        timestamp: number;
        event: any;
    }>;
    semantic: VectorIndex;
}
/**
 * OpenAI Provider implementation
 */
export declare class OpenAIProvider implements LLMProvider {
    name: string;
    private apiKey;
    private baseURL;
    private embeddingModel;
    private completionModel;
    constructor(apiKey: string);
    generateEmbedding(text: string): Promise<Float32Array>;
    generateCompletion(prompt: string, options?: any): Promise<string>;
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
}
/**
 * Anthropic Claude Provider implementation
 */
export declare class AnthropicProvider implements LLMProvider {
    name: string;
    private apiKey;
    private baseURL;
    private model;
    constructor(apiKey: string);
    generateEmbedding(text: string): Promise<Float32Array>;
    generateCompletion(prompt: string, options?: any): Promise<string>;
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
}
/**
 * Local/Browser-based LLM Provider using WebLLM or ONNX
 */
export declare class LocalLLMProvider implements LLMProvider {
    name: string;
    private modelPath;
    private model?;
    private tokenizer?;
    constructor(modelPath: string);
    initialize(): Promise<void>;
    generateEmbedding(text: string): Promise<Float32Array>;
    generateCompletion(prompt: string, options?: any): Promise<string>;
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
    private simpleHash;
    private generateMockStructuredData;
    private generateMockValue;
}
/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 */
export declare class RAGPipeline {
    private vectorIndex;
    private llmProvider;
    private options;
    private documentStore;
    constructor(db: JSONIC, llmProvider: LLMProvider, options?: RAGOptions);
    /**
     * Index a document for RAG
     */
    indexDocument(content: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Query with RAG
     */
    query(question: string): Promise<string>;
    /**
     * Chunk text for indexing
     */
    private chunkText;
    /**
     * Build RAG prompt
     */
    private buildRAGPrompt;
}
/**
 * Agent Memory System for conversational AI
 */
export declare class AgentMemorySystem {
    private memory;
    private db;
    private vectorIndex;
    private llmProvider?;
    constructor(db: JSONIC, llmProvider?: LLMProvider);
    /**
     * Store in short-term memory
     */
    rememberShortTerm(key: string, value: any): void;
    /**
     * Store in long-term memory
     */
    rememberLongTerm(data: any): Promise<void>;
    /**
     * Store episodic memory
     */
    rememberEpisode(event: any): void;
    /**
     * Store semantic memory with embeddings
     */
    rememberSemantic(content: string, metadata?: any): Promise<void>;
    /**
     * Recall from memory
     */
    recall(query: string): Promise<any>;
    /**
     * Consolidate memories (move from short to long term)
     */
    consolidate(): Promise<void>;
    /**
     * Prune short-term memory
     */
    private pruneShortTermMemory;
    /**
     * Get memory statistics
     */
    getStats(): {
        shortTerm: number;
        episodic: number;
        semantic: number;
    };
}
/**
 * Factory function to create LLM provider
 */
export declare function createLLMProvider(type: 'openai' | 'anthropic' | 'gemini' | 'local', config: any): LLMProvider;
//# sourceMappingURL=ai-llm-integration.d.ts.map