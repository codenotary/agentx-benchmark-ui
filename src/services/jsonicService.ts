interface JsonicDatabase {
  insert(data: any): Promise<string>;
  get(id: string): Promise<any>;
  update(id: string, data: any): Promise<void>;
  delete(id: string): Promise<void>;
  list_ids(): Promise<string[]>;
  stats(): Promise<any>;
}

interface JSONIC {
  createDatabase(): Promise<JsonicDatabase>;
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
  
  private async loadJsonicScript(): Promise<void> {
    if (window.JSONIC) {
      return;
    }
    
    if (document.querySelector('script[src*="jsonic.min.js"]')) {
      const maxAttempts = 100;
      let attempts = 0;
      
      while (attempts < maxAttempts && !window.JSONIC) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.JSONIC) {
        throw new Error('JSONIC failed to load after 10 seconds');
      }
      return;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = import.meta.env.BASE_URL + 'jsonic.min.js';
      script.async = true;
      
      script.onload = () => {
        let checkAttempts = 0;
        const checkInterval = setInterval(() => {
          if (window.JSONIC) {
            clearInterval(checkInterval);
            resolve();
          } else if (++checkAttempts > 50) {
            clearInterval(checkInterval);
            reject(new Error('JSONIC object not available after script load'));
          }
        }, 100);
      };
      
      script.onerror = () => reject(new Error('Failed to load JSONIC script'));
      
      document.head.appendChild(script);
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
      await this.loadJsonicScript();
      
      if (!window.JSONIC) {
        throw new Error('JSONIC not available after loading');
      }
      
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
    return db.list_ids();
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