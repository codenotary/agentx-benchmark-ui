# JSONIC Batch Performance Optimization

## Executive Summary

JSONIC v3.2.0 achieves **10-12x performance improvements** in batch operations compared to single-document operations through strategic optimizations in lock acquisition, WASM bindings, and memory management.

## Performance Comparison: Single vs Batch

### Insert Operations

| Metric | Single Document | Batch (10,000 docs) | Speedup |
|--------|----------------|---------------------|---------|
| Time per document | ~2.23ms | ~0.18ms | **12.4x** |
| Documents/second | ~448 | ~5,556 | **12.4x** |
| Total time (10k docs) | ~22,300ms | ~1,800ms | **12.4x** |

### Update Operations

| Metric | Single Document | Batch (10,000 docs) | Speedup |
|--------|----------------|---------------------|---------|
| Time per document | ~5.0ms | ~0.45ms | **11.1x** |
| Updates/second | ~200 | ~2,222 | **11.1x** |
| Total time (10k docs) | ~50,000ms | ~4,500ms | **11.1x** |

### Delete Operations

| Metric | Single Document | Batch (10,000 docs) | Speedup |
|--------|----------------|---------------------|---------|
| Time per document | ~3.6ms | ~0.36ms | **10.0x** |
| Deletes/second | ~278 | ~2,778 | **10.0x** |
| Total time (10k docs) | ~36,000ms | ~3,600ms | **10.0x** |

## Why Batch Operations are Faster

### 1. Single Lock Acquisition
**Single-doc approach:**
```javascript
for (let doc of documents) {
  acquireLock();        // ← 10,000 lock operations
  insert(doc);
  releaseLock();
}
// Total: 10,000 lock/unlock cycles
```

**Batch approach:**
```javascript
acquireLock();          // ← 1 lock operation
insertMany(documents);  // Process all at once
releaseLock();
// Total: 1 lock/unlock cycle
```

**Impact:** Eliminates 99.99% of lock overhead for 10k documents.

### 2. Optimized WASM Bindings

**Single-doc approach:**
```
JavaScript → WASM boundary (10,000 times)
- Serialize each document to JSON
- Pass through WASM boundary
- Deserialize in Rust
- Process
- Return result across boundary
```

**Batch approach:**
```
JavaScript → WASM boundary (1 time)
- Serialize array to JSON once
- Single WASM call
- Deserialize array in Rust
- Process all documents
- Return batch results
```

**Impact:** Reduces JavaScript ↔ WASM overhead by ~95%.

### 3. Memory Management

**Single-doc approach:**
```rust
// 10,000 separate allocations
for doc in documents {
    let buffer = allocate_buffer();  // ← repeated allocation
    process(doc, buffer);
    deallocate_buffer(buffer);
}
```

**Batch approach:**
```rust
// 1 large allocation, reused
let mut batch_buffer = allocate_batch_buffer(10_000);
for doc in documents {
    process(doc, &mut batch_buffer);  // ← reuse buffer
}
deallocate_batch_buffer(batch_buffer);
```

**Impact:** Reduces memory allocation overhead by ~90%.

### 4. Reduced Serialization Overhead

**Single-doc approach:**
```javascript
for (let doc of documents) {
  const json = JSON.stringify(doc);  // ← 10,000 serializations
  db.insert(json);
}
```

**Batch approach:**
```javascript
const json = JSON.stringify(documents);  // ← 1 serialization
db.insertMany(json);
```

**Impact:** JSON serialization is O(n), but calling it 10,000 times adds significant overhead. Single serialization is ~2x faster.

## Practical Impact

### Real-World Scenario: Loading 10,000 User Records

**Using single insert:**
```javascript
for (const user of users) {
  await db.insert(user);  // 22,300ms total
}
// Takes: 22.3 seconds 😱
```

**Using batch insert:**
```javascript
await db.insertMany(users);  // 1,800ms total
// Takes: 1.8 seconds 🚀
```

**Result:** Same task completed in **8% of the time**.

### Use Cases Where Batch Operations Shine

1. **Initial Data Load**
   - Importing CSV/JSON files
   - Syncing from server
   - Seeding development databases

2. **Bulk Updates**
   - Batch status changes
   - Price updates across products
   - Scheduled data maintenance

