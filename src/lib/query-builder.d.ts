/**
 * Query Builder for JSONIC
 * Provides a fluent API for building MongoDB-style queries
 */
export type Primitive = string | number | boolean | null;
export type JsonValue = Primitive | JsonObject | JsonArray;
export interface JsonObject {
    [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {
}
export interface QueryOperators<T = any> {
    $eq?: T;
    $ne?: T;
    $gt?: T;
    $gte?: T;
    $lt?: T;
    $lte?: T;
    $in?: T[];
    $nin?: T[];
    $regex?: string | RegExp;
    $exists?: boolean;
    $type?: string;
    $size?: number;
    $all?: T[];
    $elemMatch?: QueryCondition<T>;
    $not?: QueryCondition<T>;
}
export interface LogicalOperators<T = any> {
    $and?: Array<QueryCondition<T>>;
    $or?: Array<QueryCondition<T>>;
    $nor?: Array<QueryCondition<T>>;
}
export type QueryCondition<T = any> = T | QueryOperators<T> | LogicalOperators<T>;
export type FieldQuery<T> = {
    [K in keyof T]?: T[K] extends object ? QueryCondition<T[K]> | FieldQuery<T[K]> : QueryCondition<T[K]>;
};
export type Query<T = any> = FieldQuery<T> & LogicalOperators<T>;
export type SortDirection = 1 | -1 | 'asc' | 'desc';
export type SortSpec<T> = Partial<Record<keyof T, SortDirection>>;
export type ProjectionSpec<T> = Partial<Record<keyof T, 0 | 1 | boolean>>;
/**
 * Fluent query builder for constructing complex queries
 */
export declare class QueryBuilder<T = any> {
    private query;
    private sortSpec?;
    private limitValue?;
    private skipValue?;
    private projectionSpec?;
    constructor(initialQuery?: Query<T>);
    /**
     * Add an equality condition
     */
    where<K extends keyof T>(field: K, value: T[K]): this;
    /**
     * Add a field condition with operators
     */
    field<K extends keyof T>(field: K): FieldOperatorBuilder<T, K>;
    /**
     * Add an $and condition
     */
    and(...conditions: Array<Query<T> | QueryBuilder<T>>): this;
    /**
     * Add an $or condition
     */
    or(...conditions: Array<Query<T> | QueryBuilder<T>>): this;
    /**
     * Add a $nor condition
     */
    nor(...conditions: Array<Query<T> | QueryBuilder<T>>): this;
    /**
     * Add text search
     */
    text(search: string, options?: {
        caseSensitive?: boolean;
        language?: string;
    }): this;
    /**
     * Add regex search on a field
     */
    regex<K extends keyof T>(field: K, pattern: string | RegExp, flags?: string): this;
    /**
     * Check if field exists
     */
    exists<K extends keyof T>(field: K, exists?: boolean): this;
    /**
     * Add sorting
     */
    sort(spec: SortSpec<T>): this;
    /**
     * Sort by a single field
     */
    sortBy<K extends keyof T>(field: K, direction?: SortDirection): this;
    /**
     * Set result limit
     */
    limit(count: number): this;
    /**
     * Skip results
     */
    skip(count: number): this;
    /**
     * Set projection (fields to include/exclude)
     */
    project(spec: ProjectionSpec<T>): this;
    /**
     * Select specific fields to include
     */
    select<K extends keyof T>(...fields: K[]): this;
    /**
     * Exclude specific fields
     */
    exclude<K extends keyof T>(...fields: K[]): this;
    /**
     * Clone the query builder
     */
    clone(): QueryBuilder<T>;
    /**
     * Build the final query object
     */
    build(): {
        projection?: Partial<Record<keyof T, boolean | 0 | 1>> | undefined;
        skip?: number | undefined;
        limit?: number | undefined;
        sort?: Partial<Record<keyof T, SortDirection>> | undefined;
        query: Query<T>;
    };
    /**
     * Get just the query part (without options)
     */
    buildQuery(): Query<T>;
    /**
     * Convert to JSON string
     */
    toJSON(): string;
    /**
     * Create query builder from JSON
     */
    static fromJSON<T = any>(json: string): QueryBuilder<T>;
}
/**
 * Builder for field-specific operators
 */
declare class FieldOperatorBuilder<T, K extends keyof T> {
    private queryBuilder;
    private field;
    constructor(queryBuilder: QueryBuilder<T>, field: K);
    private addCondition;
    equals(value: T[K]): QueryBuilder<T>;
    eq(value: T[K]): QueryBuilder<T>;
    ne(value: T[K]): QueryBuilder<T>;
    gt(value: T[K]): QueryBuilder<T>;
    gte(value: T[K]): QueryBuilder<T>;
    lt(value: T[K]): QueryBuilder<T>;
    lte(value: T[K]): QueryBuilder<T>;
    in(values: T[K][]): QueryBuilder<T>;
    nin(values: T[K][]): QueryBuilder<T>;
    exists(exists?: boolean): QueryBuilder<T>;
    regex(pattern: string | RegExp, flags?: string): QueryBuilder<T>;
    size(size: number): QueryBuilder<T>;
    all(values: any[]): QueryBuilder<T>;
    elemMatch(condition: any): QueryBuilder<T>;
    not(condition: any): QueryBuilder<T>;
    between(min: T[K], max: T[K], inclusive?: boolean): QueryBuilder<T>;
}
export declare function query<T = any>(): QueryBuilder<T>;
export declare function where<T = any>(field: keyof T, value: any): QueryBuilder<T>;
export {};
//# sourceMappingURL=query-builder.d.ts.map