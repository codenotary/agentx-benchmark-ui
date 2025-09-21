#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the source JSON data
const sourceFile = path.join(__dirname, '../public/data/database.json');
const outputFile = path.join(__dirname, '../public/data/database.jsonic');

console.log('Building optimized JSONIC database...');

// Read source data
const jsonData = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));

// Create optimized database structure
const database = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  metadata: {
    totalDocuments: 0,
    collections: {
      benchmark_runs: 0,
      model_performance: 0,
      test_results: 0,
      performance_trends: 0
    }
  },
  documents: []
};

// Helper to create document with metadata
function createDocument(type, data, runId) {
  return {
    _type: type,
    _runId: runId,
    _timestamp: data.timestamp || new Date().toISOString(),
    ...data
  };
}

// Process benchmark runs
if (jsonData.benchmark_runs) {
  jsonData.benchmark_runs.forEach(run => {
    database.documents.push(createDocument('benchmark_run', run));
    database.metadata.collections.benchmark_runs++;
  });
}

// Process model performance
if (jsonData.model_performance) {
  jsonData.model_performance.forEach(perf => {
    database.documents.push(createDocument('model_performance', perf, perf.run_id));
    database.metadata.collections.model_performance++;
  });
}

// Process test results
if (jsonData.test_results) {
  jsonData.test_results.forEach(test => {
    database.documents.push(createDocument('test_result', test, test.run_id));
    database.metadata.collections.test_results++;
  });
}

// Process performance trends
if (jsonData.performance_trends) {
  jsonData.performance_trends.forEach(trend => {
    database.documents.push(createDocument('performance_trend', trend));
    database.metadata.collections.performance_trends++;
  });
}

// Update total count
database.metadata.totalDocuments = database.documents.length;

// Create indexes for faster lookups
database.indexes = {
  byType: {},
  byRunId: {}
};

database.documents.forEach((doc, index) => {
  // Index by type
  if (!database.indexes.byType[doc._type]) {
    database.indexes.byType[doc._type] = [];
  }
  database.indexes.byType[doc._type].push(index);
  
  // Index by run ID
  if (doc._runId) {
    if (!database.indexes.byRunId[doc._runId]) {
      database.indexes.byRunId[doc._runId] = [];
    }
    database.indexes.byRunId[doc._runId].push(index);
  }
});

// Write optimized database
fs.writeFileSync(outputFile, JSON.stringify(database));

// Also create a compressed version
const compressedFile = path.join(__dirname, '../public/data/database.jsonic.gz');
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipe = promisify(pipeline);

async function compress() {
  const gzip = createGzip({ level: 9 });
  const source = fs.createReadStream(outputFile);
  const destination = fs.createWriteStream(compressedFile);
  
  await pipe(source, gzip, destination);
  
  const stats = fs.statSync(outputFile);
  const compressedStats = fs.statSync(compressedFile);
  
  console.log(`
✅ Database built successfully!

Original JSON: ${(fs.statSync(sourceFile).size / 1024).toFixed(1)} KB
Optimized JSONIC: ${(stats.size / 1024).toFixed(1)} KB
Compressed: ${(compressedStats.size / 1024).toFixed(1)} KB

Documents: ${database.metadata.totalDocuments}
- Benchmark Runs: ${database.metadata.collections.benchmark_runs}
- Model Performance: ${database.metadata.collections.model_performance}
- Test Results: ${database.metadata.collections.test_results}
- Performance Trends: ${database.metadata.collections.performance_trends}

Compression Ratio: ${((1 - compressedStats.size / stats.size) * 100).toFixed(1)}%
`);
}

compress().catch(console.error);