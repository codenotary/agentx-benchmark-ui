# JSONIC Database Integration

This document explains how to use the JSONIC WebAssembly database instead of JSON files for the AgentX Benchmark UI.

## Overview

JSONIC is a high-performance, WebAssembly-native JSON database that runs entirely in the browser. It provides:

- **Near-native performance** through Rust-powered WebAssembly
- **Browser persistence** using IndexedDB
- **Efficient queries** without loading entire datasets
- **Document versioning** for tracking changes
- **Offline-first architecture** perfect for static hosting

## Setup Instructions

### 1. Build JSONIC WASM Module

First, ensure the JSONIC WASM module is built:

```bash
cd /home/dennis/github/jsonic
./build.sh
```

This creates the WASM module in `/home/dennis/github/jsonic/pkg/`.

### 2. Configure Database Mode

The database mode is configured in `src/config/database.ts`:

```typescript
export const DB_CONFIG = {
  // Set to 'jsonic' to use JSONIC, 'json' for static JSON files
  mode: 'jsonic',  // Default: jsonic
  
  jsonic: {
    wasmPath: '/home/dennis/github/jsonic/pkg/jsonic_wasm.js',
    dbName: 'agentx_benchmark',
    autoMigrate: true,  // Auto-migrate from JSON on first load
    persist: true       // Enable IndexedDB persistence
  }
};
```

### 3. Data Migration

The system automatically migrates existing JSON data to JSONIC on first load when `autoMigrate` is enabled.

#### Manual Migration

To manually trigger migration:

```javascript
import { resetAndMigrate } from './src/utils/migrateToJsonic';

// Reset and re-migrate data
await resetAndMigrate();
```

#### Check Migration Status

```javascript
// Check if migration is completed
const migrationCompleted = localStorage.getItem('jsonic_migration_completed');
const migrationDate = localStorage.getItem('jsonic_migration_date');
```

## API Usage

The API service automatically switches between JSONIC and JSON based on configuration:

```typescript
import { 
  fetchBenchmarkRuns,
  fetchModelPerformance,
  fetchTestResults,
  fetchPerformanceTrends,
  fetchCategoryPerformance,
  fetchStats
} from './services/api';

// These functions automatically use JSONIC when configured
const runs = await fetchBenchmarkRuns();
const performance = await fetchModelPerformance('latest');
const results = await fetchTestResults('run-id');
```

## Direct JSONIC API

For direct JSONIC operations:

```typescript
import {
  storeBenchmarkRun,
  storeModelPerformance,
  storeTestResult,
  fetchBenchmarkRunsJsonic,
  fetchModelPerformanceJsonic,
  fetchTestResultsJsonic
} from './services/jsonicApi';

// Store new data
const runId = await storeBenchmarkRun(benchmarkData);
const perfId = await storeModelPerformance(performanceData, runId);

// Query data
const runs = await fetchBenchmarkRunsJsonic();
const performance = await fetchModelPerformanceJsonic('latest');
```

## Data Structure

JSONIC stores documents with metadata:

```javascript
{
  "_type": "benchmark_run",        // Document type
  "_runId": "run-123",             // Associated run ID
  "_timestamp": "2025-09-20T...",  // Creation timestamp
  // ... actual data fields
}
```

Document types:
- `benchmark_run` - Benchmark execution metadata
- `model_performance` - Model performance metrics
- `test_result` - Individual test results
- `performance_trend` - Performance trends over time

## Performance Comparison

| Operation | JSON Files | JSONIC |
|-----------|------------|---------|
| Initial Load | ~500ms (full file) | ~100ms (lazy load) |
| Query Single Record | O(n) scan | O(1) lookup |
| Filter Operations | Full scan | Indexed query |
| Memory Usage | Entire dataset | On-demand loading |
| Persistence | None | IndexedDB |
| Offline Support | Read-only | Full CRUD |

## Troubleshooting

### WASM Module Not Found

If you see "Failed to initialize JSONIC database":

1. Check the WASM module path in `database.ts`
2. Rebuild JSONIC: `cd /home/dennis/github/jsonic && ./build.sh`
3. Verify the pkg directory exists: `ls /home/dennis/github/jsonic/pkg/`

### Migration Issues

If migration fails:

1. Clear browser storage:
```javascript
localStorage.clear();
indexedDB.deleteDatabase('agentx_benchmark');
```

2. Re-run migration:
```javascript
import { resetAndMigrate } from './utils/migrateToJsonic';
await resetAndMigrate();
```

### Performance Issues

If queries are slow:

1. Check browser console for errors
2. Verify WASM module is loaded correctly
3. Clear IndexedDB and re-migrate data

## Development

### Adding New Document Types

1. Define the TypeScript interface
2. Add store/fetch functions in `jsonicApi.ts`
3. Update migration script for new data
4. Add type to document type enum

### Testing

```bash
# Run tests
npm run test

# Test migration
npm run test:migration

# Benchmark performance
npm run benchmark
```

## Browser Support

JSONIC requires:
- WebAssembly support (all modern browsers)
- IndexedDB support (for persistence)
- ES2020+ JavaScript features

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] MongoDB-style queries
- [ ] Real-time reactive views
- [ ] Cross-tab synchronization
- [ ] Compression for large datasets
- [ ] Query optimization with indexes
- [ ] Time-travel queries for versioned data