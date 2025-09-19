import * as Comlink from 'comlink';
import { createDbWorker, WorkerHttpvfs } from 'sql.js-httpvfs';
import { DATABASE_CONFIG } from './database-config';

let dbWorker: WorkerHttpvfs | null = null;

const sqliteWorker = {
  async init(dbUrl: string) {
    if (dbWorker) return;
    
    const workerUrl = new URL(
      'sql.js-httpvfs/dist/sqlite.worker.js',
      import.meta.url
    );
    const wasmUrl = new URL(
      'sql.js-httpvfs/dist/sql-wasm.wasm', 
      import.meta.url
    );

    // Use a hybrid approach: try to configure with the known file size
    // This format should work better with sql.js-httpvfs
    const configs = [
      {
        from: 'inline',
        config: {
          serverMode: 'chunked',
          url: dbUrl,
          requestChunkSize: DATABASE_CONFIG.chunkSize,
        }
      }
    ];

    // Create the worker with proper configuration for compressed files
    dbWorker = await createDbWorker(
      configs,
      workerUrl.toString(),
      wasmUrl.toString(),
      {
        maxBytesToRead: 10 * 1024 * 1024, // 10MB max
        // Pass the database length in the main config
        serverConfigs: {
          [dbUrl]: {
            databaseLengthBytes: DATABASE_CONFIG.fileSize,
            requestChunkSize: DATABASE_CONFIG.chunkSize
          }
        }
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
      await dbWorker.worker.terminate();
      dbWorker = null;
    }
  }
};

Comlink.expose(sqliteWorker);