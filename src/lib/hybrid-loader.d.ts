/**
 * JSONIC Hybrid Loader
 *
 * Intelligently loads features based on usage patterns.
 * Core functionality loads immediately, features load on-demand.
 * Falls back gracefully if features aren't available.
 */
import type { JSONICConfig } from './types';
declare const FEATURE_MODULES: {
    readonly sql: () => Promise<typeof import("./features/sql-engine")>;
    readonly ai: () => Promise<typeof import("./features/ai-store")>;
    readonly sync: () => Promise<typeof import("./features/sync-adapter")>;
    readonly graphql: () => Promise<typeof import("./features/graphql-adapter")>;
    readonly debug: () => Promise<typeof import("./features/debug-tools")>;
    readonly reactive: () => Promise<typeof import("./features/reactive")>;
    readonly react: () => Promise<typeof import("./bindings/react-hooks")>;
    readonly vue: () => Promise<typeof import("./bindings/vue-composables")>;
};
export declare class HybridJSONIC {
    static instance: HybridJSONIC | null;
    private loadedFeatures;
    private loadingFeatures;
    private featureDetector;
    private config;
    private wasmModules;
    constructor(config?: JSONICConfig);
    /**
     * Create or get singleton instance
     */
    static create(config?: JSONICConfig): Promise<HybridJSONIC>;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Load core functionality
     */
    private loadCore;
    /**
     * Load WASM chunk progressively
     */
    private loadWASMChunk;
    /**
     * Load a feature module on-demand
     */
    loadFeature(feature: keyof typeof FEATURE_MODULES): Promise<any>;
    /**
     * Perform actual feature loading
     */
    private performFeatureLoad;
    /**
     * Get loaded feature
     */
    getFeature(feature: string): any;
    /**
     * Check if feature is loaded
     */
    hasFeature(feature: string): boolean;
    /**
     * Get list of loaded features
     */
    getLoadedFeatures(): string[];
    /**
     * Preload features based on configuration
     */
    private preloadFeatures;
    /**
     * Enable a feature at runtime
     */
    enableFeature(feature: keyof typeof FEATURE_MODULES): Promise<void>;
    /**
     * Disable a feature (unload from memory)
     */
    disableFeature(feature: string): void;
    /**
     * Get feature statistics
     */
    getStats(): {
        loadedFeatures: string[];
        memoryUsage: {
            usedJSHeapSize: any;
            totalJSHeapSize: any;
            jsHeapSizeLimit: any;
        } | null;
        wasmModules: string[];
        config: JSONICConfig;
    };
    /**
     * Get memory usage
     */
    private getMemoryUsage;
    /**
     * Create database with automatic feature detection
     */
    createDatabase(config?: any): Promise<import("./index-new").JSONIC>;
    /**
     * Determine which feature is required for a property/method
     */
    private getRequiredFeature;
}
export declare function createJSONIC(config?: JSONICConfig): Promise<import("./index-new").JSONIC>;
export declare function loadFeature(feature: keyof typeof FEATURE_MODULES): Promise<any>;
export declare function hasFeature(feature: string): boolean;
export declare function getLoadedFeatures(): string[];
export {};
//# sourceMappingURL=hybrid-loader.d.ts.map