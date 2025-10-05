/**
 * Aggregation Pipeline Builder for JSONIC
 * Provides a fluent API for building MongoDB-style aggregation pipelines
 */
import { Query, QueryBuilder } from './query-builder';
export type PipelineStage = MatchStage | GroupStage | SortStage | LimitStage | SkipStage | ProjectStage | UnwindStage | LookupStage | CountStage | SampleStage | AddFieldsStage | ReplaceRootStage | OutStage;
export interface MatchStage {
    $match: Query<any>;
}
export interface GroupStage {
    $group: {
        _id: string | null | {
            [field: string]: string;
        };
        [field: string]: any;
    };
}
export interface SortStage {
    $sort: {
        [field: string]: 1 | -1;
    };
}
export interface LimitStage {
    $limit: number;
}
export interface SkipStage {
    $skip: number;
}
export interface ProjectStage {
    $project: {
        [field: string]: 0 | 1 | string | any;
    };
}
export interface UnwindStage {
    $unwind: string | {
        path: string;
        includeArrayIndex?: string;
        preserveNullAndEmptyArrays?: boolean;
    };
}
export interface LookupStage {
    $lookup: {
        from: string;
        localField: string;
        foreignField: string;
        as: string;
        pipeline?: PipelineStage[];
    };
}
export interface CountStage {
    $count: string;
}
export interface SampleStage {
    $sample: {
        size: number;
    };
}
export interface AddFieldsStage {
    $addFields: {
        [field: string]: any;
    };
}
export interface ReplaceRootStage {
    $replaceRoot: {
        newRoot: string | any;
    };
}
export interface OutStage {
    $out: string | {
        db: string;
        coll: string;
    };
}
export type Accumulator = {
    $sum: number | string;
} | {
    $avg: string;
} | {
    $min: string;
} | {
    $max: string;
} | {
    $push: string | any;
} | {
    $addToSet: string | any;
} | {
    $first: string;
} | {
    $last: string;
} | {
    $count: {};
} | {
    $stdDevPop: string;
} | {
    $stdDevSamp: string;
};
export type Expression = string | number | boolean | null | {
    [operator: string]: any;
} | Expression[];
export interface AggregationResult<T = any> {
    data: T[];
    metadata?: {
        executionTime?: number;
        totalDocuments?: number;
        stages?: number;
    };
}
/**
 * Fluent aggregation pipeline builder
 */
export declare class AggregationPipeline<T = any, R = T> {
    private stages;
    constructor(initialStages?: PipelineStage[]);
    /**
     * Add a $match stage
     */
    match(query: Query<T> | QueryBuilder<T>): AggregationPipeline<T, R>;
    /**
     * Add a $group stage
     */
    group(spec: {
        _id: string | null | {
            [field: string]: string;
        };
        [field: string]: any;
    }): AggregationPipeline<T, any>;
    /**
     * Group by a single field with accumulators
     */
    groupBy(field: string | null, accumulators: {
        [outputField: string]: Accumulator;
    }): AggregationPipeline<T, any>;
    /**
     * Add a $sort stage
     */
    sort(spec: {
        [field: string]: 1 | -1;
    }): this;
    /**
     * Sort by a single field
     */
    sortBy(field: string, direction?: 1 | -1): this;
    /**
     * Add a $limit stage
     */
    limit(count: number): this;
    /**
     * Add a $skip stage
     */
    skip(count: number): this;
    /**
     * Add a $project stage
     */
    project(spec: {
        [field: string]: 0 | 1 | string | any;
    }): AggregationPipeline<T, any>;
    /**
     * Select specific fields to include
     */
    select(...fields: string[]): AggregationPipeline<T, any>;
    /**
     * Exclude specific fields
     */
    exclude(...fields: string[]): AggregationPipeline<T, any>;
    /**
     * Add a $unwind stage
     */
    unwind(path: string, options?: {
        includeArrayIndex?: string;
        preserveNullAndEmptyArrays?: boolean;
    }): this;
    /**
     * Add a $lookup stage
     */
    lookup(spec: {
        from: string;
        localField: string;
        foreignField: string;
        as: string;
        pipeline?: AggregationPipeline<any>;
    }): this;
    /**
     * Add a $count stage
     */
    count(field?: string): AggregationPipeline<T, {
        [key: string]: number;
    }>;
    /**
     * Add a $sample stage
     */
    sample(size: number): this;
    /**
     * Add a $addFields stage
     */
    addFields(fields: {
        [field: string]: any;
    }): this;
    /**
     * Add a computed field
     */
    addField(name: string, expression: Expression): this;
    /**
     * Add a $replaceRoot stage
     */
    replaceRoot(newRoot: string | any): AggregationPipeline<T, any>;
    /**
     * Add an $out stage
     */
    out(collection: string): this;
    /**
     * Add a custom stage
     */
    stage(stage: PipelineStage): this;
    /**
     * Build the pipeline array
     */
    build(): PipelineStage[];
    /**
     * Get pipeline as JSON string
     */
    toJSON(): string;
    /**
     * Clone the pipeline
     */
    clone(): AggregationPipeline<T, R>;
    /**
     * Get the number of stages
     */
    get length(): number;
    /**
     * Create a sub-pipeline for $lookup
     */
    static subPipeline<T = any>(): AggregationPipeline<T>;
}
/**
 * Accumulator builder for group stages
 */
