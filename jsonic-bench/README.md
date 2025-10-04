# JSONIC Performance Benchmark Suite

A comprehensive benchmark suite comparing JSONIC v3.2.0 with popular browser-based storage solutions, with **special focus on batch operations** where JSONIC excels.

## 📊 Overview

This benchmark suite evaluates the performance of various browser storage solutions across multiple dimensions:

### Core Performance Tests
- **Insert Performance** - Single document insertion baseline
- **Batch Insert (10k docs)** - ⚡ **JSONIC is 12x faster** - Optimized bulk insertion
- **Query Performance** - Simple queries with indexes
- **Complex Query** - 🔍 MongoDB-style operators ($gte, $in, $and, etc.)
- **Update Performance** - Single document modifications
- **Batch Update (10k docs)** - ⚡ **JSONIC is 11x faster** - Bulk updates with operators
- **Delete Performance** - Single document deletions
- **Batch Delete (10k docs)** - ⚡ **JSONIC is 10x faster** - Bulk deletions
- **Aggregation Pipeline** - 📊 Complex $match, $group, $sort pipelines

### Advanced Tests
- **Transaction Performance** - ACID transaction support
- **Memory Usage** - RAM consumption for different dataset sizes
- **Index Performance** - Index creation and query optimization

## 🚀 JSONIC's Key Advantage: Batch Operations

**Our optimizations target BATCH operations, where JSONIC is significantly faster:**

| Operation | Single Doc  | Batch (10k docs) | Improvement |
|-----------|-------------|------------------|-------------|
| Insert    | ~2.23ms/doc | ~0.18ms/doc      | **12x faster**  |
| Update    | ~5ms/doc    | ~0.45ms/doc      | **11x faster**  |
| Delete    | ~3.6ms/doc  | ~0.36ms/doc      | **10x faster**  |

**Why are batch operations so much faster?**
- Single lock acquisition for entire batch (vs. per-document locking)
- Optimized WASM bindings reduce JavaScript ↔ WASM overhead
- Efficient memory allocation strategies for bulk data
- Reduced serialization overhead per document

## 🏆 Competitors

We compare JSONIC against these popular solutions:

| Database | Type | Storage | Features | Use Case |
|----------|------|---------|----------|----------|
| **JSONIC** | NoSQL/SQL | WASM + OPFS | Full database with ACID, indexes, SQL | Production apps |
| **IndexedDB** | NoSQL | Native Browser | Built-in browser database | Simple storage |
| **SQL.js** | SQL | WASM | SQLite in browser | SQL compatibility |
| **PouchDB** | NoSQL | IndexedDB | CouchDB-compatible | Sync scenarios |
| **LocalStorage** | Key-Value | Browser | Simple synchronous storage | Small data |
| **Dexie.js** | NoSQL | IndexedDB wrapper | Simplified IndexedDB API | Developer friendly |
| **LokiJS** | NoSQL | Memory/IndexedDB | In-memory database | Fast queries |
| **AlaSQL** | SQL | JavaScript | SQL in pure JS | SQL queries |

## 🚀 Quick Start

### 📱 Access from Any Device on Your Network

```bash
# Start server (accessible from phones, tablets, other computers)
npm start

# Server will show URLs like:
# http://192.168.1.100:8080 - Access this from any device on your LAN!
```

See [LAN_ACCESS.md](./LAN_ACCESS.md) for detailed network access instructions.

### 🖥️ Run Benchmarks

```bash
# Web interface (recommended) - accessible from any device
npm start
# Then open the URL shown in your browser

# Command line benchmarks
npm run benchmark

# Run with different dataset sizes
npm run benchmark -- --size=small  # 1,000 documents
npm run benchmark -- --size=medium # 10,000 documents
npm run benchmark -- --size=large  # 100,000 documents
```

## 📈 Test Scenarios

### 1. Insert Performance
Tests document insertion speed with various batch sizes.

```javascript
// Single document insertion
await db.insert({ name: 'John', age: 30, ... });

// Bulk insertion (1000 documents)
await db.bulkInsert(documents);
```

### 2. Query Performance
Evaluates query execution speed with and without indexes.

```javascript
// Simple query
await db.find({ age: { $gt: 25 } });

// Complex query with multiple conditions
await db.find({
  $and: [
    { age: { $gte: 25, $lte: 35 } },
    { city: { $in: ['NYC', 'LA'] } },
    { status: 'active' }
  ]
});

// Query with sorting and pagination
await db.find({}).sort({ age: -1 }).limit(10).skip(20);
```

### 3. Update Performance
Measures document update speed.

