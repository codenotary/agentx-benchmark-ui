# Benchmark Methodology

This document describes the methodology used in JSONIC's performance benchmarks to ensure fair, accurate, and reproducible results.

## Testing Principles

### 1. Fair Comparison
Each database is configured optimally for its architecture:
- **JSONIC**: In-memory mode with WASM optimization
- **IndexedDB**: Native browser API with proper indexing
- **SQL.js**: SQLite with appropriate indexes
- **LocalStorage**: Optimized key structure for queries

### 2. Realistic Workloads
Tests reflect real-world usage patterns:
- Document structure mimics typical application data
- Query patterns based on common use cases
- Mixed read/write operations
- Varying dataset sizes

### 3. Statistical Rigor
- Multiple iterations to account for variance
- Warmup runs to eliminate JIT compilation effects
- Standard deviation and percentile calculations
- Outlier detection and removal

### 4. Reproducibility
- Deterministic data generation
- Documented environment specifications
- Open source code for verification
- Version tracking for all dependencies

## Test Environment

### Hardware Requirements
- Minimum 8GB RAM
- Multi-core processor (4+ cores recommended)
- SSD storage for consistent I/O

### Software Requirements
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- JavaScript enabled
- Sufficient storage quota (1GB+ recommended)

### Browser Configuration
- Incognito/Private mode to avoid cache effects
- No extensions that might affect performance
- Single tab during testing
- Consistent window size

## Dataset Generation

### Document Schema
```javascript
{
  name: string,          // Full name
  email: string,         // Email address
  age: number,          // 18-68
  city: string,         // One of 10 cities
  status: string,       // active|inactive|pending|archived
  score: number,        // 0-100
  created: Date,        // Random date in past year
  tags: string[],       // 1-5 tags
  address: {
    street: string,
    zip: string
  },
  metadata: {
    source: string,
    version: number,
    timestamp: number
  }
}
```

### Dataset Sizes
- **Small**: 1,000 documents (~500KB)
- **Medium**: 10,000 documents (~5MB)
- **Large**: 100,000 documents (~50MB)
- **XLarge**: 1,000,000 documents (~500MB)

### Data Distribution
- Age: Normal distribution (mean=35, stddev=10)
- City: Uniform distribution across 10 cities
- Status: 60% active, 20% inactive, 15% pending, 5% archived
- Score: Uniform distribution 0-100
- Tags: Power law distribution (most have 1-2, few have 5)

## Test Scenarios

### 1. Insert Performance

#### Single Document Insert
```javascript
for (let i = 0; i < count; i++) {
  await db.insert(document);
}
```

#### Bulk Insert
```javascript
await db.bulkInsert(documents);
```

**Metrics**:
- Total time for all inserts
- Documents per second
- Memory consumption

### 2. Query Performance

#### Test Queries
1. **Simple Equality**: `{ age: 30 }`
2. **Range Query**: `{ age: { $gt: 25 } }`
3. **Complex Range**: `{ age: { $gte: 25, $lte: 35 } }`
4. **IN Query**: `{ city: { $in: ['NYC', 'LA'] } }`
5. **Compound Query**: `{ age: { $gt: 25 }, status: 'active' }`

**Metrics**:
- Query execution time
- Results retrieval time
- Queries per second

### 3. Update Performance

#### Single Update
```javascript
await db.update(id, { $set: { status: 'updated' } });
```

#### Bulk Update
```javascript
await db.updateMany(
  { age: { $gte: 25 } },
  { $set: { category: 'adult' } }
);
```

**Metrics**:
- Update execution time
- Documents updated per second
- Index rebuild time (if applicable)

### 4. Delete Performance

#### Single Delete
```javascript
await db.delete(id);
```

#### Bulk Delete
```javascript
await db.deleteMany({ status: 'archived' });
```

**Metrics**:
- Delete execution time
- Documents deleted per second
- Storage reclamation

### 5. Aggregation Performance

#### Pipeline
```javascript
[
  { $match: { age: { $gte: 25 } } },
  { $group: {
    _id: '$city',
    avgAge: { $avg: '$age' },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 10 }
]
```

