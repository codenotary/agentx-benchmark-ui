/**
 * JSONIC Hybrid Loader
 * 
 * Intelligently loads features based on usage patterns.
 * Core functionality loads immediately, features load on-demand.
 */

import { featureDetector } from './core/feature-detector';

// Feature module map for dynamic imports
const FEATURE_MODULES = {
  debug: () => import(/* webpackChunkName: "jsonic-debug" */ './features/debug-tools'),
  performance: () => import(/* webpackChunkName: "jsonic-performance" */ './features/performance-monitor'),
} as const;

export interface JSONICConfig {
  mode?: 'minimal' | 'hybrid' | 'full';
  autoLoad?: boolean;
  features?: {
    debug?: boolean;
    performance?: boolean;
  };
  preload?: string[];
  lazyLoad?: boolean;
}

export class HybridJSONIC {
  private static instance: HybridJSONIC | null = null;
  private loadedFeatures = new Set<string>();
  private loadingFeatures = new Map<string, Promise<any>>();
  private config: JSONICConfig;
  private db: any = null;
  
  constructor(config: JSONICConfig = {}) {
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
    
    // Start preloading based on config
    if (this.config.autoLoad) {
      this.preloadFeatures();
    }
  }

  /**
   * Create or get singleton instance
   */
  static async create(config?: JSONICConfig): Promise<HybridJSONIC> {
    if (!HybridJSONIC.instance) {
      HybridJSONIC.instance = new HybridJSONIC(config);
      await HybridJSONIC.instance.loadCore();
    }
    return HybridJSONIC.instance;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): JSONICConfig {
    return {
      mode: 'hybrid',
      autoLoad: true,
      features: {
        debug: process.env.NODE_ENV !== 'production',
        performance: true,
      },
      preload: [],
      lazyLoad: true,
    };
  }

  /**
   * Load core functionality
   */
  private async loadCore(): Promise<void> {
    // Import existing JSONIC implementation
    const jsonicModule = await import('../services/jsonicService');
    this.db = jsonicModule.jsonicService;
    
    this.loadedFeatures.add('core');
    featureDetector.registerFeature('core', this.db);
    
    // Load performance monitoring by default in hybrid mode
    if (this.config.mode === 'hybrid' || this.config.mode === 'full') {
      await this.loadFeature('performance');
    }
  }

  /**
   * Load a feature module on-demand
   */
  async loadFeature(feature: keyof typeof FEATURE_MODULES): Promise<any> {
    // Check if already loaded
    if (this.loadedFeatures.has(feature)) {
      return this.getFeature(feature);
    }

    // Check if currently loading
    if (this.loadingFeatures.has(feature)) {
      return this.loadingFeatures.get(feature);
    }

    // Start loading
    const loadPromise = this.performFeatureLoad(feature);
    this.loadingFeatures.set(feature, loadPromise);
    
    try {
      const module = await loadPromise;
      this.loadedFeatures.add(feature);
      this.loadingFeatures.delete(feature);
      
      // Register with feature detector
      featureDetector.registerFeature(feature, module);
      
      return module;
    } catch (error) {
      this.loadingFeatures.delete(feature);
      console.error(`Failed to load feature ${feature}:`, error);
      throw error;
    }
  }