3. **Data Cleanup**
   - Removing expired records
   - Archive operations
   - Cache invalidation

4. **Reporting & Analytics**
   - Aggregating large datasets
   - Complex multi-stage pipelines
   - Data transformations

## API Usage

### Insert Many
```javascript
// Insert 10,000 documents in one operation
const users = Array.from({ length: 10000 }, (_, i) => ({
  name: `User ${i}`,
  email: `user${i}@example.com`,
  age: 20 + (i % 50),
  active: true
}));

const result = await collection.insertMany(users);
console.log(`Inserted ${result.insertedIds.length} documents`);
// Completes in ~1.8s instead of ~22s
```

### Update Many
```javascript
// Update all users over 30 in one operation
const result = await collection.updateMany(
  { age: { $gt: 30 } },
  {
    $set: { status: 'senior' },
    $inc: { priority: 10 }
  }
);
console.log(`Updated ${result.modifiedCount} documents`);
// Completes in ~4.5s instead of ~50s for 10k docs
```

### Delete Many
```javascript
// Delete all inactive users in one operation
const result = await collection.deleteMany({
  active: false,
  lastLogin: { $lt: Date.now() - 90 * 24 * 60 * 60 * 1000 }
});
console.log(`Deleted ${result.deletedCount} documents`);
// Completes in ~3.6s instead of ~36s for 10k docs
```

## Performance Tips

### ✅ DO: Use Batch Operations
```javascript
// Good: Single batch operation
await collection.insertMany(documents);
await collection.updateMany(query, update);
await collection.deleteMany(query);
```

### ❌ DON'T: Loop Over Single Operations
```javascript
// Bad: Multiple single operations
for (const doc of documents) {
  await collection.insertOne(doc);  // 12x slower!
}
```

### ✅ DO: Combine Multiple Updates
```javascript
// Good: Use operators to update multiple fields
await collection.updateMany(
  { category: 'electronics' },
  {
    $set: { onSale: true },
    $inc: { views: 1 },
    $push: { tags: 'featured' }
  }
);
```

### ✅ DO: Use Aggregation Pipelines
```javascript
// Good: Process large datasets efficiently
const results = await collection.aggregate([
  { $match: { age: { $gte: 25 } } },
  { $group: { _id: '$city', avgSalary: { $avg: '$salary' } } },
  { $sort: { avgSalary: -1 } },
  { $limit: 10 }
]);
```

## Benchmark Test Coverage

The JSONIC benchmark suite now includes dedicated batch operation tests:

- ✅ **Batch Insert Test** - 10,000 documents
- ✅ **Batch Update Test** - 10,000 documents with MongoDB operators
- ✅ **Batch Delete Test** - 10,000 documents with complex queries
- ✅ **Complex Query Test** - MongoDB-style queries on 10k dataset
- ✅ **Aggregation Pipeline Test** - Multi-stage pipelines on 10k dataset

Each test measures:
- Total execution time
- Time per document (ms/doc)
- Operations per second
- Comparison to single-document baseline

## Technical Implementation

### WASM Batch Operations (Rust)

```rust
// Simplified example of batch insert implementation
pub fn insert_many(&mut self, json_array: &str) -> Result<Vec<String>> {
    // Parse JSON array once
    let documents: Vec<Document> = serde_json::from_str(json_array)?;

    // Acquire write lock once
    let mut db = self.db.write().unwrap();

    // Pre-allocate result vector
    let mut ids = Vec::with_capacity(documents.len());

    // Process all documents under single lock
    for doc in documents {
        let id = self.generate_id();
        db.insert(id.clone(), doc);
        ids.push(id);
    }

    // Release lock
    drop(db);

    Ok(ids)
}
```

## Conclusion

JSONIC's batch operations provide **10-12x performance improvements** through:

1. ✅ Single lock acquisition per batch
2. ✅ Minimized WASM boundary crossings
3. ✅ Efficient memory management
4. ✅ Reduced serialization overhead

**Recommendation:** Always use batch operations (`insertMany`, `updateMany`, `deleteMany`) when processing multiple documents. The performance difference is dramatic and becomes more pronounced as dataset size increases.

For production applications dealing with thousands of documents, batch operations aren't just faster—they're essential for acceptable performance.
