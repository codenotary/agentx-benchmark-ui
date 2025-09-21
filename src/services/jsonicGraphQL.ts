/**
 * JSONIC GraphQL Adapter
 * Auto-generates GraphQL schema and resolvers for JSONIC collections
 */

import { jsonicService } from './jsonicService';

// GraphQL type definitions
const typeDefs = `
  type Query {
    # Get a single benchmark result by ID
    benchmark(id: ID!): Benchmark
    
    # Query benchmarks with filters
    benchmarks(
      filter: BenchmarkFilter
      limit: Int
      skip: Int
      sort: BenchmarkSort
    ): [Benchmark!]!
    
    # Get aggregated benchmark statistics
    benchmarkStats(testId: String): BenchmarkStats!
    
    # Get database statistics
    dbStats: DatabaseStats!
    
    # Get debug information (dev only)
    debugInfo: DebugInfo
  }

  type Mutation {
    # Create a new benchmark result
    createBenchmark(input: BenchmarkInput!): Benchmark!
    
    # Create multiple benchmark results
    createBenchmarks(input: [BenchmarkInput!]!): BatchCreateResult!
    
    # Update a benchmark result
    updateBenchmark(id: ID!, input: BenchmarkUpdateInput!): Benchmark
    
    # Update multiple benchmarks
    updateBenchmarks(filter: BenchmarkFilter!, update: BenchmarkUpdateInput!): BatchUpdateResult!
    
    # Delete a benchmark result
    deleteBenchmark(id: ID!): DeleteResult!
    
    # Delete multiple benchmarks
    deleteBenchmarks(filter: BenchmarkFilter!): BatchDeleteResult!
    
    # Clear query cache
    clearCache: Boolean!
    
    # Clear profiler data
    clearProfiler: Boolean!
  }

  type Benchmark {
    id: ID!
    testId: String!
    agentId: String
    timestamp: Float!
    duration: Float!
    status: String!
    operations: Int
    throughput: Float
    metadata: BenchmarkMetadata
    type: String
    error: String
  }

  type BenchmarkMetadata {
    browser: String
    platform: String
    version: String
    memory: MemoryInfo
  }

  type MemoryInfo {
    used: Float
    limit: Float
    percentage: String
  }

  input BenchmarkInput {
    testId: String!
    agentId: String
    timestamp: Float
    duration: Float!
    status: String!
    operations: Int
    throughput: Float
    type: String
    metadata: BenchmarkMetadataInput
  }

  input BenchmarkMetadataInput {
    browser: String
    platform: String
    version: String
  }

  input BenchmarkUpdateInput {
    testId: String
    agentId: String
    duration: Float
    status: String
    operations: Int
    throughput: Float
    type: String
    error: String
  }

  input BenchmarkFilter {
    testId: String
    agentId: String
    status: String
    type: String
    minDuration: Float
    maxDuration: Float
    startTime: Float
    endTime: Float
  }

  input BenchmarkSort {
    field: String!
    order: Int!
  }

  type BatchCreateResult {
    insertedIds: [ID!]!
    insertedCount: Int!
  }

  type BatchUpdateResult {
    matchedCount: Int!
    modifiedCount: Int!
  }

  type DeleteResult {
    success: Boolean!
  }

  type BatchDeleteResult {
    deletedCount: Int!
  }

  type BenchmarkStats {
    testId: String
    avgDuration: Float!
    minDuration: Float!
    maxDuration: Float!
    totalRuns: Int!
    successCount: Int!
    failureCount: Int!
    successRate: Float!
  }

  type DatabaseStats {
    documentCount: Int!
    wasmInitialized: Boolean!
    cacheStats: CacheStats!
    memoryUsage: MemoryInfo!
    indexes: [IndexInfo!]!
  }

  type CacheStats {
    size: Int!
    maxSize: Int!
    hits: Int!
    misses: Int!
    hitRate: String!
  }

  type IndexInfo {
    field: String!
    type: String!
    entries: Int!
  }

  type DebugInfo {
    cache: CacheStats!
    slowQueries: [SlowQuery!]!
    memory: MemoryInfo!
    indexes: [IndexInfo!]!
  }

  type SlowQuery {
    operation: String!
    duration: Float!
    details: String
  }
`;