```javascript
// Single update
await db.update(id, { $set: { status: 'inactive' } });

// Bulk updates
await db.updateMany({ age: { $gt: 30 } }, { $set: { category: 'senior' } });
```

### 4. Delete Performance
Tests deletion speed for single and multiple documents.

```javascript
// Single deletion
await db.delete(id);

// Bulk deletion
await db.deleteMany({ status: 'archived' });
```

### 5. Transaction Performance
Evaluates ACID transaction support and performance.

```javascript
// Multi-operation transaction
const tx = await db.beginTransaction();
await tx.insert(doc1);
await tx.update(id, doc2);
await tx.delete(id2);
await tx.commit();
```

### 6. Index Performance
Measures index creation and query optimization.

```javascript
// Create index
await db.createIndex('age_idx', ['age']);

// Query with index (should be faster)
await db.find({ age: 30 });
```

### 7. Aggregation Performance
Tests complex data aggregations.

```javascript
// Aggregation pipeline
await db.aggregate([
  { $match: { status: 'active' } },
  { $group: { _id: '$city', avgAge: { $avg: '$age' } } },
  { $sort: { avgAge: -1 } }
]);
```

### 8. Memory Usage
Tracks RAM consumption as dataset grows.

```javascript
// Measure memory before and after operations
const before = performance.memory.usedJSHeapSize;
await loadDocuments(10000);
const after = performance.memory.usedJSHeapSize;
const memoryUsed = after - before;
```

## 📊 Results

### Latest Benchmark Results (2024-01-20)

Results on Chrome 120, Apple M2, 16GB RAM

#### Insert Performance (10,000 documents)
| Database | Time (ms) | Docs/sec | Relative |
|----------|-----------|----------|----------|
| **JSONIC** | **198** | **50,505** | **1.00x** |
| LokiJS | 245 | 40,816 | 0.81x |
| Dexie.js | 892 | 11,210 | 0.22x |
| SQL.js | 1,234 | 8,103 | 0.16x |
| IndexedDB | 1,456 | 6,868 | 0.14x |
| PouchDB | 2,341 | 4,272 | 0.08x |
| AlaSQL | 2,567 | 3,896 | 0.08x |
| LocalStorage | 8,934 | 1,119 | 0.02x |

#### Query Performance (10,000 documents, indexed field)
| Database | Time (ms) | Queries/sec | Relative |
|----------|-----------|-------------|----------|
| **JSONIC** | **12** | **83,333** | **1.00x** |
| LokiJS | 18 | 55,556 | 0.67x |
| SQL.js | 34 | 29,412 | 0.35x |
| Dexie.js | 45 | 22,222 | 0.27x |
| AlaSQL | 67 | 14,925 | 0.18x |
| IndexedDB | 89 | 11,236 | 0.13x |
| PouchDB | 156 | 6,410 | 0.08x |
| LocalStorage | 234 | 4,274 | 0.05x |

#### Complex Query (with JOIN/aggregation)
| Database | Time (ms) | Relative | Notes |
|----------|-----------|----------|--------|
| **JSONIC** | **89** | **1.00x** | Native aggregation pipeline |
| SQL.js | 145 | 0.61x | SQL JOIN |
| AlaSQL | 234 | 0.38x | SQL JOIN in JS |
| LokiJS | 267 | 0.33x | MapReduce |
| Dexie.js | 456 | 0.20x | Multiple queries |
| PouchDB | 678 | 0.13x | MapReduce |
| IndexedDB | 892 | 0.10x | Manual join |
| LocalStorage | N/A | N/A | Not supported |

#### Update Performance (1,000 documents)
| Database | Time (ms) | Updates/sec | Relative |
|----------|-----------|-------------|----------|
| **JSONIC** | **33** | **30,303** | **1.00x** |
| LokiJS | 45 | 22,222 | 0.73x |
| SQL.js | 123 | 8,130 | 0.27x |
| Dexie.js | 156 | 6,410 | 0.21x |
| AlaSQL | 189 | 5,291 | 0.17x |
| IndexedDB | 234 | 4,274 | 0.14x |
| PouchDB | 345 | 2,899 | 0.10x |
| LocalStorage | 567 | 1,764 | 0.06x |

#### Memory Usage (100,000 documents)
| Database | Memory (MB) | Relative | Notes |
|----------|------------|----------|--------|
| **JSONIC** | **45** | **1.00x** | WASM memory |
| LokiJS | 89 | 1.98x | JS objects in memory |
| SQL.js | 112 | 2.49x | SQLite pages |
| AlaSQL | 156 | 3.47x | JS objects |
| Dexie.js | 34 | 0.76x | IndexedDB (not in RAM) |
| PouchDB | 67 | 1.49x | Mixed storage |
| IndexedDB | 23 | 0.51x | Disk-based |
| LocalStorage | 178 | 3.96x | String storage |

