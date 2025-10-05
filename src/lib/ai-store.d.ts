/**
 * AI Store - Browser-based AI/LLM support for JSONIC
 * Enables vector search, RAG, caching, and agent memory systems
 */
import { JSONIC } from './index-new';
export interface Vector {
    values: Float32Array;
    dimension: number;
    magnitude?: number;
}
export interface Embedding {
    id: string;
    vector: Vector;
    text: string;
    metadata?: Record<string, any>;
    timestamp: number;
}
export interface SimilarityResult {
    id: string;
    score: number;
    document: any;
    distance: number;
}
/**
 * Vector Index for similarity search
 */
export declare class VectorIndex {
    private embeddings;
    private dimension;
    private metric;
    constructor(dimension?: number, metric?: 'cosine' | 'euclidean' | 'dot');
    get embeddingCount(): number;
    get embeddingDimension(): number;
    /**
     * Add embedding to index
     */
    add(id: string, vector: number[] | Float32Array, text: string, metadata?: any): Promise<void>;
    /**
     * Find similar embeddings
     */
    search(query: number[] | Float32Array, k?: number, threshold?: number): Promise<SimilarityResult[]>;
    /**
     * Calculate similarity between vectors
     */
    private calculateSimilarity;
    private cosineSimilarity;
    private euclideanDistance;
    private dotProduct;
    private calculateMagnitude;
    /**
     * Perform clustering on embeddings
     */
    cluster(k?: number): Promise<Map<number, string[]>>;
}
/**
 * RAG (Retrieval Augmented Generation) System
 */
export declare class RAGSystem {
    private db;
    private vectorIndex;
    private documents;
    private embedder;
    constructor(db: JSONIC, embedder: (text: string) => Promise<number[]>, dimension?: number);
    /**
     * Index a document for RAG
     */
    indexDocument(doc: {
        id?: string;
        content: string;
        metadata?: any;
        chunkSize?: number;
    }): Promise<void>;
    /**
     * Retrieve relevant context for a query
     */
    retrieve(query: string, k?: number, options?: {
        threshold?: number;
        rerank?: boolean;
        diversify?: boolean;
    }): Promise<Array<{
        content: string;
        score: number;
        metadata?: any;
    }>>;
    /**
     * Generate augmented prompt with context
     */
    generatePrompt(query: string, systemPrompt?: string, k?: number): Promise<string>;
    /**
     * Chunk text into smaller pieces
     */
    private chunkText;
    /**
     * Diversify search results using MMR (Maximal Marginal Relevance)
     */
    private diversifyResults;
    private calculateDiversity;
    private textSimilarity;
}
/**
 * LLM Cache for storing model responses
 */
export declare class LLMCache {
    private cache;
    private maxAge;
    private maxSize;
    constructor(db: JSONIC, maxAge?: number, maxSize?: number);
    /**
     * Get cached response
     */
    get(prompt: string, model: string, options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<{
        response: string;
        usage: any;
    } | null>;
    /**
     * Store response in cache
     */
    set(prompt: string, model: string, response: string, usage?: any, options?: any): Promise<void>;
    /**
     * Clear expired cache entries
     */
    cleanup(): Promise<number>;
    private generateCacheKey;
}
/**
 * Agent Memory System
 */
export declare class AgentMemory {
    private db;
    private shortTermMemory;
    private longTermMemory;
    private episodicMemory;
    private workingMemory;
    constructor(db: JSONIC);
    /**
     * Store observation in short-term memory
     */
    observe(observation: string, importance?: number): Promise<void>;
    /**
     * Record action taken
     */
    recordAction(action: string, result?: string): Promise<void>;
    /**
     * Store thought or reasoning
     */
    think(thought: string): Promise<void>;
    /**
     * Retrieve relevant memories for context
     */
    recall(query: string, k?: number): Promise<any[]>;
    /**
     * Consolidate short-term to long-term memory
     */
    consolidate(content?: string): Promise<void>;
    /**
     * Create episodic memory from a sequence of events
     */
    createEpisode(events: any[], summary: string, outcome: string): Promise<void>;
    /**
     * Get working memory context
     */
    getWorkingMemory(): any[];
    /**
     * Clear working memory
     */
    clearWorkingMemory(): void;
}
/**
 * Conversation Manager for chat applications
 */
export declare class ConversationManager {
    private conversations;
    private messages;
    private tokenCounter;
    constructor(db: JSONIC, tokenCounter?: (text: string) => number);
    /**
     * Create new conversation
     */
    createConversation(title: string, systemPrompt?: string, model?: string): Promise<string>;
    /**
     * Add message to conversation
     */
    addMessage(conversationId: string, role: 'user' | 'assistant' | 'system' | 'function', content: string, metadata?: any): Promise<void>;
    /**
     * Get conversation history with token management
     */
    getHistory(conversationId: string, maxTokens?: number): Promise<Array<{
        role: string;
        content: string;
    }>>;
    /**
     * Summarize older messages when hitting token limit
     */
    private summarizeOlderMessages;
    /**
     * Fork conversation at a specific point
     */
    forkConversation(conversationId: string, atMessageId: string, newTitle: string): Promise<string>;
}
/**
 * Main AI Store class
 */
export declare class AIStore {
    private db;
    vectorIndex: VectorIndex;
    rag: RAGSystem;
    cache: LLMCache;
    agentMemory: AgentMemory;
    conversations: ConversationManager;
    constructor(db: JSONIC, embedder: (text: string) => Promise<number[]>, options?: {
        vectorDimension?: number;
        cacheMaxAge?: number;
        tokenCounter?: (text: string) => number;
    });
    /**
     * Initialize AI Store
     */
    initialize(): Promise<void>;
}
export declare function enableAI(db: JSONIC, embedder: (text: string) => Promise<number[]>): AIStore;
//# sourceMappingURL=ai-store.d.ts.map