/**
 * JSONIC GraphQL Adapter
 * Provides GraphQL API interface for JSONIC database
 */
export interface JSONIC {
    collection(name: string): any;
}
export interface GraphQLResult {
    data?: any;
    errors?: GraphQLError[];
}
export interface GraphQLError {
    message: string;
    path?: string[];
    extensions?: Record<string, any>;
}
export interface GraphQLField {
    type: string;
    required: boolean;
}
export interface GraphQLType {
    name: string;
    fields: Record<string, GraphQLField>;
    collectionName: string;
    operations: string[];
}
/**
 * Schema Builder for fluent API
 */
export declare class SchemaBuilder {
    private adapter;
    private currentType;
    private customOperations;
    constructor(adapter: GraphQLAdapter);
    type(name: string): SchemaBuilder;
    field(name: string, type: string, required?: boolean): SchemaBuilder;
    operation(name: string, resolver: Function): SchemaBuilder;
    end(): SchemaBuilder;
    build(): void;
}
/**
 * Main GraphQL Adapter class
 */
export declare class GraphQLAdapter {
    private db;
    types: Map<string, GraphQLType>;
    customOperations: Map<string, Function>;
    private subscriptions;
    private subscriptionCounter;
    constructor(db: JSONIC);
    /**
     * Define a GraphQL type
     */
    defineType(typeDef: string, collectionName?: string): GraphQLType;
    /**
     * Execute a GraphQL query or mutation
     */
    execute(query: string, variables?: Record<string, any>): Promise<GraphQLResult>;
    /**
     * Subscribe to data changes
     */
    subscribe(subscription: string, variables?: Record<string, any>, callback?: (data: any) => void): () => void;
    /**
     * Build schema with fluent API
     */
    buildSchema(): SchemaBuilder;
    /**
     * Enable query result caching
     */
    enableCache(options: {
        ttl: number;
        maxSize: number;
    }): void;
}
//# sourceMappingURL=graphql-adapter.d.ts.map