  /**
   * Perform the actual feature loading
   */
  private async performFeatureLoad(feature: keyof typeof FEATURE_MODULES): Promise<any> {
    const loader = FEATURE_MODULES[feature];
    if (!loader) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    console.log(`[JSONIC] Loading feature: ${feature}`);
    const start = performance.now();
    
    const module = await loader();
    
    const loadTime = performance.now() - start;
    console.log(`[JSONIC] Feature ${feature} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Initialize feature if it has an init method
    const featureModule = module.default || module;
    if (featureModule && typeof featureModule.init === 'function') {
      await featureModule.init(this.db);
    }
    
    return module.default || module;
  }

  /**
   * Preload features based on configuration
   */
  private async preloadFeatures(): Promise<void> {
    const features = this.config.preload || [];
    
    // Add features based on mode
    if (this.config.mode === 'full') {
      Object.keys(FEATURE_MODULES).forEach(f => {
        if (!features.includes(f)) {
          features.push(f);
        }
      });
    }
    
    // Load features in parallel
    if (features.length > 0) {
      console.log(`[JSONIC] Preloading features: ${features.join(', ')}`);
      await Promise.all(
        features.map(f => this.loadFeature(f as keyof typeof FEATURE_MODULES))
      );
    }
  }

  /**
   * Get a loaded feature
   */
  getFeature(name: string): any {
    return featureDetector.getFeature(name);
  }

  /**
   * Check if a feature is loaded
   */
  hasFeature(name: string): boolean {
    return this.loadedFeatures.has(name);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      mode: this.config.mode,
      loaded: Array.from(this.loadedFeatures),
      pendingLoads: Array.from(this.loadingFeatures.keys()),
      ...featureDetector.getStats()
    };
  }

  /**
   * Get the database instance
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Unload a feature
   */
  async unloadFeature(feature: string): Promise<void> {
    if (!this.loadedFeatures.has(feature)) {
      return;
    }

    const module = this.getFeature(feature);
    
    // Call cleanup if available
    if (module?.cleanup) {
      await module.cleanup();
    }
    
    this.loadedFeatures.delete(feature);
    featureDetector.unregisterFeature(feature);
    
    console.log(`[JSONIC] Feature ${feature} unloaded`);
  }

  /**
   * Reset to initial state
   */
  async reset(): Promise<void> {
    // Unload all features except core
    for (const feature of this.loadedFeatures) {
      if (feature !== 'core') {
        await this.unloadFeature(feature);
      }
    }
    
    // Clear the instance
    HybridJSONIC.instance = null;
  }
}

/**
 * Create JSONIC instance with configuration
 */
export async function createJSONIC(config?: JSONICConfig): Promise<any> {
  const hybrid = await HybridJSONIC.create(config);
  return hybrid.getDatabase();
}

/**
 * Initialize JSONIC with optimal defaults
 */
export async function initJSONIC(config?: JSONICConfig): Promise<any> {
  // Determine optimal mode based on environment
  const mode = determineOptimalMode();
  
  // Create database with hybrid loader
  const db = await createJSONIC({
    ...config,
    mode,
    features: {
      debug: process.env.NODE_ENV !== 'production',
      performance: true,
      ...config?.features
    }
  });
  
  // Log initialization info
  console.log(`[JSONIC] Initialized in ${mode} mode`);
  console.log('[JSONIC] Capabilities:', featureDetector.getCapabilities());
  
  return db;
}

/**
 * Determine optimal loading mode based on environment
 */
function determineOptimalMode(): 'minimal' | 'hybrid' | 'full' {
  // Check connection speed
  const connection = (navigator as any).connection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'minimal';
    }
  }
  
  // Check device memory
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return 'minimal';
  }
  
  // Check if running in development
  if (process.env.NODE_ENV === 'development') {
    return 'full';
  }
  
  // Default to hybrid for optimal balance
  return 'hybrid';
}

// Export main API
export { featureDetector };

// Auto-initialize in browser with optimal settings
if (typeof window !== 'undefined') {
  (window as any).HybridJSONIC = {
    init: initJSONIC,
    create: createJSONIC,
    featureDetector,
    
    // Feature loading
    loadFeature: async (feature: string) => {
      const hybrid = await HybridJSONIC.create();
      return hybrid.loadFeature(feature as any);
    },
    
    // Feature detection
    hasFeature: (feature: string) => featureDetector.hasFeature(feature),
    hasCapability: (capability: string) => featureDetector.hasCapability(capability as any),
    getLoadedFeatures: () => featureDetector.getAllFeatures().filter(f => f.loaded).map(f => f.name),
    
    // Stats and debugging
    getStats: async () => {
      const hybrid = await HybridJSONIC.create();
      return hybrid.getStats();
    }
  };
}