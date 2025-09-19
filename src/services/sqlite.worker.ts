import * as Comlink from 'comlink';
import initSqlJs from '@jlongster/sql.js';
import { SQLiteFS } from 'absurd-sql';
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend';

let db: any = null;
let sqlFS: any = null;

const sqliteWorker = {
  async init(baseUrl: string) {
    if (db) return true;
    
    try {
      // Initialize SQL.js with the WASM file
      const SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file === 'sql-wasm.wasm') {
            // Use the sql.js wasm file from node_modules
            return new URL('@jlongster/sql.js/dist/sql-wasm.wasm', import.meta.url).href;
          }
          return file;
        }
      });

      // Initialize absurd-sql with IndexedDB backend
      sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
      SQL.register_for_idb(sqlFS);

      SQL.FS.mkdir('/sql');
      SQL.FS.mount(sqlFS, {}, '/sql');

      const dbPath = '/sql/benchmark.db';
      const dbUrl = `${baseUrl}benchmark.db`;
      
      console.log('Fetching database from:', dbUrl);
      
      // Check if database already exists by trying to read it
      let exists = false;
      try {
        const stats = SQL.FS.stat(dbPath);
        exists = stats.size > 0;
      } catch (e) {
        // File doesn't exist
        exists = false;
      }
      
      if (!exists) {
        // Download the database file
        console.log('Downloading database for first time...');
        const response = await fetch(dbUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        
        // Write to the virtual filesystem
        SQL.FS.writeFile(dbPath, data);
        console.log('Database downloaded and saved to IndexedDB');
      } else {
        console.log('Using cached database from IndexedDB');
      }
      
      // Open the database
      db = new SQL.Database(dbPath, { filename: true });
      
      // Set some pragmas for better performance
      db.exec('PRAGMA journal_mode=MEMORY');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  },

  async query(sql: string, params: any[] = []) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    try {
      const stmt = db.prepare(sql);
      const results = [];
      
      // Bind parameters if provided
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      // Get column names
      const columns = stmt.getColumnNames();
      
      // Fetch all rows
      while (stmt.step()) {
        const row = stmt.get();
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        results.push(obj);
      }
      
      stmt.free();
      return results;
    } catch (error) {
      console.error('Query failed:', sql, error);
      throw error;
    }
  },

  async close() {
    if (db) {
      db.close();
      db = null;
    }
    if (sqlFS) {
      // Note: SQLiteFS doesn't have a close method
      sqlFS = null;
    }
  }
};

Comlink.expose(sqliteWorker);