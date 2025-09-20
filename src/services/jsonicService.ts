interface JsonicDatabase {
  insert(data: any): Promise<string>;
  get(id: string): Promise<any>;
  update(id: string, data: any): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  list(): Promise<string[]>;
  stats(): Promise<any>;
}

interface JSONIC {
  createDatabase(): Promise<JsonicDatabase>;
  configure(options: { wasmUrl?: string; debug?: boolean }): void;
  version: string;
}

declare global {
  interface Window {
    JSONIC?: JSONIC;
    JSONIC_READY?: Promise<JSONIC>;
  }
}

class JsonicService {
  private static instance: JsonicService;
  private db: JsonicDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  static getInstance(): JsonicService {
    if (!JsonicService.instance) {
      JsonicService.instance = new JsonicService();
    }
    return JsonicService.instance;
  }
  
  private async loadJsonic(): Promise<void> {
    if (window.JSONIC) {
      return;
    }

    // Check if already loading via JSONIC_READY promise
    if (window.JSONIC_READY) {
      await window.JSONIC_READY;
      return;
    }
    
    // Check if script is already loaded
    if (document.querySelector('script[src*="jsonic.esm.js"]')) {
      // Wait for JSONIC_READY event
      await new Promise<void>((resolve) => {
        window.addEventListener('jsonic-ready', () => resolve(), { once: true });
        // Timeout after 10 seconds
        setTimeout(() => resolve(), 10000);
      });
      
      if (!window.JSONIC) {
        throw new Error('JSONIC failed to load');
      }
      return;
    }
    
    // Load the ES module version
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = import.meta.env.BASE_URL + 'jsonic.esm.js';
      
      // Set up event listener for jsonic-ready event
      const onReady = () => {
        window.removeEventListener('jsonic-ready', onReady);
        resolve();
      };
      
      window.addEventListener('jsonic-ready', onReady);
      
      script.onerror = () => {
        window.removeEventListener('jsonic-ready', onReady);
        reject(new Error('Failed to load JSONIC script'));
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!window.JSONIC) {
          window.removeEventListener('jsonic-ready', onReady);
          reject(new Error('JSONIC load timeout'));
        }
      }, 10000);
    });
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
      await this.loadJsonic();
      
      if (!window.JSONIC) {
        throw new Error('JSONIC not available after loading');
      }
      
      // Configure JSONIC to use the correct WASM path
      window.JSONIC.configure({
        wasmUrl: import.meta.env.BASE_URL + 'jsonic_wasm_bg.wasm',
        debug: import.meta.env.DEV
      });
      
      console.log('JSONIC version:', window.JSONIC.version);
      
      this.db = await window.JSONIC.createDatabase();
      console.log('JSONIC database initialized successfully');
      
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
    return db.update(id, data);
  }
  
  async delete(id: string): Promise<void> {
    const db = await this.getDatabase();
    return db.delete(id);
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
    const ids = await db.list_ids();
    const results: any[] = [];
    
    for (const id of ids) {
      const item = await db.get(id);
      if (filter(item)) {
        results.push({ id, ...item });
      }
    }
    
    return results;
  }
}

export const jsonicService = JsonicService.getInstance();