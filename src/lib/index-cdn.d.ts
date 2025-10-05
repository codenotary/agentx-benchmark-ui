/**
 * JSONIC CDN Entry Point
 * Minimal core functionality for CDN distribution
 */
import { JsonDB as WasmJsonDB } from '../pkg/jsonic_wasm.js';
export interface JSONICOptions {
    name?: string;
    persistence?: boolean;
    crossTabSync?: boolean;
}
export interface Document {
    _id?: string;
    [key: string]: any;
}
export interface Query {
    [key: string]: any;
}
export interface UpdateOperators {
    $set?: Record<string, any>;
    $unset?: Record<string, string>;
    $inc?: Record<string, number>;
    $push?: Record<string, any>;
    $pull?: Record<string, any>;
}
export interface FindResult<T> {
    toArray(): Promise<T[]>;
    limit(n: number): FindResult<T>;
    skip(n: number): FindResult<T>;
    sortBy(field: string, order?: 1 | -1): FindResult<T>;
}
export declare class Collection<T extends Document = Document> {
    private db;
    private name;
    constructor(db: WasmJsonDB, name: string);
    insertOne(doc: Omit<T, '_id'>): Promise<T>;
    insertMany(docs: Array<Omit<T, '_id'>>): Promise<{
        insertedCount: number;
        insertedIds: string[];
    }>;
    findOne(query?: Query): Promise<T | null>;
    find(query?: Query): FindResult<T>;
    updateOne(filter: Query, update: UpdateOperators): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    updateMany(filter: Query, update: UpdateOperators): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    deleteOne(filter: Query): Promise<{
        deletedCount: number;
    }>;
    deleteMany(filter: Query): Promise<{
        deletedCount: number;
    }>;
    countDocuments(filter?: Query): Promise<number>;
    private generateUUID;
    private applyUpdate;
}
export declare class JSONIC {
    static version: string;
    private db;
    private name?;
    private persistence?;
    private collections;
    private constructor();
    static create(options?: JSONICOptions): Promise<JSONIC>;
    static createWithServer(config?: JSONICOptions): Promise<JSONIC>;
    collection<T extends Document = Document>(name: string): Collection<T>;
    private loadFromStorage;
    close(): Promise<void>;
    private saveToStorage;
}
export default JSONIC;
//# sourceMappingURL=index-cdn.d.ts.map