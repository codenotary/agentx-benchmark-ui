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

// Create metadata file
const metadata = {
  filename: 'benchmark.db',
  filesize: fileSize,
  chunkSize: chunkSize,
  totalChunks: Math.ceil(fileSize / chunkSize),
  lastModified: new Date().toISOString()
};

// Write metadata
fs.writeFileSync(
  path.join(outputDir, 'benchmark.db.json'),
  JSON.stringify(metadata, null, 2)
);

console.log(`Database size: ${fileSize} bytes`);
console.log(`Chunk size: ${chunkSize} bytes`);
console.log(`Total chunks: ${metadata.totalChunks}`);
console.log(`Metadata written to benchmark.db.json`);