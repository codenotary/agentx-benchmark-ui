/**
 * Advanced JSONIC features
 * Import from 'jsonic-db/advanced' for advanced functionality
 */
export { QueryBuilder, query, where, type Query, type QueryCondition, type QueryOperators, type LogicalOperators, type SortDirection, type ProjectionSpec } from './query-builder';
export { Schema, schema, validators, transformers, type SchemaDefinition, type FieldSchema, type SchemaType, type ValidationResult, type ValidationError } from './schema';
export { observe, liveQuery, reactiveView, type Observable, type ReactiveView, type LiveQuery, type CrossTabSync, type ChangeTracker, type ChangeEvent, type ChangeType, type Observer, type Unsubscribe } from './reactive';
export { aggregate, $sum, $avg, $min, $max, $push, $addToSet, $first, $last, $count, type AggregationPipeline, type PipelineStage, type Accumulator, type Accumulators, type Expression, type Expressions } from './aggregation';
export type { InsertOptions, UpdateOptions, DeleteOptions, BulkWriteOperation, BulkWriteResult } from './collection';
export { PersistentJsonDB, PersistenceManager, isOPFSAvailable, requestPersistentStorage, getStorageEstimate, type PersistenceConfig, type PersistenceStats } from './persistence';
export { SQLEngine } from './sql-engine';
export { SyncAdapter, WebSocketSyncAdapter, HTTPSyncAdapter, type ConflictResolution } from './sync-adapter';
export { JSONICServerClient, type ServerConfig, type SyncState } from './jsonic-server-client';
export { DebugTools, createDebugTools } from './features/debug-tools';
export { GraphQLAdapter } from './features/graphql-adapter';
//# sourceMappingURL=advanced.d.ts.map