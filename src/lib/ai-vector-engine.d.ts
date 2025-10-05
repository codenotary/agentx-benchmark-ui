/**
 * High-Performance Vector Engine using WebAssembly
 * Provides 10-100x speedup for vector operations
 */
import { VectorIndex, SimilarityResult } from './ai-store';
export interface VectorEngineWASM {
    new (dimension: number): VectorEngineWASM;
    add_embedding(id: string, embedding: Float32Array, metadata?: string): void;
    search(query: Float32Array, k: number, threshold?: number): any;
    batch_search(queries: Float32Array[], k: number): any;
    cosine_similarity_wasm(a: Float32Array, b: Float32Array): number;
    euclidean_distance_wasm(a: Float32Array, b: Float32Array): number;
    dot_product_wasm(a: Float32Array, b: Float32Array): number;
    kmeans_cluster(k: number, max_iterations: number): string[][];
    get_stats(): {
        total_embeddings: number;
        dimension: number;
        memory_usage: number;
    };
}
export interface HNSWIndexWASM {
    new (dimension: number, m: number, ef_construction: number): HNSWIndexWASM;
    insert(id: string, embedding: Float32Array): void;
    search_knn(query: Float32Array, k: number): any;
}
/**
 * Enhanced VectorIndex with WASM acceleration
 */
export declare class WASMVectorIndex extends VectorIndex {
    private wasmEngine?;
    private hnswIndex?;
    private useHNSW;
    private wasmReady;
    constructor(dimension?: number, metric?: 'cosine' | 'euclidean' | 'dot', options?: {
        useHNSW?: boolean;
        m?: number;
        efConstruction?: number;
    });
    private initializeWASM;
    /**
     * Add embedding with WASM acceleration
     */
    add(id: string, vector: number[] | Float32Array, text: string, metadata?: any): Promise<void>;
    /**
     * Search with WASM acceleration
     */
    search(query: number[] | Float32Array, k?: number, threshold?: number): Promise<SimilarityResult[]>;
    /**
     * Batch search for multiple queries
     */
    batchSearch(queries: Array<number[] | Float32Array>, k?: number): Promise<SimilarityResult[][]>;
    /**
     * K-means clustering with WASM
     */
    cluster(k?: number, maxIterations?: number): Promise<Map<number, string[]>>;
    /**
     * Get performance statistics
     */
    getStats(): Promise<{
        totalEmbeddings: number;
        dimension: number;
        memoryUsage: number;
        indexType: string;
        wasmEnabled: boolean;
    }>;
    /**
     * Static similarity functions using WASM
     */
    static cosineSimilarityWASM(a: Float32Array, b: Float32Array): Promise<number>;
    private static cosineSimilarityJS;
    private formatResults;
}
/**
 * Hybrid search combining vector and keyword search
 */
export declare class HybridSearch {
    private vectorIndex;
    private keywordIndex;
    private documents;
    constructor(dimension?: number, useHNSW?: boolean);
    /**
     * Index a document with both vector and keyword indexing
     */
    indexDocument(id: string, content: string, embedding: Float32Array, metadata?: any): Promise<void>;
    /**
     * Hybrid search combining vector and keyword results
     */
    search(query: string, queryEmbedding: Float32Array, k?: number, options?: {
        vectorWeight?: number;
        keywordWeight?: number;
        rerank?: boolean;
    }): Promise<Array<{
        id: string;
        score: number;
        content: string;
        metadata?: any;
    }>>;
    /**
     * Keyword search using inverted index
     */
    private keywordSearch;
    /**
     * Simple tokenization
     */
    private tokenize;
    /**
     * Rerank results using cross-encoder or other techniques
     */
    private rerankResults;
    /**
     * Calculate query-document overlap
     */
    private calculateOverlap;
    /**
     * Get statistics
     */
    getStats(): Promise<any>;
}
//# sourceMappingURL=ai-vector-engine.d.ts.map