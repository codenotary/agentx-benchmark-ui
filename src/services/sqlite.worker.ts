import * as Comlink from 'comlink';
import { createDbWorker, WorkerHttpvfs } from 'sql.js-httpvfs';

let dbWorker: WorkerHttpvfs | null = null;

const sqliteWorker = {
  async init(dbUrl: string) {
    if (dbWorker) return;
    
    // First fetch the metadata to get the file size
    const metadataUrl = dbUrl + '.json';
    let fileSize = 491520; // Default fallback size
    
    try {
      const metadataResponse = await fetch(metadataUrl);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        fileSize = metadata.filesize;
        console.log('Database metadata loaded, size:', fileSize);
      }
    } catch (e) {
      console.warn('Could not load database metadata, using default size');
    }
    
    const workerUrl = new URL(
      'sql.js-httpvfs/dist/sqlite.worker.js',
      import.meta.url
    );
    const wasmUrl = new URL(
      'sql.js-httpvfs/dist/sql-wasm.wasm', 
      import.meta.url
    );

    dbWorker = await createDbWorker(
      [
        {
          from: 'inline',
          config: {
            serverMode: 'full',
            url: dbUrl,
            requestChunkSize: 4096,
            fileId: 'benchmark-db',
            totalBytes: fileSize, // Provide the file size explicitly
          }
        }
      ],
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
      await dbWorker.worker.terminate();
      dbWorker = null;
    }
  }
};

Comlink.expose(sqliteWorker);