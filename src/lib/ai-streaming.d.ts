/**
 * Streaming AI Responses and Function Calling
 * Real-time generation with tool use support
 */
import { LLMProvider } from './ai-llm-integration';
import { JSONIC } from './index-new';
/**
 * Function/Tool Definition
 */
export interface FunctionDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute?: (args: any) => Promise<any>;
}
/**
 * Streaming Response Interface
 */
export interface StreamingResponse {
    onChunk?: (chunk: string) => void;
    onFunctionCall?: (name: string, args: any) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
}
/**
 * Enhanced LLM Provider with Streaming
 */
export interface StreamingLLMProvider extends LLMProvider {
    generateStreamingCompletion(prompt: string, options?: any, callbacks?: StreamingResponse): Promise<AsyncGenerator<string>>;
    generateWithFunctions(prompt: string, functions: FunctionDefinition[], options?: any): Promise<{
        content?: string;
        functionCall?: {
            name: string;
            arguments: any;
        };
    }>;
}
/**
 * OpenAI Streaming Provider
 */
export declare class OpenAIStreamingProvider implements StreamingLLMProvider {
    name: string;
    private apiKey;
    private baseURL;
    private model;
    constructor(apiKey: string);
    generateEmbedding(text: string): Promise<Float32Array>;
    generateCompletion(prompt: string, options?: any): Promise<string>;
    generateStructuredOutput(prompt: string, schema: any): Promise<any>;
    generateStreamingCompletion(prompt: string, options?: any, callbacks?: StreamingResponse): Promise<AsyncGenerator<string>>;
    generateWithFunctions(prompt: string, functions: FunctionDefinition[], options?: any): Promise<{
        content?: string;
        functionCall?: {
            name: string;
            arguments: any;
        };
    }>;
}
/**
 * Function Calling Agent
 */
export declare class FunctionCallingAgent {
    private provider;
    private functions;
    private conversationHistory;
    private db?;
    constructor(provider: StreamingLLMProvider, functions?: FunctionDefinition[], db?: JSONIC);
    /**
     * Register a function/tool
     */
    registerFunction(func: FunctionDefinition): void;
    /**
     * Execute a prompt with function calling
     */
    execute(prompt: string, options?: {
        maxIterations?: number;
        streaming?: boolean;
        callbacks?: StreamingResponse;
    }): Promise<string>;
    /**
     * Stream execution with function calling
     */
    streamExecute(prompt: string, options?: {
        maxIterations?: number;
        callbacks?: StreamingResponse;
    }): AsyncGenerator<string | {
        functionCall: {
            name: string;
            args: any;
        };
    }>;
    /**
     * Register default database functions
     */
    private registerDefaultFunctions;
    /**
     * Build prompt from conversation history
     */
    private buildPrompt;
    /**
     * Clear conversation history
     */
    clearHistory(): void;
}
/**
 * Real-time Collaborative AI Session
 */
export declare class CollaborativeAISession {
    private sessionId;
    private participants;
    private provider;
    private broadcastChannel?;
    private messageQueue;
    constructor(sessionId: string, provider: StreamingLLMProvider);
    /**
     * Join the session
     */
    join(participantId: string, name: string, role?: 'user' | 'assistant'): void;
    /**
     * Send a message with streaming response
     */
    sendMessage(participantId: string, message: string): AsyncGenerator<{
        type: string;
        content?: string;
        from?: string;
    }>;
    /**
     * Setup broadcast channel listeners
     */
    private setupBroadcastListeners;
    /**
     * Broadcast message to all participants
     */
    private broadcast;
    /**
     * Build conversation context
     */
    private buildContext;
    /**
     * Get session statistics
     */
    getStats(): any;
}
//# sourceMappingURL=ai-streaming.d.ts.map