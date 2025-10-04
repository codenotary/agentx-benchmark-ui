# JSONIC v3.2 Migration Summary

## Overview
Updated the codebase to support JSONIC v3.2's new simplified API while maintaining backward compatibility with legacy wrappers.

## Key Changes in JSONIC v3.2

### 1. **Default Database Singleton**
- New `db` export for zero-config usage
- Just `import { db } from 'jsonic-db'` and start using
- No manual initialization required

### 2. **Private Constructor Pattern**
- Must use `JSONIC.create()` instead of `new JSONIC()`
- Enforces correct usage patterns

### 3. **Collection-Based API**
- Database now uses collections: `db.collection('name')`
- All operations go through collections instead of direct DB access
- MongoDB-like API: `insertOne()`, `findOne()`, `find()`, etc.

### 4. **Modular Imports**
- Core features: `import { db, JSONIC } from 'jsonic-db'`
- Advanced features: `import { ... } from 'jsonic-db/advanced'`
- AI features: `import { ... } from 'jsonic-db/ai'`

## Files Updated

### `/src/services/jsonicService.ts`
**Major Refactoring:**

1. **Interface Changes:**
   ```typescript
   // Old (v3.1)
   interface JsonicDatabase {
     insert(data: any): Promise<string>;
     get(id: string): Promise<any>;
     update(id: string, data: any): Promise<boolean>;
     // ... low-level operations
   }

   // New (v3.2)
   interface JsonicCollection {
     insertOne(doc: any): Promise<{ _id: string }>;
     findOne(filter: any): Promise<any>;
     find(filter: any, options?: FindOptions): Promise<any[]>;
     updateOne(filter: any, update: any): Promise<UpdateResult>;
     // ... collection-based operations
   }

   interface JsonicDatabase {
     collection(name: string): JsonicCollection;
   }
   ```

2. **Initialization:**
   ```typescript
   // Try v3.2 npm package first
   const { JSONIC: JSONICModule } = await import('jsonic-db');
   this.db = await JSONICModule.create({
     name: 'agentx_benchmark',
     persistence: false,
     crossTabSync: false
   });
   this.collection = this.db.collection('benchmarks');

   // Fallback to legacy wrapper if npm package not available
   ```

3. **Method Conversions:**
   - `insert(data)` → `insertOne(data)` returns `{ _id }`
   - `get(id)` → `findOne({ _id: id })`
   - `update(id, data)` → `updateOne({ _id: id }, { $set: data })`
   - `delete(id)` → `deleteOne({ _id: id })`
   - `list()` → `find({}, { projection: { _id: 1 } })`

### `/src/services/jsonicApi.ts`
**Sort Option Format Changes:**

```typescript
// Old format (array of tuples)
{ sort: [['timestamp', -1]] }
{ sort: [['provider', 1], ['model', 1]] }

// New format (object)
{ sort: { timestamp: -1 } }
{ sort: { provider: 1, model: 1 } }
```

**Updated Functions:**
- `fetchBenchmarkRunsJsonic()` - Updated sort format
- `fetchModelPerformanceJsonic()` - Updated sort format
- `fetchTestResultsJsonic()` - Updated sort format
- `fetchPerformanceTrendsJsonic()` - Updated sort format

### `/src/components/JsonicDebugPanel.tsx`
**Temporary Changes:**
- Removed direct calls to `getDebugInfo()`, `clearCache()`, `clearProfiler()`
- Added TODO comments for v3.2 debug API implementation
- Mock data provided for debug info to prevent errors

## Migration Strategy

### Progressive Enhancement Approach
1. **Primary:** Try loading JSONIC v3.2 from npm package
2. **Fallback:** Use legacy wrappers (hybrid/v3/v1) if npm package unavailable
3. **Compatibility:** Maintain legacy method signatures for gradual migration

### Backward Compatibility
All legacy methods maintained with internal conversion to collection API:
- `insert()` → wraps `insertOne()`
- `get()` → wraps `findOne()`
- `update()` → wraps `updateOne()`
- `delete()` → wraps `deleteOne()`

## Benefits of v3.2

1. **Simpler API:**
   - 2-line setup instead of 5+
   - No manual configuration required
   - Auto-initialization on first use

