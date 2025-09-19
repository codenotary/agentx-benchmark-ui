#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../public/benchmark.db');
const outputDir = path.join(__dirname, '../public');
const chunkSize = 4096; // 4KB chunks for better HTTP caching

// Read the database file
const dbBuffer = fs.readFileSync(dbPath);
const fileSize = dbBuffer.length;

// Create metadata file for sql.js-httpvfs jsonconfig format
const metadata = {
  serverMode: 'chunked',
  requestChunkSize: chunkSize,
  url: 'benchmark.db', // Use a relative URL
  databaseLengthBytes: fileSize // Include the database size for GitHub Pages
};

// Write metadata
fs.writeFileSync(
  path.join(outputDir, 'benchmark.db.json'),
  JSON.stringify(metadata, null, 2)
);

// Also create a db-info.json for additional metadata
const dbInfo = [{
  total_runs: 13, // This would need to be updated from the actual database
  latest_run: new Date().toISOString(),
  model_count: 17 // This would need to be updated from the actual database
}];

fs.writeFileSync(
  path.join(outputDir, 'db-info.json'),
  JSON.stringify(dbInfo)
);

// Also write TypeScript config for the application
const tsConfig = `// This file is auto-generated during build
// DO NOT EDIT MANUALLY - it will be overwritten
export const DATABASE_CONFIG = {
  fileSize: ${fileSize},
  chunkSize: ${chunkSize},
  lastUpdated: '${new Date().toISOString()}'
};`;

fs.writeFileSync(
  path.join(__dirname, '../src/services/database-config.ts'),
  tsConfig
);

console.log(`Database size: ${fileSize} bytes`);
console.log(`Chunk size: ${chunkSize} bytes`);
console.log(`Metadata written to benchmark.db.json`);
console.log(`TypeScript config written to database-config.ts`);