// GraphQL resolvers
const createResolvers = () => ({
  Query: {
    benchmark: async (_: any, { id }: { id: string }) => {
      const result = await jsonicService.get(id);
      return result ? { id, ...result } : null;
    },

    benchmarks: async (_: any, { filter, limit, skip, sort }: any) => {
      // Build MongoDB-style filter from GraphQL filter
      const mongoFilter: any = {};
      
      if (filter) {
        if (filter.testId) mongoFilter.testId = filter.testId;
        if (filter.agentId) mongoFilter.agentId = filter.agentId;
        if (filter.status) mongoFilter.status = filter.status;
        if (filter.type) mongoFilter.type = filter.type;
        
        if (filter.minDuration || filter.maxDuration) {
          mongoFilter.duration = {};
          if (filter.minDuration) mongoFilter.duration.$gte = filter.minDuration;
          if (filter.maxDuration) mongoFilter.duration.$lte = filter.maxDuration;
        }
        
        if (filter.startTime || filter.endTime) {
          mongoFilter.timestamp = {};
          if (filter.startTime) mongoFilter.timestamp.$gte = filter.startTime;
          if (filter.endTime) mongoFilter.timestamp.$lte = filter.endTime;
        }
      }

      // Build query with chaining
      let query = jsonicService.find(mongoFilter);
      
      if (sort) {
        query = query.sort({ [sort.field]: sort.order });
      }
      if (skip) {
        query = query.skip(skip);
      }
      if (limit) {
        query = query.limit(limit);
      }
      
      return query.exec();
    },

    benchmarkStats: async (_: any, { testId }: { testId?: string }) => {
      const stats = await jsonicService.getBenchmarkStats(testId);
      if (stats.length === 0) {
        return {
          testId,
          avgDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          totalRuns: 0,
          successCount: 0,
          failureCount: 0,
          successRate: 0
        };
      }
      
      const stat = stats[0];
      return {
        ...stat,
        successRate: stat.totalRuns > 0 
          ? (stat.successCount / stat.totalRuns) * 100 
          : 0
      };
    },

    dbStats: async () => {
      const stats = await jsonicService.getStats();
      return {
        documentCount: stats.document_count || 0,
        wasmInitialized: stats.wasm_initialized || false,
        cacheStats: stats.cache || {
          size: 0,
          maxSize: 100,
          hits: 0,
          misses: 0,
          hitRate: '0%'
        },
        memoryUsage: stats.memory || {
          used: stats.memoryUsage || 0,
          limit: stats.memoryLimit || 0,
          percentage: '0%'
        },
        indexes: stats.indexes || []
      };
    },

    debugInfo: async () => {
      if (!import.meta.env.DEV) {
        return null; // Only available in development
      }
      
      const debug = await jsonicService.getDebugInfo();
      return {
        cache: debug.cache,
        slowQueries: debug.slowQueries.map((q: any) => ({
          operation: q.operation,
          duration: q.duration,
          details: JSON.stringify(q.details)
        })),
        memory: debug.memory,
        indexes: debug.indexes
      };
    }
  },

  Mutation: {
    createBenchmark: async (_: any, { input }: any) => {
      const id = await jsonicService.insert({
        ...input,
        timestamp: input.timestamp || Date.now()
      });
      return { id, ...input };
    },

    createBenchmarks: async (_: any, { input }: any) => {
      const documents = input.map((doc: any) => ({
        ...doc,
        timestamp: doc.timestamp || Date.now()
      }));
      
      const insertedIds = await jsonicService.insertMany(documents);
      return {
        insertedIds,
        insertedCount: insertedIds.length
      };
    },

    updateBenchmark: async (_: any, { id, input }: any) => {
      await jsonicService.update(id, input);
      const updated = await jsonicService.get(id);
      return updated ? { id, ...updated } : null;
    },

    updateBenchmarks: async (_: any, { filter, update }: any) => {
      // Build MongoDB-style filter
      const mongoFilter: any = {};
      
      if (filter.testId) mongoFilter.testId = filter.testId;
      if (filter.agentId) mongoFilter.agentId = filter.agentId;
      if (filter.status) mongoFilter.status = filter.status;
      if (filter.type) mongoFilter.type = filter.type;
      
      // Build update operations
      const updateOps: any = { $set: {} };
      for (const [key, value] of Object.entries(update)) {
        if (value !== undefined) {
          updateOps.$set[key] = value;
        }
      }
      
      return jsonicService.updateMany(mongoFilter, updateOps);
    },

    deleteBenchmark: async (_: any, { id }: { id: string }) => {
      await jsonicService.delete(id);
      return { success: true };
    },

    deleteBenchmarks: async (_: any, { filter }: any) => {
      // Build MongoDB-style filter
      const mongoFilter: any = {};
      
      if (filter.testId) mongoFilter.testId = filter.testId;
      if (filter.agentId) mongoFilter.agentId = filter.agentId;
      if (filter.status) mongoFilter.status = filter.status;
      if (filter.type) mongoFilter.type = filter.type;
      
      return jsonicService.deleteMany(mongoFilter);
    },

    clearCache: async () => {
      await jsonicService.clearCache();
      return true;
    },

    clearProfiler: async () => {
      await jsonicService.clearProfiler();
      return true;
    }
  }
});

// Helper to execute GraphQL queries without a full server
export class JsonicGraphQL {
  private resolvers: any;

  constructor() {
    this.resolvers = createResolvers();
  }

  async query(queryName: string, args?: any) {
    const resolver = this.resolvers.Query[queryName];
    if (!resolver) {
      throw new Error(`Query '${queryName}' not found`);
    }
    return resolver(null, args || {});
  }

  async mutation(mutationName: string, args?: any) {
    const resolver = this.resolvers.Mutation[mutationName];
    if (!resolver) {
      throw new Error(`Mutation '${mutationName}' not found`);
    }
    return resolver(null, args || {});
  }

  getTypeDefs(): string {
    return typeDefs;
  }

  getResolvers(): any {
    return this.resolvers;
  }

  // Convenience methods for common operations
  async getBenchmarks(filter?: any, options?: { limit?: number; skip?: number; sort?: any }) {
    return this.query('benchmarks', { filter, ...options });
  }

  async createBenchmark(data: any) {
    return this.mutation('createBenchmark', { input: data });
  }

  async createBenchmarks(data: any[]) {
    return this.mutation('createBenchmarks', { input: data });
  }

  async updateBenchmarks(filter: any, update: any) {
    return this.mutation('updateBenchmarks', { filter, update });
  }

  async deleteBenchmarks(filter: any) {
    return this.mutation('deleteBenchmarks', { filter });
  }

  async getStats() {
    return this.query('dbStats');
  }

  async getBenchmarkStats(testId?: string) {
    return this.query('benchmarkStats', { testId });
  }
}

// Export singleton instance
export const jsonicGraphQL = new JsonicGraphQL();

// Export for use with Apollo Server or other GraphQL servers
export { typeDefs, createResolvers };