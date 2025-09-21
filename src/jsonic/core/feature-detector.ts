/**
 * Feature Detection API for JSONIC
 * 
 * Provides runtime feature detection, capability checking,
 * and progressive enhancement support.
 */

export interface FeatureInfo {
  name: string;
  version: string;
  loaded: boolean;
  size?: number;
  dependencies?: string[];
  capabilities?: string[];
}

export interface FeatureCapabilities {
  sql: boolean;
  mongodb: boolean;
  graphql: boolean;
  ai: boolean;
  vectorSearch: boolean;
  sync: boolean;
  reactive: boolean;
  debug: boolean;
  encryption: boolean;
  compression: boolean;
  streaming: boolean;
  offline: boolean;
  realtime: boolean;
  transactions: boolean;
  indexes: boolean;
}

export class FeatureDetector {
  private features = new Map<string, any>();
  private capabilities: Partial<FeatureCapabilities> = {};
  private featureInfo = new Map<string, FeatureInfo>();
  private observers = new Map<string, Set<(feature: any) => void>>();

  constructor() {
    this.detectEnvironmentCapabilities();
  }

  /**
   * Detect environment capabilities
   */
  private detectEnvironmentCapabilities() {
    // Check browser capabilities
    this.capabilities.offline = 'serviceWorker' in navigator;
    this.capabilities.streaming = typeof ReadableStream !== 'undefined';
    this.capabilities.compression = typeof CompressionStream !== 'undefined';
    
    // Check WebAssembly support
    const hasWASM = typeof WebAssembly !== 'undefined';
    const hasThreads = typeof SharedArrayBuffer !== 'undefined';
    
    // Check storage capabilities
    const hasIndexedDB = typeof indexedDB !== 'undefined';
    
    // Update capabilities based on detection
    if (!hasWASM) {
      console.warn('WebAssembly not supported - using fallback mode');
    }
    
    if (!hasThreads) {
      console.warn('SharedArrayBuffer not available - parallel processing disabled');
    }
    
    if (!hasIndexedDB) {
      console.warn('IndexedDB not available - persistence disabled');
    }
    
    // Check SIMD support
    if (hasWASM && this.checkSIMDSupport()) {
      console.log('SIMD support detected');
    }
  }

