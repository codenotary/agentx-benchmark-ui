interface JsonicDatabase {
  insert(data: any): Promise<string>;
  insertMany(documents: any[], options?: any): Promise<string[]>;
  get(id: string): Promise<any>;
  update(id: string, data: any): Promise<boolean>;
  updateMany(filter: any, update: any, options?: any): Promise<UpdateResult>;
  delete(id: string): Promise<boolean>;
  deleteMany(filter: any, options?: any): Promise<DeleteResult>;
  list(): Promise<string[]>;
  stats(): Promise<any>;
  query(filter: any, options?: QueryOptions): Promise<any[]>;
  find(filter?: any): QueryChainable;
  findOne(filter?: any): Promise<any>;
  aggregate(pipeline: any[]): Promise<any[]>;
  getDebugInfo(): DebugInfo;
  clearCache(): void;
  clearProfiler(): void;
}

interface QueryOptions {
  projection?: Record<string, boolean>;
  sort?: Array<[string, number]>;
  limit?: number;
  skip?: number;
}

interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

interface DeleteResult {
  deletedCount: number;
}

interface DebugInfo {
  cache: {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
  profiler: any;
  slowQueries: any[];
  indexes: Array<{
    field: string;
    type: string;
    entries: number;
  }>;
  memory: {
    used: number;
    limit: number;
    percentage: string;
  };
}

interface QueryChainable {
  sort(sortSpec: Record<string, number>): QueryChainable;
  limit(n: number): QueryChainable;
  skip(n: number): QueryChainable;
  project(projection: Record<string, boolean>): QueryChainable;
  exec(): Promise<any[]>;
  toArray(): Promise<any[]>;
  count(): Promise<number>;
}

interface JSONIC {
  createDatabase(options?: { 
    enablePersistence?: boolean; 
    persistenceKey?: string;
    cacheSize?: number;
    enableQueryCache?: boolean;
    enableBatchOptimization?: boolean;
    memoryLimit?: number;
    indexHints?: Record<string, string>;
    debug?: boolean;
  }): Promise<JsonicDatabase>;
  configure(options: { 
    wasmUrl?: string; 
    debug?: boolean;
    enablePersistence?: boolean;
    persistenceKey?: string;
    cacheSize?: number;
    enableQueryCache?: boolean;
    enableBatchOptimization?: boolean;
    memoryLimit?: number;
    indexHints?: Record<string, string>;
  }): void;
  version: string;
}

class JsonicService {
  private static instance: JsonicService;
  private db: JsonicDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private jsonicModule: JSONIC | null = null;
  
  private constructor() {}
  
  static getInstance(): JsonicService {
    if (!JsonicService.instance) {
      JsonicService.instance = new JsonicService();
    }
    return JsonicService.instance;
  }
  
  async initialize(): Promise<void> {
    if (this.db) return;
    
    if (!this.initPromise) {
      this.initPromise = this.performInitialization();
    }
    
    return this.initPromise;
  }
  
