// JSONIC v3.3 Collection-based API
interface JsonicCollection {
  insertOne(doc: any): Promise<{ _id: string }>;
  insertMany(docs: any[]): Promise<{ insertedIds: string[] }>;
  findOne(filter: any): Promise<any>;
  find(filter: any, options?: FindOptions): Promise<any[]>;
  updateOne(filter: any, update: any): Promise<UpdateResult>;
  updateMany(filter: any, update: any): Promise<UpdateResult>;
  deleteOne(filter: any): Promise<DeleteResult>;
  deleteMany(filter: any): Promise<DeleteResult>;
  aggregate(pipeline: any[]): Promise<any[]>;
  count(filter?: any): Promise<number>;
}

interface JsonicDatabase {
  collection(name: string): JsonicCollection;
  export(): Promise<any>;
  exportToFile(filename: string): Promise<void>;
}

interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

interface DeleteResult {
  deletedCount: number;
}

// JSONIC v3.3 API
interface JSONIC {
  create(options?: {
    name?: string;
    version?: number;
    persistence?: boolean;
    persistenceConfig?: {
      wasmPath?: string;
      workerPath?: string;
      snapshotInterval?: number;
    };
    crossTabSync?: boolean;
    syncChannel?: string;
  }): Promise<JsonicDatabase>;
}

class JsonicService {
  private static instance: JsonicService;
  private db: JsonicDatabase | null = null;
  private collection: JsonicCollection | null = null;
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
    console.log('[JSONIC v3.3] Starting initialization...');
    console.log('[JSONIC] Environment:', {
      isDev: import.meta.env.DEV,
      baseUrl: import.meta.env.BASE_URL,
      mode: import.meta.env.MODE,
      location: typeof window !== 'undefined' ? window.location.href : 'worker',
    });

    try {
      // Try to load JSONIC v3.3 from the npm package
      // Falls back to legacy wrappers if not available
      try {
        console.log('[JSONIC] Attempting to load jsonic-db from npm package...');
        const { JSONIC: JSONICModule } = await import('jsonic-db');

        // Create database using v3.3 API
        const dbCreateStartTime = performance.now();
        this.db = await JSONICModule.create({
          name: 'agentx_benchmark',
          persistence: false, // Disabled for faster development
          crossTabSync: false
        });
        console.log(`[JSONIC] Database created in ${(performance.now() - dbCreateStartTime).toFixed(2)}ms`);

        // Get default collection for benchmarks
        this.collection = this.db.collection('benchmarks');

        console.log('[JSONIC v3.3] Initialized successfully with new API');

      } catch (npmError) {
        console.warn('[JSONIC] npm package not available, falling back to legacy wrapper:', npmError);

        // Fallback to legacy wrapper implementation
        const baseUrl = import.meta.env.BASE_URL || '/';
        const isWorker = typeof window === 'undefined' && typeof self !== 'undefined';

        let jsonicUrl: string;
        if (isWorker) {
          jsonicUrl = `${baseUrl}jsonic-worker-wrapper.js`;
        } else {
          jsonicUrl = import.meta.env.DEV
            ? `${self.location ? self.location.origin : 'http://localhost:5173'}/jsonic-hybrid/index.js`
            : `${baseUrl}jsonic-hybrid/index.js`;
        }

        console.log('[JSONIC] Loading legacy wrapper from:', jsonicUrl);

        const module = await import(/* @vite-ignore */ jsonicUrl) as { default: JSONIC };
        this.jsonicModule = module.default;

        if (!this.jsonicModule) {
          throw new Error('JSONIC module not found');
        }

        const dbCreateStartTime = performance.now();
        this.db = await this.jsonicModule.create({
          name: 'agentx_benchmark',
          persistence: false
        });
        console.log(`[JSONIC] Legacy database created in ${(performance.now() - dbCreateStartTime).toFixed(2)}ms`);

        this.collection = this.db.collection('benchmarks');
      }

      const totalInitTime = performance.now() - initStartTime;
      console.log(`[JSONIC] Total initialization time: ${totalInitTime.toFixed(2)}ms`);

      if (totalInitTime > 1000) {
        console.warn(`[JSONIC] ⚠️ Slow initialization: ${totalInitTime.toFixed(2)}ms`);
      }

    } catch (error) {
      console.error('[JSONIC] Failed to initialize:', error);
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

  async getCollection(): Promise<JsonicCollection> {
    if (!this.collection) {
      await this.initialize();
    }

    if (!this.collection) {
      throw new Error('JSONIC collection not initialized');
    }

    return this.collection;
  }

  // Legacy compatibility methods - converted to collection API
  async insert(data: any): Promise<string> {
    const coll = await this.getCollection();
    const result = await coll.insertOne(data);
    return result._id;
  }

  async get(id: string): Promise<any> {
    const coll = await this.getCollection();
    return coll.findOne({ _id: id });
  }

  async update(id: string, data: any): Promise<void> {
    const coll = await this.getCollection();
    await coll.updateOne({ _id: id }, { $set: data });
  }

  async delete(id: string): Promise<void> {
    const coll = await this.getCollection();
    await coll.deleteOne({ _id: id });
  }

  async listIds(): Promise<string[]> {
    const coll = await this.getCollection();
    const docs = await coll.find({}, { projection: { _id: 1 } });
    return docs.map(doc => doc._id);
  }

  async getStats(): Promise<any> {
    const coll = await this.getCollection();
    const count = await coll.count();
    return {
      documentCount: count,
      collectionName: 'benchmarks'
    };
  }

  async query(filter: (item: any) => boolean): Promise<any[]> {
    const coll = await this.getCollection();
    const docs = await coll.find({});
    return docs.filter(filter);
  }

  // Collection-based query methods (v3.3 API)
  async findDocuments(filter: any, options?: FindOptions): Promise<any[]> {
    const coll = await this.getCollection();
    return coll.find(filter, options);
  }

  async findOne(filter: any): Promise<any> {
    const coll = await this.getCollection();
    return coll.findOne(filter);
  }

  async find(filter: any = {}, options?: FindOptions): Promise<any[]> {
    const coll = await this.getCollection();
    return coll.find(filter, options);
  }

  // Batch operations (v3.3 API)
  async insertMany(documents: any[]): Promise<string[]> {
    const coll = await this.getCollection();
    const result = await coll.insertMany(documents);
    return result.insertedIds;
  }

  async updateMany(filter: any, update: any): Promise<UpdateResult> {
    const coll = await this.getCollection();
    return coll.updateMany(filter, update);
  }

  async deleteMany(filter: any): Promise<DeleteResult> {
    const coll = await this.getCollection();
    return coll.deleteMany(filter);
  }

  // Aggregation pipeline (v3.3 API)
  async aggregate(pipeline: any[]): Promise<any[]> {
    const coll = await this.getCollection();
    return coll.aggregate(pipeline);
  }

  // Count documents
  async count(filter: any = {}): Promise<number> {
    const coll = await this.getCollection();
    return coll.count(filter);
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