/**
 * SQL Compatibility Layer for JSONIC
 * Provides SQL interface to the underlying document database
 */
import { JSONIC } from './index-new';
interface SQLStatement {
    type: 'select' | 'insert' | 'update' | 'delete' | 'create' | 'drop' | 'alter';
}
/**
 * SQL Parser - converts SQL strings to AST
 */
export declare class SQLParser {
    private pos;
    private query;
    private tokens;
    /**
     * Parse SQL query string
     */
    parse(sql: string): SQLStatement;
    private tokenize;
    private peek;
    private consume;
    private parseSelect;
    private parseColumns;
    private parseColumn;
    private parseAlias;
    private parseTableReferences;
    private parseTableReference;
    private parseJoin;
    private parseExpression;
    private parseOr;
    private parseAnd;
    private parseComparison;
    private parsePrimary;
    private parseExpressionList;
    private parseOrderBy;
    private parseInsert;
    private parseUpdate;
    private parseDelete;
    private parseCreate;
    private parseColumnDefinition;
    private parseDataType;
    private parseDrop;
    private parseAlter;
    private isKeyword;
}
/**
 * SQL to MongoDB Query Translator
 */
export declare class SQLTranslator {
    private tableSchemas;
    /**
     * Translate SQL AST to MongoDB query
     */
    translate(statement: SQLStatement): any;
    private translateSelect;
    private translateExpression;
    private translateBinaryExpression;
    private translateUnaryExpression;
    private getFieldName;
    private buildAggregateFields;
    private translateJoins;
    private extractJoinField;
    private translateInsert;
    private translateUpdate;
    private translateDelete;
    private translateCreate;
    private mapSQLTypeToMongo;
}
/**
 * SQL Engine - Main interface for SQL operations
 */
export declare class SQLEngine {
    private parser;
    private translator;
    private db;
    private tables;
    constructor(db: JSONIC);
    /**
     * Execute SQL query
     */
    execute(sql: string): Promise<any>;
    /**
     * Execute translated MongoDB query
     */
    private executeMongoQuery;
    /**
     * Get or create collection for table
     */
    private getCollection;
    /**
     * Create table with schema
     */
    private createTable;
    /**
     * Execute batch SQL statements (transaction)
     */
    transaction(statements: string[]): Promise<any[]>;
    /**
     * Helper: Create table from SQL
     */
    createTableFromSQL(sql: string): Promise<void>;
    /**
     * Helper: Select query
     */
    select(sql: string): Promise<any[]>;
    /**
     * Helper: Insert query
     */
    insert(sql: string): Promise<any>;
    /**
     * Helper: Update query
     */
    update(sql: string): Promise<any>;
    /**
     * Helper: Delete query
     */
    delete(sql: string): Promise<any>;
}
export declare function enableSQL(db: JSONIC): SQLEngine;
export {};
//# sourceMappingURL=sql-engine.d.ts.map