/**
 * Google Gemini AI Provider for JSONIC
 * Supports Gemini Pro, Gemini Pro Vision, and embedding models
 */
import { StreamingLLMProvider, StreamingResponse, FunctionDefinition } from './ai-streaming';
/**
 * Gemini Model Types
 */
export type GeminiModel = 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-pro' | 'gemini-1.5-pro-latest' | 'gemini-1.5-flash' | 'gemini-1.5-flash-latest' | 'text-embedding-004' | 'embedding-001';
/**
 * Gemini Safety Settings
 */
export interface SafetySettings {
    category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
    threshold: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
}
/**
 * Gemini Generation Config
 */
export interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    candidateCount?: number;
}
/**
 * Google Gemini Provider Implementation
 */
export declare class GeminiProvider implements StreamingLLMProvider {
    name: string;
    private apiKey;
    private baseURL;
    private model;
    private generationConfig;
    private safetySettings;
    constructor(apiKey: string, model?: GeminiModel, config?: {
        generationConfig?: GenerationConfig;
        safetySettings?: SafetySettings[];
    });
    /**
     * Generate embeddings using Gemini embedding models
     */
    generateEmbedding(text: string): Promise<Float32Array>;
    /**
     * Generate text completion
     */
    generateCompletion(prompt: string, options?: any): Promise<string>;
    /**
     * Generate structured output (JSON)
     */
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
    /**
     * Generate streaming completion
     */
    generateStreamingCompletion(prompt: string, options?: any, callbacks?: StreamingResponse): Promise<AsyncGenerator<string>>;
    /**
     * Generate with function calling
     */
    generateWithFunctions(prompt: string, functions: FunctionDefinition[], options?: any): Promise<{
        content?: string;
        functionCall?: {
            name: string;
            arguments: any;
        };
    }>;
    /**
     * Multi-modal generation (with images)
     */
    generateWithImage(prompt: string, imageData: string | Uint8Array, mimeType?: string): Promise<string>;
    /**
     * Count tokens in text
     */
    countTokens(text: string): Promise<number>;
    /**
     * Get model information
     */
    getModelInfo(): Promise<any>;
    /**
     * Update model
     */
    setModel(model: GeminiModel): void;
    /**
     * Update generation config
     */
    setGenerationConfig(config: GenerationConfig): void;
    /**
     * Update safety settings
     */
    setSafetySettings(settings: SafetySettings[]): void;
}
/**
 * Factory function for Gemini provider
 */
export declare function createGeminiProvider(apiKey: string, options?: {
    model?: GeminiModel;
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySettings[];
}): GeminiProvider;
//# sourceMappingURL=ai-gemini-provider.d.ts.map