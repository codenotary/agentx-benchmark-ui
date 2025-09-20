interface JsonicDatabase {
  insert(data: any): Promise<string>;
  get(id: string): Promise<any>;
  update(id: string, data: any): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  list(): Promise<string[]>;
  stats(): Promise<any>;
  query(filter: any, options?: QueryOptions): Promise<any[]>;
  find(filter?: any): QueryChainable;
  findOne(filter?: any): Promise<any>;
}

interface QueryOptions {
  projection?: Record<string, boolean>;
  sort?: Array<[string, number]>;
  limit?: number;
  skip?: number;
}

interface QueryChainable {
  sort(sortSpec: Record<string, number>): QueryChainable;
  limit(n: number): QueryChainable;
  skip(n: number): QueryChainable;
  project(projection: Record<string, boolean>): QueryChainable;
  exec(): Promise<any[]>;
  toArray(): Promise<any[]>;
}

interface JSONIC {
  createDatabase(options?: { 
    enablePersistence?: boolean; 
    persistenceKey?: string;
  }): Promise<JsonicDatabase>;
  configure(options: { 
    wasmUrl?: string; 
    debug?: boolean;
    enablePersistence?: boolean;
    persistenceKey?: string;
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
    try {
      // Build the correct URL for the ES module wrapper
      const baseUrl = import.meta.env.BASE_URL || '/';
      
      // In development, use absolute URL. In production, use relative path
      const jsonicUrl = import.meta.env.DEV 
        ? `${window.location.origin}/jsonic-wrapper.esm.js`
        : `${baseUrl}jsonic-wrapper.esm.js`;
      
      // Dynamically import the ES module
      const module = await import(/* @vite-ignore */ jsonicUrl) as { default: JSONIC };
      this.jsonicModule = module.default;
      
      if (!this.jsonicModule) {
        throw new Error('JSONIC module not found');
      }
      
      // Configure JSONIC with correct paths for both dev and production (GitHub Pages)
      const wasmUrl = window.location.pathname.startsWith('/agentx-benchmark-ui/') 
        ? '/agentx-benchmark-ui/jsonic_wasm_bg.wasm'
        : `${baseUrl}jsonic_wasm_bg.wasm`;
        
      this.jsonicModule.configure({
        wasmUrl,
        debug: import.meta.env.DEV,
        enablePersistence: true,
        persistenceKey: 'agentx_benchmark_db'
      });
      
      console.log('JSONIC version:', this.jsonicModule.version);
      console.log('WASM URL:', wasmUrl);
      
      this.db = await this.jsonicModule.createDatabase({
        enablePersistence: true,
        persistenceKey: 'agentx_benchmark_db'
      });
      console.log('JSONIC database initialized with MongoDB-like queries and OPFS persistence');
      
      const stats = await this.db.stats();
      console.log('JSONIC stats:', stats);
    } catch (error) {
      console.error('Failed to initialize JSONIC:', error);
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
    
    return chainable;
  }
}

export const jsonicService = JsonicService.getInstance();