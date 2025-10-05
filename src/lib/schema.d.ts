/**
 * Schema definitions and validation for JSONIC
 * Provides type-safe document schemas with runtime validation
 */
export type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'date' | 'uuid' | 'email' | 'url';
export interface FieldSchema {
    type: SchemaType | SchemaType[];
    required?: boolean;
    default?: any;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string | RegExp;
    enum?: any[];
    unique?: boolean;
    indexed?: boolean;
    validator?: (value: any) => boolean | string;
    transform?: (value: any) => any;
    items?: FieldSchema;
    properties?: {
        [key: string]: FieldSchema;
    };
}
export interface SchemaDefinition {
    [field: string]: FieldSchema | SchemaType;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    data?: any;
}
/**
 * Schema class for defining and validating document structures
 */
export declare class Schema<T = any> {
    private fields;
    private requiredFields;
    private indexes;
    private uniqueFields;
    private options?;
    constructor(definition: SchemaDefinition, options?: {
        strict?: boolean;
    });
    private parseDefinition;
    /**
     * Validate a document against the schema
     */
    validate(doc: any): ValidationResult;
    /**
     * Validate a single field
     */
    private validateField;
    /**
     * Check if a value matches a type
     */
    private checkType;
    /**
     * Cast a value to match the schema
     */
    cast(doc: any): any;
    /**
     * Get indexes defined in the schema
     */
    getIndexes(): string[];
    /**
     * Get unique fields defined in the schema
     */
    getUniqueFields(): string[];
    /**
     * Get required fields
     */
    getRequiredFields(): string[];
    /**
     * Create a TypeScript type from the schema
     */
    toTypeScript(): string;
    private schemaTypeToTS;
}
export declare function schema<T = any>(definition: SchemaDefinition, options?: {
    strict?: boolean;
}): Schema<T>;
export declare const validators: {
    email: (value: string) => true | "Invalid email address";
    url: (value: string) => true | "Invalid URL";
    uuid: (value: string) => true | "Invalid UUID";
    alphanumeric: (value: string) => true | "Must be alphanumeric";
    phone: (value: string) => true | "Invalid phone number";
    creditCard: (value: string) => true | "Invalid credit card number";
};
export declare const transformers: {
    lowercase: (value: string) => string;
    uppercase: (value: string) => string;
    trim: (value: string) => string;
    capitalize: (value: string) => string;
    slug: (value: string) => string;
    toDate: (value: any) => Date;
    toNumber: (value: any) => number;
    toString: (value: any) => string;
    toBoolean: (value: any) => boolean;
};
//# sourceMappingURL=schema.d.ts.map