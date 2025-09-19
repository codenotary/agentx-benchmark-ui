#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../public/benchmark.db');
const outputDir = path.join(__dirname, '../public/data');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Converting SQLite database to JSON...');

// Open the database
const db = new Database(dbPath, { readonly: true });

// Export each table to a separate JSON file
const tables = [
  'benchmark_runs',
  'model_performance',
  'test_results',
  'performance_trends'
];

const data = {};

for (const table of tables) {
  console.log(`Exporting table: ${table}`);
  
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    data[table] = rows;
    console.log(`  - Exported ${rows.length} rows from ${table}`);
  } catch (error) {
    console.error(`  - Error exporting ${table}:`, error.message);
    data[table] = [];
  }
}

// Also export some pre-computed views for common queries
console.log('Computing category performance...');
const categoryPerformance = db.prepare(`
  SELECT 
    category,
    provider,
    model,
    AVG(time_to_first_token_ms) as avg_ttft_ms,
    AVG(total_time_ms) as avg_total_time_ms,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
    COUNT(*) as total_tests
  FROM test_results
  GROUP BY category, provider, model
  ORDER BY category, provider, model
`).all();
data.category_performance = categoryPerformance;

// Save all data to a single JSON file
const outputPath = path.join(outputDir, 'database.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

// Also create a minified version for production
const minifiedPath = path.join(outputDir, 'database.min.json');
fs.writeFileSync(minifiedPath, JSON.stringify(data));

// Get file sizes
const stats = fs.statSync(outputPath);
const minStats = fs.statSync(minifiedPath);

console.log(`\nDatabase export complete:`);
console.log(`  - Full JSON: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`  - Minified: ${minifiedPath} (${(minStats.size / 1024).toFixed(1)} KB)`);

// Create metadata file
const metadata = {
  exportedAt: new Date().toISOString(),
  tableCount: tables.length,
  rowCounts: Object.fromEntries(
    Object.entries(data).map(([table, rows]) => [table, rows.length])
  ),
  fileSize: minStats.size
};

fs.writeFileSync(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
);

db.close();
console.log('Done!');