2. **Better Type Safety:**
   - Proper TypeScript interfaces
   - Clear return types
   - Generic collection types

3. **MongoDB Compatibility:**
   - Familiar API for developers
   - Standard query operators
   - Aggregation pipeline support

4. **Performance:**
   - Query result caching (3-40x speedup)
   - Batch operations (5-10x faster)
   - Automatic indexing

## Next Steps

### Immediate
- [x] Update core service layer
- [x] Update API layer
- [x] Maintain backward compatibility
- [ ] Fix Dashboard.tsx type errors (unrelated to JSONIC)

### Future Enhancements
- [ ] Install jsonic-db npm package when published
- [ ] Remove legacy wrapper fallback code
- [ ] Implement v3.2 debug API when available
- [ ] Migrate to advanced features (`jsonic-db/advanced`)
- [ ] Add AI features (`jsonic-db/ai`) for vector search

### Testing Required
- [ ] Test with v3.2 npm package
- [ ] Test fallback to legacy wrappers
- [ ] Test all CRUD operations
- [ ] Test aggregation pipelines
- [ ] Test batch operations
- [ ] Performance benchmarking

## API Reference Quick Guide

### Basic Usage (v3.2)
```typescript
import { db } from 'jsonic-db';

// Get collection (auto-created)
const users = db.collection('users');

// Insert
await users.insertOne({ name: 'Alice', age: 30 });
await users.insertMany([{ name: 'Bob' }, { name: 'Charlie' }]);

// Query
const user = await users.findOne({ name: 'Alice' });
const all = await users.find({ age: { $gte: 25 } });

// Update
await users.updateOne({ name: 'Alice' }, { $set: { age: 31 } });
await users.updateMany({ age: { $lt: 30 } }, { $set: { status: 'young' } });

// Delete
await users.deleteOne({ name: 'Bob' });
await users.deleteMany({ status: 'inactive' });

// Aggregate
const stats = await users.aggregate([
  { $match: { active: true } },
  { $group: { _id: '$dept', avgAge: { $avg: '$age' } } }
]);
```

### Custom Database
```typescript
import { JSONIC } from 'jsonic-db';

const db = await JSONIC.create({
  name: 'myapp',
  persistence: true,
  crossTabSync: true
});

const users = db.collection('users');
```

### Advanced Features
```typescript
import { QueryBuilder, schema } from 'jsonic-db/advanced';
import { VectorEngine, GeminiProvider } from 'jsonic-db/ai';
```

## Performance Improvements

### v3.2 Optimizations
- **Query Caching:** LRU cache with automatic invalidation (3-40x speedup)
- **Batch Operations:** Single lock acquisition (5-10x faster)
- **Automatic Indexing:** Smart index creation on common fields
- **WASM Optimization:** Reduced serialization overhead

### Benchmark Results
| Operation | v3.1 | v3.2 | Improvement |
|-----------|------|------|-------------|
| Batch Insert | 20k docs/sec | 25k docs/sec | 25% |
| Cached Query | 200k ops/sec | 500k ops/sec | 150% |
| Indexed Query | 50k ops/sec | 100k ops/sec | 100% |
| Aggregation | 10k ops/sec | 15k ops/sec | 50% |

## Troubleshooting

### Issue: "Cannot find module 'jsonic-db'"
**Solution:** Fallback to legacy wrapper automatically activated

### Issue: Methods not found on collection
**Solution:** Ensure using collection API, not legacy database API

### Issue: Sort format errors
**Solution:** Use object format `{ field: 1 }` instead of array `[['field', 1]]`

### Issue: Debug panel not working
**Solution:** Debug API not yet implemented in v3.2, using mock data

## References

- [JSONIC v3.2 README](../jsonic/README.md)
- [JSONIC Quick Start](../jsonic/QUICKSTART.md)
- [JSONIC Developer Guide](../jsonic/DEVELOPER_GUIDE.md)
- [Collection API Reference](../jsonic/src/collection.ts)
- [Index New API](../jsonic/src/index-new.ts)

---

**Migration Date:** 2025-10-04
**JSONIC Version:** v3.2.0
**Status:** ✅ Core migration complete, backward compatible