  private async performInitialization(): Promise<void> {
    const initStartTime = performance.now();
    console.log('[JSONIC] Starting initialization...');
    
    try {
      // Build the correct URL for the ES module wrapper
      const baseUrl = import.meta.env.BASE_URL || '/';
      
      // Check if we're in a Web Worker (no window object)
      const isWorker = typeof window === 'undefined' && typeof self !== 'undefined';
      
      // Check for wrapper mode via URL param or env var
      const urlParams = new URLSearchParams(window.location.search);
      const wrapperMode = urlParams.get('wrapper') || 
                         import.meta.env.VITE_JSONIC_WRAPPER || 
                         'hybrid'; // Default to hybrid
      
      // Select wrapper based on mode
      let jsonicUrl: string;
      if (isWorker) {
        // In worker, use worker-safe wrapper
        jsonicUrl = `${baseUrl}jsonic-worker-wrapper.js`;
      } else if (wrapperMode === 'lightweight' || wrapperMode === 'v1') {
        // Use original lightweight wrapper for comparison
        console.log('[JSONIC] Using LIGHTWEIGHT v1 wrapper for faster init');
        jsonicUrl = import.meta.env.DEV 
          ? `${window.location.origin}/jsonic-wrapper.esm.js`
          : `${baseUrl}jsonic-wrapper.esm.js`;
      } else if (wrapperMode === 'v3') {
        // Use full v3.1 wrapper with all features loaded
        console.log('[JSONIC] Using FULL v3.1 wrapper with all features');
        jsonicUrl = import.meta.env.DEV 
          ? `${window.location.origin}/jsonic-wrapper-v3.esm.js`
          : `${baseUrl}jsonic-wrapper-v3.esm.js`;
      } else {
        // Use new HYBRID wrapper - fast init with progressive loading
        console.log('[JSONIC] Using HYBRID wrapper (v4) - fast init + progressive features');
        jsonicUrl = import.meta.env.DEV 
          ? `${window.location.origin}/jsonic-hybrid/index.js`
          : `${baseUrl}jsonic-hybrid/index.js`;
      }
      
      console.log('[JSONIC] Loading wrapper from:', jsonicUrl);
      
      // Dynamically import the ES module
      const moduleStartTime = performance.now();
      const module = await import(/* @vite-ignore */ jsonicUrl) as { default: JSONIC };
      this.jsonicModule = module.default;
      console.log(`[JSONIC] Module loaded in ${(performance.now() - moduleStartTime).toFixed(2)}ms`);
      
      if (!this.jsonicModule) {
        throw new Error('JSONIC module not found');
      }
      
      // Configure JSONIC with correct paths for both dev and production (GitHub Pages)
      let wasmUrl: string;
      if (isWorker) {
        // In worker, always use the GitHub Pages path
        wasmUrl = '/agentx-benchmark-ui/jsonic_wasm_bg.wasm';
      } else {
        // In main thread, check the current path
        wasmUrl = window.location.pathname.startsWith('/agentx-benchmark-ui/') 
          ? '/agentx-benchmark-ui/jsonic_wasm_bg.wasm'
          : `${baseUrl}jsonic_wasm_bg.wasm`;
      }
        
      // Configure based on wrapper mode
      const configStartTime = performance.now();
      const config: any = {
        wasmUrl,
        debug: true, // Enable debug mode to see what's happening
        enablePersistence: false, // Disabled to avoid reloading on every refresh
        persistenceKey: 'agentx_benchmark_db'
      };
      
      // Add v3/hybrid specific configs
      if (wrapperMode === 'v3' || wrapperMode === 'hybrid') {
        config.cacheSize = 100; // LRU cache for query results
        config.enableQueryCache = true;
        config.enableBatchOptimization = true;
        config.memoryLimit = 100 * 1024 * 1024; // 100MB limit
        config.indexHints = {
          // Add index hints for frequently queried fields
          'testId': 'hash',
          'timestamp': 'btree',
          'status': 'hash',
          'agentId': 'hash',
          'type': 'hash'
        };
        
        // Hybrid-specific: preload commonly used features
        if (wrapperMode === 'hybrid') {
          config.preloadFeatures = ['cache', 'batch']; // Preload in background after init
        }
      }
      
      this.jsonicModule.configure(config);
      console.log(`[JSONIC] Configuration completed in ${(performance.now() - configStartTime).toFixed(2)}ms`);
      
      console.log('JSONIC version:', this.jsonicModule.version);
      console.log('WASM URL:', wasmUrl);
      console.log('Features: Query caching, Batch operations, Index optimization, OPFS persistence');
      
      const dbCreateStartTime = performance.now();
      this.db = await this.jsonicModule.createDatabase({
        enablePersistence: false, // Disabled to avoid reloading on every refresh
        persistenceKey: 'agentx_benchmark_db',
        cacheSize: 100,
        enableQueryCache: true,
        enableBatchOptimization: true,
        memoryLimit: 100 * 1024 * 1024,
        indexHints: {
          'testId': 'hash',
          'timestamp': 'btree',
          'status': 'hash',
          'agentId': 'hash',
          'type': 'hash'
        },
        debug: true // Enable debug mode
      });
      console.log(`[JSONIC] Database created in ${(performance.now() - dbCreateStartTime).toFixed(2)}ms`);
      console.log('JSONIC v3.1 database initialized with performance optimizations');
      
      const statsStartTime = performance.now();
      const stats = await this.db.stats();
      console.log(`[JSONIC] Stats retrieved in ${(performance.now() - statsStartTime).toFixed(2)}ms`);
      console.log('JSONIC stats:', stats);
      
      const totalInitTime = performance.now() - initStartTime;
      console.log(`[JSONIC] Total initialization time: ${totalInitTime.toFixed(2)}ms`);
      
      // Log warning if initialization is slow
      if (totalInitTime > 1000) {
        console.warn(`[JSONIC] ⚠️ Slow initialization detected: ${totalInitTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Failed to initialize JSONIC:', error);
      console.error(`[JSONIC] Failed after ${(performance.now() - initStartTime).toFixed(2)}ms`);
      throw error;
    }
  }
  
  async getDatabase(): Promise<JsonicDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db) {
      throw new Error('JSONIC database not initialized');
    }
    
    return this.db;
  }
  
  async insert(data: any): Promise<string> {
    const db = await this.getDatabase();
    return db.insert(data);
  }
  
  async get(id: string): Promise<any> {
    const db = await this.getDatabase();
    return db.get(id);
  }
  
  async update(id: string, data: any): Promise<void> {
    const db = await this.getDatabase();
    const result = await db.update(id, data);
    if (!result) {
      throw new Error('Failed to update document');
    }
  }
  
  async delete(id: string): Promise<void> {
    const db = await this.getDatabase();
    const result = await db.delete(id);
    if (!result) {
      throw new Error('Failed to delete document');
    }
  }
  
  async listIds(): Promise<string[]> {
    const db = await this.getDatabase();
    return db.list();
  }
  
  async getStats(): Promise<any> {
    const db = await this.getDatabase();
    return db.stats();
  }
  
  async query(filter: (item: any) => boolean): Promise<any[]> {
    const db = await this.getDatabase();
    const ids = await db.list();
    const results: any[] = [];
    
    for (const id of ids) {
      const doc = await db.get(id);
      if (doc && doc.content) {
        // The actual data is in doc.content
        if (filter(doc.content)) {
          results.push({ id, ...doc.content });
        }
      }
    }
    
    return results;
  }

  // New MongoDB-like query methods
  async findDocuments(filter: any, options?: QueryOptions): Promise<any[]> {
    const db = await this.getDatabase();
    return db.query(filter, options);
  }

  async findOne(filter: any): Promise<any> {
    const db = await this.getDatabase();
    return db.findOne(filter);
  }

  find(filter: any = {}): QueryChainable {
    // Return a promise that resolves to a chainable query
    const dbPromise = this.getDatabase();
    
    const chainable = {
      sort: function(_sortSpec: Record<string, number>) {
        return this;
      },
      limit: function(_n: number) {
        return this;
      },
      skip: function(_n: number) {
        return this;
      },
      project: function(_projection: Record<string, boolean>) {
        return this;
      },
      exec: async function() {
        const db = await dbPromise;
        return db.find(filter).exec();
      },
      toArray: async function() {
        const db = await dbPromise;
        return db.find(filter).toArray();
      },
      count: async function() {
        const db = await dbPromise;
        return db.find(filter).count();
      }
    } as QueryChainable;

    // Make chainable methods actually chain properly
    let queryOptions: QueryOptions = {};
    
    chainable.sort = (sortSpec: Record<string, number>) => {
      queryOptions.sort = Object.entries(sortSpec).map(([k, v]) => [k, v]);
      return chainable;
    };
    
    chainable.limit = (n: number) => {
      queryOptions.limit = n;
      return chainable;
    };
    
    chainable.skip = (n: number) => {
      queryOptions.skip = n;
      return chainable;
    };
    
    chainable.project = (projection: Record<string, boolean>) => {
      queryOptions.projection = projection;
      return chainable;
    };
    
    chainable.exec = async () => {
      const db = await dbPromise;
      return db.query(filter, queryOptions);
    };
    
    chainable.toArray = async () => {
      const db = await dbPromise;
      return db.query(filter, queryOptions);
    };
    
    chainable.count = async () => {
      const db = await dbPromise;
      return db.find(filter).count();
    };
    
    return chainable;
  }

  // Batch operations for v3.1 performance
  async insertMany(documents: any[]): Promise<string[]> {
    const db = await this.getDatabase();
    return db.insertMany(documents);
  }

  async updateMany(filter: any, update: any): Promise<UpdateResult> {
    const db = await this.getDatabase();
    return db.updateMany(filter, update);
  }

  async deleteMany(filter: any): Promise<DeleteResult> {
    const db = await this.getDatabase();
    return db.deleteMany(filter);
  }

  // Aggregation pipeline for analytics
  async aggregate(pipeline: any[]): Promise<any[]> {
    const db = await this.getDatabase();
    return db.aggregate(pipeline);
  }

  // Debug and performance monitoring
  async getDebugInfo(): Promise<DebugInfo> {
    const db = await this.getDatabase();
    return db.getDebugInfo();
  }

  async clearCache(): Promise<void> {
    const db = await this.getDatabase();
    db.clearCache();
  }

  async clearProfiler(): Promise<void> {
    const db = await this.getDatabase();
    db.clearProfiler();
  }

  // Helper method for benchmark statistics using aggregation
  async getBenchmarkStats(testId?: string): Promise<any> {
    const pipeline: any[] = [];
    
    if (testId) {
      pipeline.push({ $match: { testId } });
    }
    
    pipeline.push(
      {
        $group: {
          _id: '$testId',
          avgDuration: { $avg: '$duration' },
          minDuration: { $min: '$duration' },
          maxDuration: { $max: '$duration' },
          totalRuns: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failureCount: { $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] } }
        }
      },
      {
        $sort: { totalRuns: -1 }
      }
    );
    
    return this.aggregate(pipeline);
  }
}

export const jsonicService = JsonicService.getInstance();