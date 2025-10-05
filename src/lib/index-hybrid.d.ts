/**
 * JSONIC Hybrid Entry Point
 *
 * Main entry point for the hybrid distribution mode.
 * Registers Service Worker and initializes progressive loading.
 */
import { HybridJSONIC, createJSONIC } from './hybrid-loader';
import { featureDetector } from './core/feature-detector';
/**
 * Initialize JSONIC with optimal defaults
 */
export declare function initJSONIC(config?: any): Promise<any>;
/**
 * Pre-cache features based on usage patterns
 */
export declare function preCacheFeatures(features: string[]): Promise<void>;
/**
 * Get cache status for debugging
 */
export declare function getCacheStatus(): Promise<any>;
/**
 * Clear all caches
 */
export declare function clearCache(): Promise<void>;
export { HybridJSONIC, createJSONIC, featureDetector };
declare const _default: {
    init: typeof initJSONIC;
    create: typeof createJSONIC;
    HybridJSONIC: typeof HybridJSONIC;
    featureDetector: import("./core/feature-detector").FeatureDetector;
};
export default _default;
//# sourceMappingURL=index-hybrid.d.ts.map