**Metrics**:
- Pipeline execution time
- Memory usage during aggregation
- Result generation time

### 6. Transaction Performance

#### Transaction Operations
```javascript
const tx = await db.beginTransaction();
await tx.insert(doc1);
await tx.update(id, doc2);
await tx.delete(id2);
await tx.commit();
```

**Metrics**:
- Transaction overhead
- Commit time
- Rollback time
- Isolation verification

### 7. Memory Usage

#### Measurement Points
1. Before data load
2. After initial insert
3. After indexes created
4. During query execution
5. After cleanup

**Metrics**:
- Heap size (used and total)
- Memory per document
- Memory growth rate
- Garbage collection impact

## Measurement Techniques

### Timing
```javascript
const start = performance.now();
// Operation
const end = performance.now();
const duration = end - start;
```

### Memory
```javascript
const before = performance.memory.usedJSHeapSize;
// Operation
const after = performance.memory.usedJSHeapSize;
const used = after - before;
```

### Statistical Analysis
```javascript
function calculateStats(times) {
  const mean = average(times);
  const stdDev = standardDeviation(times);
  const median = getMedian(times);
  const p95 = getPercentile(times, 95);
  const p99 = getPercentile(times, 99);
  
  return { mean, stdDev, median, p95, p99 };
}
```

## Optimization Considerations

### Database-Specific Optimizations

#### JSONIC
- WASM memory pre-allocation
- Batch operation optimization
- Index strategy selection

#### IndexedDB
- Transaction batching
- Cursor optimization
- Index utilization

#### SQL.js
- Query planning
- Index creation
- Transaction management

#### LocalStorage
- Key structure optimization
- Batch reading strategies
- JSON parsing optimization

### General Optimizations
- Minimize serialization/deserialization
- Reuse prepared statements
- Connection pooling (where applicable)
- Appropriate index selection

## Known Limitations

### Browser Limitations
- Memory measurement requires Chrome
- Storage quotas vary by browser
- Performance API precision varies

### Test Limitations
- Synthetic workload may not match all use cases
- Single-threaded execution (no concurrency testing)
- Limited to browser environment
- No network latency simulation

### Database Limitations
- LocalStorage: 5-10MB size limit
- IndexedDB: Async-only API
- SQL.js: Memory-only (no persistence)
- JSONIC: WASM memory limits

## Result Interpretation

### Performance Metrics
- **Throughput**: Operations per second
- **Latency**: Time per operation
- **Scalability**: Performance vs dataset size
- **Consistency**: Standard deviation

### Relative Performance
Results show relative performance (baseline = 1.0x):
- 2.0x = Twice as fast
- 0.5x = Half as fast

### Statistical Significance
- Results with >20% standard deviation should be re-run
- Outliers beyond 3 standard deviations are excluded
- Minimum 3 iterations for statistical validity

## Reproducing Results

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/jsonic
cd jsonic/benchmarks

# Install dependencies
npm install

# Start benchmark server
npm start
```

### Running Benchmarks
```bash
# Browser
open http://localhost:8080

# Command line
node run-benchmarks.js --size medium --iterations 5
```

### Verification
1. Run benchmarks multiple times
2. Compare results across runs
3. Check for consistency
4. Validate against expected ranges

## Contributing

### Adding New Databases
1. Create adapter in `src/adapters/`
2. Implement all required methods
3. Add to runner configuration
4. Document specific optimizations

### Adding Test Scenarios
1. Define scenario in `src/scenarios/`
2. Implement measurement logic
3. Add to default test suite
4. Document expected behavior

### Improving Methodology
1. Open issue for discussion
2. Provide evidence for changes
3. Submit PR with updates
4. Update this documentation

## Change Log

### Version 1.0.0 (2024-01-20)
- Initial benchmark suite
- Support for 4 databases
- 7 test scenarios
- Basic statistical analysis

## References

- [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [IndexedDB Performance](https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices)
- [WebAssembly Performance](https://webassembly.org/docs/portability/#performance)
- [SQL.js Documentation](https://github.com/sql-js/sql.js/)
- [Statistical Analysis Methods](https://en.wikipedia.org/wiki/Statistical_hypothesis_testing)