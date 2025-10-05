/**
 * JSONIC Type Definitions
 */
export interface JSONICConfig {
    name?: string;
    persistence?: boolean;
    crossTabSync?: boolean;
    features?: FeatureFlags;
    performance?: {
        enableWASM?: boolean;
        cacheSize?: number;
        batchSize?: number;
    };
    [key: string]: any;
}
export interface FeatureFlags {
    sql?: boolean;
    ai?: boolean;
    sync?: boolean;
    graphql?: boolean;
    debug?: boolean;
    reactive?: boolean;
    [key: string]: boolean | undefined;
}
export type LoadingMode = 'minimal' | 'hybrid' | 'full';
export interface FeatureModule {
    init?: (instance: any) => Promise<void>;
    [key: string]: any;
}
//# sourceMappingURL=types.d.ts.map