import * as Comlink from 'comlink';

let db: any = null;
let SQL: any = null;

const sqliteWorker = {
  async init(baseUrl: string) {
    if (db) {
      console.log('[Worker] Database already initialized');
      return true;
    }
    
    console.log('[Worker] Initializing with baseUrl:', baseUrl);
    
    try {
      // Load SQL.js from CDN as a fallback
      console.log('[Worker] Loading SQL.js...');
      
      // Import sql.js dynamically
      const initSqlJs = (await import('sql.js')).default;
      
      SQL = await initSqlJs({
        locateFile: (file: string) => {
          return `https://sql.js.org/dist/${file}`;
        }
      });
      
      console.log('[Worker] SQL.js loaded successfully');

      const dbUrl = `${baseUrl}benchmark.db`;
      
      console.log('[Worker] Fetching database from:', dbUrl);
      
      // Download the database file
      const response = await fetch(dbUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
      }
      
      console.log('[Worker] Database response received, reading data...');
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      console.log('[Worker] Database size:', data.length, 'bytes');
      
      // Open the database directly from the downloaded data
      db = new SQL.Database(data);
      
      // Test the database with a simple query
      const testResult = db.exec("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
      console.log('[Worker] Database tables count:', testResult[0]?.values[0][0]);
      
      console.log('[Worker] Database loaded successfully');
      
      return true;
    } catch (error) {
      console.error('[Worker] Failed to initialize database:', error);
      throw error;
    }
  },

  async query(sql: string, params: any[] = []) {
    if (!db) {
      console.error('[Worker] Database not initialized');
      throw new Error('Database not initialized');
    }
    
    try {
      console.log('[Worker] Executing query:', sql.substring(0, 100) + '...');
      const stmt = db.prepare(sql);
      const results = [];
      
      // Bind parameters if provided
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      // Fetch all rows
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }
      
      stmt.free();
      console.log('[Worker] Query returned', results.length, 'rows');
      return results;
    } catch (error) {
      console.error('[Worker] Query failed:', sql, error);
      throw error;
    }
  },

  async close() {
    if (db) {
      db.close();
      db = null;
    }
    SQL = null;
  }
};

Comlink.expose(sqliteWorker);