export declare class Accumulators {
    static sum(field: string | number): Accumulator;
    static avg(field: string): Accumulator;
    static min(field: string): Accumulator;
    static max(field: string): Accumulator;
    static push(field: string | any): Accumulator;
    static addToSet(field: string | any): Accumulator;
    static first(field: string): Accumulator;
    static last(field: string): Accumulator;
    static count(): Accumulator;
    static stdDevPop(field: string): Accumulator;
    static stdDevSamp(field: string): Accumulator;
}
/**
 * Expression builders for computed fields
 */
export declare class Expressions {
    static add(...values: Expression[]): Expression;
    static subtract(minuend: Expression, subtrahend: Expression): Expression;
    static multiply(...values: Expression[]): Expression;
    static divide(dividend: Expression, divisor: Expression): Expression;
    static mod(dividend: Expression, divisor: Expression): Expression;
    static concat(...strings: Expression[]): Expression;
    static substr(string: Expression, start: number, length: number): Expression;
    static toLower(string: Expression): Expression;
    static toUpper(string: Expression): Expression;
    static size(array: Expression): Expression;
    static arrayElemAt(array: Expression, index: number): Expression;
    static slice(array: Expression, position: number, n?: number): Expression;
    static cond(ifExpr: Expression, thenExpr: Expression, elseExpr: Expression): Expression;
    static ifNull(expr: Expression, replacement: Expression): Expression;
    static and(...expressions: Expression[]): Expression;
    static or(...expressions: Expression[]): Expression;
    static not(expression: Expression): Expression;
    static eq(expr1: Expression, expr2: Expression): Expression;
    static ne(expr1: Expression, expr2: Expression): Expression;
    static gt(expr1: Expression, expr2: Expression): Expression;
    static gte(expr1: Expression, expr2: Expression): Expression;
    static lt(expr1: Expression, expr2: Expression): Expression;
    static lte(expr1: Expression, expr2: Expression): Expression;
    static in(expr: Expression, array: Expression): Expression;
    static dateToString(format: string, date: Expression): Expression;
    static year(date: Expression): Expression;
    static month(date: Expression): Expression;
    static dayOfMonth(date: Expression): Expression;
    static hour(date: Expression): Expression;
    static minute(date: Expression): Expression;
    static second(date: Expression): Expression;
}
export declare function aggregate<T = any>(): AggregationPipeline<T>;
export declare const $sum: typeof Accumulators.sum;
export declare const $avg: typeof Accumulators.avg;
export declare const $min: typeof Accumulators.min;
export declare const $max: typeof Accumulators.max;
export declare const $push: typeof Accumulators.push;
export declare const $addToSet: typeof Accumulators.addToSet;
export declare const $first: typeof Accumulators.first;
export declare const $last: typeof Accumulators.last;
export declare const $count: typeof Accumulators.count;
//# sourceMappingURL=aggregation.d.ts.map