  /**
   * Check SIMD support
   */
  private checkSIMDSupport(): boolean {
    try {
      // Try to validate a simple SIMD instruction
      const bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // WASM magic
        0x01, 0x00, 0x00, 0x00, // version
        0x01, 0x05, 0x01, 0x60, // type section
        0x00, 0x01, 0x7b,       // v128 type
      ]);
      return WebAssembly.validate(bytes);
    } catch {
      return false;
    }
  }

  /**
   * Register a loaded feature
   */
  registerFeature(name: string, module: any, info?: Partial<FeatureInfo>) {
    this.features.set(name, module);
    
    // Update feature info
    this.featureInfo.set(name, {
      name,
      version: module.version || '1.0.0',
      loaded: true,
      size: info?.size,
      dependencies: info?.dependencies || [],
      capabilities: info?.capabilities || this.detectFeatureCapabilities(name, module),
    });
    
    // Update capabilities
    this.updateCapabilities(name, module);
    
    // Notify observers
    const observers = this.observers.get(name);
    if (observers) {
      observers.forEach(callback => callback(module));
    }
  }

  /**
   * Unregister a feature
   */
  unregisterFeature(name: string) {
    this.features.delete(name);
    
    const info = this.featureInfo.get(name);
    if (info) {
      info.loaded = false;
      this.featureInfo.set(name, info);
    }
    
    // Update capabilities
    this.updateCapabilities(name, null);
  }

  /**
   * Get a loaded feature
   */
  getFeature(name: string): any {
    return this.features.get(name);
  }

  /**
   * Check if a feature is loaded
   */
  hasFeature(name: string): boolean {
    return this.features.has(name);
  }

  /**
   * Wait for a feature to be loaded
   */
  waitForFeature(name: string): Promise<any> {
    if (this.hasFeature(name)) {
      return Promise.resolve(this.getFeature(name));
    }
    
    return new Promise((resolve) => {
      if (!this.observers.has(name)) {
        this.observers.set(name, new Set());
      }
      
      this.observers.get(name)!.add((feature) => {
        resolve(feature);
      });
    });
  }

  /**
   * Get feature information
   */
  getFeatureInfo(name: string): FeatureInfo | undefined {
    return this.featureInfo.get(name);
  }

  /**
   * Get all features information
   */
  getAllFeatures(): FeatureInfo[] {
    return Array.from(this.featureInfo.values());
  }

  /**
   * Get current capabilities
   */
  getCapabilities(): Partial<FeatureCapabilities> {
    return { ...this.capabilities };
  }

  /**
   * Check if a capability is available
   */
  hasCapability(capability: keyof FeatureCapabilities): boolean {
    return this.capabilities[capability] === true;
  }

  /**
   * Check multiple capabilities
   */
  hasCapabilities(...capabilities: (keyof FeatureCapabilities)[]): boolean {
    return capabilities.every(cap => this.hasCapability(cap));
  }

  /**
   * Get missing capabilities for a feature set
   */
  getMissingCapabilities(required: (keyof FeatureCapabilities)[]): string[] {
    return required.filter(cap => !this.hasCapability(cap));
  }

  /**
   * Detect feature capabilities
   */
  private detectFeatureCapabilities(_name: string, module: any): string[] {
    const capabilities: string[] = [];
    
    // Check for common interfaces
    if (module.execute || module.query) capabilities.push('query');
    if (module.insert || module.create) capabilities.push('write');
    if (module.update || module.modify) capabilities.push('update');
    if (module.delete || module.remove) capabilities.push('delete');
    if (module.subscribe || module.watch) capabilities.push('reactive');
    if (module.sync || module.replicate) capabilities.push('sync');
    if (module.transaction || module.batch) capabilities.push('transaction');
    if (module.index || module.createIndex) capabilities.push('index');
    
    return capabilities;
  }

  /**
   * Update capabilities based on loaded features
   */
  private updateCapabilities(name: string, module: any | null) {
    switch (name) {
      case 'sql':
        this.capabilities.sql = module !== null;
        break;
      case 'ai':
        this.capabilities.ai = module !== null;
        this.capabilities.vectorSearch = module !== null;
        break;
      case 'sync':
        this.capabilities.sync = module !== null;
        this.capabilities.realtime = module !== null;
        break;
      case 'graphql':
        this.capabilities.graphql = module !== null;
        break;
      case 'debug':
        this.capabilities.debug = module !== null;
        break;
      case 'reactive':
        this.capabilities.reactive = module !== null;
        break;
      case 'core':
        this.capabilities.mongodb = module !== null;
        this.capabilities.transactions = module !== null;
        this.capabilities.indexes = module !== null;
        break;
    }
  }

  /**
   * Get feature statistics
   */
  getStats() {
    const loaded = Array.from(this.features.keys());
    const totalSize = Array.from(this.featureInfo.values())
      .reduce((sum, info) => sum + (info.size || 0), 0);
    
    return {
      loadedCount: loaded.length,
      loadedFeatures: loaded,
      totalSize,
      capabilities: this.getCapabilities(),
      environment: {
        hasWASM: typeof WebAssembly !== 'undefined',
        hasThreads: typeof SharedArrayBuffer !== 'undefined',
        hasIndexedDB: typeof indexedDB !== 'undefined',
        hasServiceWorker: 'serviceWorker' in navigator,
        hasOPFS: 'storage' in navigator && 'getDirectory' in (navigator.storage as any),
      },
    };
  }

  /**
   * Generate feature compatibility report
   */
  generateCompatibilityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      browser: this.getBrowserInfo(),
      features: this.getAllFeatures(),
      capabilities: this.getCapabilities(),
      recommendations: this.getRecommendations(),
    };
    
    return report;
  }

  /**
   * Get browser information
   */
  private getBrowserInfo() {
    const ua = navigator.userAgent;
    const browser = {
      chrome: /Chrome/.test(ua),
      firefox: /Firefox/.test(ua),
      safari: /Safari/.test(ua) && !/Chrome/.test(ua),
      edge: /Edg/.test(ua),
      mobile: /Mobile/.test(ua),
    };
    
    return {
      userAgent: ua,
      ...browser,
      version: this.getBrowserVersion(ua),
    };
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(ua: string): string {
    const match = ua.match(/(?:Chrome|Firefox|Safari|Edg)\/(\d+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Get recommendations based on current capabilities
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.capabilities.offline) {
      recommendations.push('Enable service workers for offline support');
    }
    
    if (!this.hasCapability('sql') && this.hasCapability('mongodb')) {
      recommendations.push('Consider loading SQL module for advanced queries');
    }
    
    if (!this.hasCapability('ai')) {
      recommendations.push('AI features available for semantic search');
    }
    
    if (!this.hasCapability('sync')) {
      recommendations.push('Sync module available for real-time collaboration');
    }
    
    if (!this.hasCapability('debug') && process.env.NODE_ENV === 'development') {
      recommendations.push('Debug tools recommended for development');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const featureDetector = new FeatureDetector();

// Export convenience functions
export function hasFeature(name: string): boolean {
  return featureDetector.hasFeature(name);
}

export function hasCapability(capability: keyof FeatureCapabilities): boolean {
  return featureDetector.hasCapability(capability);
}

export function getLoadedFeatures(): string[] {
  return featureDetector.getAllFeatures()
    .filter(f => f.loaded)
    .map(f => f.name);
}

export function getFeatureStats() {
  return featureDetector.getStats();
}

export function waitForFeature(name: string): Promise<any> {
  return featureDetector.waitForFeature(name);
}