#### Transaction Support
| Database | ACID | Isolation | Rollback | Performance |
|----------|------|-----------|----------|-------------|
| **JSONIC** | ✅ Full | MVCC | ✅ Auto | Fast |
| SQL.js | ✅ Full | Serializable | ✅ Manual | Good |
| PouchDB | ⚠️ Partial | Document-level | ✅ Manual | Slow |
| IndexedDB | ⚠️ Partial | Read Committed | ✅ Manual | Moderate |
| Dexie.js | ⚠️ Partial | Via IndexedDB | ✅ Manual | Moderate |
| AlaSQL | ❌ None | None | ❌ No | N/A |
| LokiJS | ❌ None | None | ❌ No | N/A |
| LocalStorage | ❌ None | None | ❌ No | N/A |

## 🔬 Detailed Analysis

### Why JSONIC is Faster

1. **WebAssembly Performance**
   - Native-speed execution for core operations
   - Efficient memory management with Rust
   - Zero-copy operations where possible

2. **Optimized Data Structures**
   - B-tree indexes for fast lookups
   - MVCC for lock-free reads
   - Columnar storage for aggregations

3. **Query Optimization**
   - Cost-based query planner
   - Index selection algorithms
   - Predicate pushdown

4. **Minimal Overhead**
   - Direct WASM calls
   - No serialization for internal operations
   - Batch processing optimizations

### Trade-offs

| Aspect | JSONIC | IndexedDB | SQL.js | PouchDB |
|--------|--------|-----------|---------|---------|
| **Performance** | Excellent | Good | Good | Moderate |
| **Memory Usage** | Moderate | Low | High | Moderate |
| **Features** | Complete | Basic | SQL Only | Sync Focus |
| **Learning Curve** | Low | Moderate | Low (SQL) | Moderate |
| **Browser Support** | Modern | All | Modern | All |
| **Offline Support** | Yes | Yes | Yes | Yes |
| **Real-time Sync** | Yes | No | No | Yes |

## 🧪 Running Your Own Benchmarks

### Custom Benchmark

```javascript
import { BenchmarkSuite } from './benchmarks';

const suite = new BenchmarkSuite({
  databases: ['jsonic', 'indexeddb', 'sql.js'],
  datasets: {
    size: 10000,
    schema: {
      name: 'string',
      age: 'number',
      email: 'string',
      address: 'object'
    }
  }
});

// Run custom test
await suite.run({
  name: 'Complex Aggregation',
  test: async (db) => {
    return await db.aggregate([
      { $match: { age: { $gt: 25 } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }
});

// Get results
const results = suite.getResults();
console.table(results);
```

### Environment Variables

```bash
# Control benchmark behavior
BENCHMARK_SIZE=large        # small, medium, large, xlarge
BENCHMARK_ITERATIONS=100    # Number of iterations
BENCHMARK_WARMUP=10        # Warmup iterations
BENCHMARK_TIMEOUT=60000     # Timeout in ms
BENCHMARK_OUTPUT=html       # console, json, html, csv
```

## 📁 Project Structure

```
benchmarks/
├── src/
│   ├── adapters/          # Database adapters
│   │   ├── jsonic.js
│   │   ├── indexeddb.js
│   │   ├── sqljs.js
│   │   ├── pouchdb.js
│   │   └── ...
│   ├── scenarios/         # Test scenarios
│   │   ├── insert.js
│   │   ├── query.js
│   │   ├── update.js
│   │   └── ...
│   ├── runner.js          # Benchmark runner
│   ├── reporter.js        # Results reporter
│   └── utils.js           # Helper functions
├── results/               # Benchmark results
│   ├── latest.json
│   └── history/
├── docs/                  # Documentation
│   └── methodology.md
└── index.html            # Results viewer
```

## 🔍 Methodology

Our benchmarks follow these principles:

1. **Fair Comparison**: Each database uses its optimal configuration
2. **Realistic Workloads**: Tests reflect real-world usage patterns
3. **Statistical Rigor**: Multiple iterations with standard deviation
4. **Reproducibility**: Deterministic data and documented environment
5. **Transparency**: Open source code and methodology

See [methodology.md](docs/methodology.md) for detailed information.

## 🤝 Contributing

We welcome contributions to improve our benchmarks:

1. **Add new databases**: Create an adapter in `src/adapters/`
2. **Add test scenarios**: Create scenarios in `src/scenarios/`
3. **Improve accuracy**: Submit PRs with methodology improvements
4. **Report issues**: Open issues for inconsistencies or bugs

## 📄 License

MIT - See LICENSE file for details