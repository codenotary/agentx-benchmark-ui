import * as Comlink from 'comlink';
import { createDbWorker, WorkerHttpvfs } from 'sql.js-httpvfs';

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

    // Configure with explicit file size to handle GitHub Pages compression
    const dbConfig = {
      from: 'inline',
      config: {
        serverMode: 'full',
        url: dbUrl,
        requestChunkSize: 4096,
        // The actual uncompressed size of benchmark.db
        fileId: 1,
        databaseLengthBytes: 491520,
      }
    };

    dbWorker = await createDbWorker(
      [dbConfig],
      workerUrl.toString(),
      wasmUrl.toString(),
      {
        // Additional options to handle the compressed responses
        maxBytesToRead: 10 * 1024 * 1024, // 10MB max
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