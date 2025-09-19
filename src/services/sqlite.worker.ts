import * as Comlink from 'comlink';
import { createDbWorker, WorkerHttpvfs } from 'sql.js-httpvfs';
import { DATABASE_CONFIG } from './database-config';

let dbWorker: WorkerHttpvfs | null = null;

const sqliteWorker = {
  async init(baseUrl: string) {
    if (dbWorker) return;
    
    const workerUrl = new URL(
      'sql.js-httpvfs/dist/sqlite.worker.js',
      import.meta.url
    );
    const wasmUrl = new URL(
      'sql.js-httpvfs/dist/sql-wasm.wasm', 
      import.meta.url
    );

    // Construct the database URL
    const dbUrl = `${baseUrl}benchmark.db`;
    console.log('SQLite Worker - Database URL:', dbUrl);
    console.log('SQLite Worker - Database size:', DATABASE_CONFIG.fileSize);

    // Use inline configuration with explicit database size
    const configs = [{
      from: 'inline',
      config: {
        serverMode: 'chunked' as const,
        url: dbUrl,
        requestChunkSize: DATABASE_CONFIG.chunkSize,
        databaseLengthBytes: DATABASE_CONFIG.fileSize
      }
    }];

    dbWorker = await createDbWorker(
      configs,
      workerUrl.toString(),
      wasmUrl.toString(),
      {
        maxBytesToRead: 10 * 1024 * 1024 // 10MB max
      }
    );
    
    return true;
  },

  async query(sql: string, params: any[] = []) {
    if (!dbWorker) {
      throw new Error('Database not initialized');
    }
    
    const result = await dbWorker.db.exec(sql, params);
    
    // Transform result to a more convenient format
    if (result.length > 0) {
      const { columns, values } = result[0];
      return values.map(row => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }
    
    return [];
  },

  async close() {
    if (dbWorker) {
      dbWorker.worker.terminate(); // Use terminate directly
      dbWorker = null;
    }
  }
};

Comlink.expose(sqliteWorker);