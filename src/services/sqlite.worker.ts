import * as Comlink from 'comlink';
import { createDbWorker, WorkerHttpvfs } from 'sql.js-httpvfs';

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

    // The URL for the configuration file
    const configUrl = `${baseUrl}benchmark.db.json`;

    const configs = [{
      from: 'jsonconfig',
      config: {
        url: configUrl
      }
    }];

    dbWorker = await createDbWorker(
      configs,
      workerUrl.toString(),
      wasmUrl.toString()
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