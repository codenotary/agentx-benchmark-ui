/**
 * Feature comparison matrix for database adapters
 */

export const FEATURE_MATRIX = {
  jsonic: {
    name: 'JSONIC',
    version: '3.1.0',
    type: 'Hybrid NoSQL/SQL',
    features: {
      // Storage Features
      storage: {
        'In-Memory Storage': true,
        'Persistent Storage': true,
        'IndexedDB Backend': true,
        'LocalStorage Backend': false,
        'WebSQL Backend': false,
        'OPFS Support': true,
        'Memory Mapped Files': false,
        'Compression': true,
        'Encryption': false, // TODO: Add field-level encryption
      },
      
      // Data Model
      dataModel: {
        'JSON Documents': true,
        'Relational Tables': true, // ✅ SQL Engine (Phase 3)
        'Key-Value Pairs': true,
        'Graph Data': false, // TODO: Future enhancement
        'Time Series': false, // TODO: Future enhancement
        'Geospatial': false, // TODO: Future enhancement
        'Binary Data': true,
        'Schema Validation': true, // ✅ Phase 3
        'Schema-less': true,
      },
      
      // Query Capabilities
      querying: {
        'SQL Support': true, // ✅ Full SQL Engine (Phase 3)
        'MongoDB-style Queries': true, // ✅ Phase 2 Complete
        'Full-text Search': false, // TODO: Add to compete with SQL.js
        'Regex Search': true,
        'Fuzzy Search': false, // TODO: Competitive advantage opportunity
        'GraphQL': false, // TODO: Major differentiator
        'Aggregation Pipeline': true, // ✅ Phase 2 Complete
        'Map-Reduce': false, // TODO: No competitor has this
        'Stored Procedures': false, // TODO: Enterprise feature
        'Views': true, // ✅ ReactiveView (Phase 3)
      },
      
      // Indexing
      indexing: {
        'Primary Keys': true,
        'Secondary Indexes': true,
        'Compound Indexes': true,
        'Unique Indexes': true,
        'Partial Indexes': true,
        'Full-text Indexes': true,
        'Hash Indexes': true,
        'B-Tree Indexes': true,
        'GiST Indexes': false,
        'Auto-indexing': true,
      },
      
      // Transactions
      transactions: {
        'ACID Compliance': true,
        'Multi-document Transactions': true,
        'Nested Transactions': true,
        'Savepoints': true,
        'Two-phase Commit': false,
        'Optimistic Locking': true,
        'Pessimistic Locking': false,
        'MVCC': true,
        'Isolation Levels': true,
        'Deadlock Detection': true,
      },
      
      // Replication & Sync
      replication: {
        'Master-Slave': false, // TODO: Future enhancement
        'Master-Master': false, // TODO: Future enhancement
        'Peer-to-Peer': true, // ✅ WebRTC P2P (Phase 3)
        'Cross-tab Sync': true, // ✅ BroadcastChannel (Phase 3)
        'Offline Support': true, // ✅ Core feature (browser-based)
        'Conflict Resolution': true, // ✅ Advanced CRDT support (Phase 3)
        'Change Streams': true, // ✅ LiveQuery streams (Phase 3)
        'Event Sourcing': false, // TODO: Future enhancement
        'CRDT Support': true, // ✅ Conflict-free replicated data (Phase 3)
        'Sync Protocol': 'WebSocket/HTTP/WebRTC', // ✅ Multiple protocols (Phase 3)
      },
      
      // Performance
      performance: {
        'Query Optimization': true,
        'Query Caching': true, // ✅ LRU Cache with 100 entries (v3.1)
        'Result Caching': true, // ✅ Automatic invalidation (v3.1)
        'Connection Pooling': false, // TODO: Multi-tab scenarios
        'Lazy Loading': false, // TODO: Large datasets
        'Batch Operations': true, // ✅ Phase 2 Complete (insertMany, updateMany, deleteMany)
        'Bulk Insert': true, // ✅ Phase 2 Complete
        'Streaming Results': false, // TODO: Large result sets
        'Parallel Queries': false, // TODO: WebAssembly advantage
        'WebAssembly': true, // ✅ Core feature
      },
      
      // Developer Experience
      developer: {
        'TypeScript Support': true, // ✅ Core feature
        'React Hooks': true, // ✅ Complete hooks library (Phase 3)
        'Vue Integration': true, // ✅ Vue 3 composables (Phase 3)
        'Observable Queries': true, // ✅ LiveQuery/ReactiveView (Phase 3)
        'Migrations': false, // TODO: Add to compete with SQL.js
        'Debugging Tools': false, // TODO: Browser dev tools integration
        'Query Builder': true, // ✅ Phase 2 Complete (MongoDB-style fluent API)
        'ORM/ODM': true, // ✅ Phase 2 Complete (Collection API)
        'REST API': false, // TODO: Future enhancement
        'GraphQL API': false, // TODO: Major differentiator
      },
      
      // Security
      security: {
        'Authentication': false,
        'Authorization': false,
        'Row-level Security': false,
        'Column-level Security': false,
        'Audit Logging': true,
        'Data Encryption': false,
        'SSL/TLS': false,
        'Field-level Encryption': false,
        'GDPR Compliance': true,
        'Data Masking': false,
      },
      
      // AI/LLM Integration (Phase 3 - Unique to JSONIC)
      ai: {
        'Vector Search': true, // ✅ Embedding-based similarity search
        'OpenAI Integration': true, // ✅ GPT models support
        'Anthropic Integration': true, // ✅ Claude models support
        'Local LLM Support': true, // ✅ ONNX runtime integration
        'RAG Pipeline': true, // ✅ Retrieval-Augmented Generation
        'Agent Memory': true, // ✅ Short/long-term, episodic, semantic
        'Embedding Generation': true, // ✅ Multiple distance metrics
        'Semantic Search': true, // ✅ Natural language queries
        'AI-powered Queries': true, // ✅ Natural language to SQL/MongoDB
        'Knowledge Graphs': false, // TODO: Future enhancement
      },
      
      // Compatibility
      compatibility: {
        'Chrome': true,
        'Firefox': true,
        'Safari': true,
        'Edge': true,
        'Node.js': false, // TODO: Future roadmap
        'Deno': false, // TODO: Future roadmap
        'React Native': false, // TODO: Future roadmap
        'Electron': true,
        'Web Workers': true,
        'Service Workers': true,
      },
      
      // Limitations
      limitations: {
        'Max Database Size': '2GB',
        'Max Document Size': '16MB',
        'Max Collections': 'Unlimited',
        'Max Indexes': 'Unlimited',
        'Max Connections': 'N/A',
        'Max Query Complexity': 'High',
        'Memory Usage': 'Medium',
        'CPU Usage': 'Low',
        'Network Overhead': 'None',
        'Browser Storage Quota': 'Yes',
      },
    },
    pros: [
      'WebAssembly performance (near-native speed)',
      'MongoDB + SQL dual syntax support', // ✅ Phase 3
      'ACID transactions with MVCC',
      'Rich aggregation pipeline', // ✅ Phase 2
      'Bulk operations (insertMany, updateMany)', // ✅ Phase 2
      'TypeScript-first design',
      'Update operators ($set, $push, $inc)', // ✅ Phase 2
      'Real-time sync (WebSocket/WebRTC)', // ✅ Phase 3
      'AI/LLM integration with vector search', // ✅ Phase 3
      'Reactive views and cross-tab sync', // ✅ Phase 3
      'Browser-native (no server required)',
      'Offline-first architecture'
    ],
    cons: [
      'Browser-only (no Node.js support yet)',
      '2GB practical storage limit',
      'No built-in authentication',
      'Larger WASM bundle size (~1MB)',
      'Learning curve for advanced features',
      'Relatively new (active development)'
    ],
    bestFor: [
      'Complex client-side applications',
      'Offline-first PWAs',
      'Real-time collaborative apps',
      'Data-intensive SPAs',
      'Local data processing'
    ]
  },
  
  indexeddb: {
    name: 'IndexedDB',
    version: '3.0',
    type: 'NoSQL Object Store',
    features: {
      storage: {
        'In-Memory Storage': false,
        'Persistent Storage': true,
        'IndexedDB Backend': true,
        'LocalStorage Backend': false,
        'WebSQL Backend': false,
        'OPFS Support': false,
        'Memory Mapped Files': false,
        'Compression': false,
        'Encryption': false,
      },
      
      dataModel: {
        'JSON Documents': true,
        'Relational Tables': false,
        'Key-Value Pairs': true,
        'Graph Data': false,
        'Time Series': false,
        'Geospatial': false,
        'Binary Data': true,
        'Schema Validation': false,
        'Schema-less': true,
      },
      
      querying: {
        'SQL Support': false,
        'MongoDB-style Queries': false,
        'Full-text Search': false,
        'Regex Search': false,
        'Fuzzy Search': false,
        'GraphQL': false,
        'Aggregation Pipeline': false,
        'Map-Reduce': false,
        'Stored Procedures': false,
        'Views': false,
      },
      
      indexing: {
        'Primary Keys': true,
        'Secondary Indexes': true,
        'Compound Indexes': true,
        'Unique Indexes': true,
        'Partial Indexes': false,
        'Full-text Indexes': false,
        'Hash Indexes': false,
        'B-Tree Indexes': true,
        'GiST Indexes': false,
        'Auto-indexing': false,
      },
      
      transactions: {
        'ACID Compliance': true,
        'Multi-document Transactions': true,
        'Nested Transactions': false,
        'Savepoints': false,
        'Two-phase Commit': false,
        'Optimistic Locking': false,
        'Pessimistic Locking': false,
        'MVCC': false,
        'Isolation Levels': false,
        'Deadlock Detection': false,
      },
      
      replication: {
        'Master-Slave': false,
        'Master-Master': false,
        'Peer-to-Peer': false,
        'Cross-tab Sync': false,
        'Offline Support': true,
        'Conflict Resolution': false,
        'Change Streams': false,
        'Event Sourcing': false,
        'CRDT Support': false,
        'Sync Protocol': 'None',
      },
      
      performance: {
        'Query Optimization': false,
        'Query Caching': false,
        'Result Caching': false,
        'Connection Pooling': false,
        'Lazy Loading': false,
        'Batch Operations': true,
        'Bulk Insert': true,
        'Streaming Results': false,
        'Parallel Queries': false,
        'WebAssembly': false,
      },
      
      developer: {
        'TypeScript Support': true,
        'React Hooks': false,
        'Vue Integration': false,
        'Observable Queries': false,
        'Migrations': false,
        'Debugging Tools': true,
        'Query Builder': false,
        'ORM/ODM': false,
        'REST API': false,
        'GraphQL API': false,
      },
      
      security: {
        'Authentication': false,
        'Authorization': false,
        'Row-level Security': false,
        'Column-level Security': false,
        'Audit Logging': false,
        'Data Encryption': false,
        'SSL/TLS': false,
        'Field-level Encryption': false,
        'GDPR Compliance': false,
        'Data Masking': false,
      },
      
      // AI/LLM Integration (None - JSONIC Exclusive)
      ai: {
        'Vector Search': false,
        'OpenAI Integration': false,
        'Anthropic Integration': false,
        'Local LLM Support': false,
        'RAG Pipeline': false,
        'Agent Memory': false,
        'Embedding Generation': false,
        'Semantic Search': false,
        'AI-powered Queries': false,
        'Knowledge Graphs': false,
      },
      
      compatibility: {
        'Chrome': true,
        'Firefox': true,
        'Safari': true,
        'Edge': true,
        'Node.js': false,
        'Deno': false,
        'React Native': false,
        'Electron': true,
        'Web Workers': true,
        'Service Workers': true,
      },
      
      limitations: {
        'Max Database Size': 'Disk space',
        'Max Document Size': 'Browser limit',
        'Max Collections': 'Unlimited',
        'Max Indexes': 'Unlimited',
        'Max Connections': '1',
        'Max Query Complexity': 'Low',
        'Memory Usage': 'Low',
        'CPU Usage': 'Medium',
        'Network Overhead': 'None',
        'Browser Storage Quota': 'Yes',
      },
    },
    pros: [
      'Native browser API',
      'Large storage capacity',
      'ACID transactions',
      'Binary data support',
      'Good browser support',
      'No dependencies'
    ],
    cons: [
      'Complex API',
      'No query language',
      'Manual indexing',
      'No cross-tab sync',
      'Verbose code',
      'Callback-based API'
    ],
    bestFor: [
      'Large binary storage',
      'Simple object stores',
      'Offline caching',
      'File storage',
      'Media applications'
    ]
  },
  
  sqljs: {
    name: 'SQL.js',
    version: '1.8.0',
    type: 'Relational SQL',
    features: {
      storage: {
        'In-Memory Storage': true,
        'Persistent Storage': false,
        'IndexedDB Backend': false,
        'LocalStorage Backend': false,
        'WebSQL Backend': false,
        'OPFS Support': false,
        'Memory Mapped Files': false,
        'Compression': false,
        'Encryption': false,
      },
      
      dataModel: {
        'JSON Documents': false,
        'Relational Tables': true,
        'Key-Value Pairs': false,
        'Graph Data': false,
        'Time Series': false,
        'Geospatial': false,
        'Binary Data': true,
        'Schema Validation': true,
        'Schema-less': false,
      },
      
      querying: {
        'SQL Support': true,
        'MongoDB-style Queries': false,
        'Full-text Search': true,
        'Regex Search': true,
        'Fuzzy Search': false,
        'GraphQL': false,
        'Aggregation Pipeline': false,
        'Map-Reduce': false,
        'Stored Procedures': false,
        'Views': true,
      },
      
      indexing: {
        'Primary Keys': true,
        'Secondary Indexes': true,
        'Compound Indexes': true,
        'Unique Indexes': true,
        'Partial Indexes': true,
        'Full-text Indexes': true,
        'Hash Indexes': false,
        'B-Tree Indexes': true,
        'GiST Indexes': false,
        'Auto-indexing': false,
      },
      
      transactions: {
        'ACID Compliance': true,
        'Multi-document Transactions': true,
        'Nested Transactions': true,
        'Savepoints': true,
        'Two-phase Commit': false,
        'Optimistic Locking': false,
        'Pessimistic Locking': true,
        'MVCC': false,
        'Isolation Levels': true,
        'Deadlock Detection': true,
      },
      
      replication: {
        'Master-Slave': false,
        'Master-Master': false,
        'Peer-to-Peer': false,
        'Cross-tab Sync': false,
        'Offline Support': false,
        'Conflict Resolution': false,
        'Change Streams': false,
        'Event Sourcing': false,
        'CRDT Support': false,
        'Sync Protocol': 'None',
      },
      
      performance: {
        'Query Optimization': true,
        'Query Caching': true,
        'Result Caching': false,
        'Connection Pooling': false,
        'Lazy Loading': false,
        'Batch Operations': true,
        'Bulk Insert': true,
        'Streaming Results': false,
        'Parallel Queries': false,
        'WebAssembly': true,
      },
      
      developer: {
        'TypeScript Support': true,
        'React Hooks': false,
        'Vue Integration': false,
        'Observable Queries': false,
        'Migrations': true,
        'Debugging Tools': true,
        'Query Builder': false,
        'ORM/ODM': false,
        'REST API': false,
        'GraphQL API': false,
      },
      
      security: {
        'Authentication': false,
        'Authorization': false,
        'Row-level Security': false,
        'Column-level Security': false,
        'Audit Logging': false,
        'Data Encryption': false,
        'SSL/TLS': false,
        'Field-level Encryption': false,
        'GDPR Compliance': false,
        'Data Masking': false,
      },
      
      // AI/LLM Integration (None - JSONIC Exclusive)
      ai: {
        'Vector Search': false,
        'OpenAI Integration': false,
        'Anthropic Integration': false,
        'Local LLM Support': false,
        'RAG Pipeline': false,
        'Agent Memory': false,
        'Embedding Generation': false,
        'Semantic Search': false,
        'AI-powered Queries': false,
        'Knowledge Graphs': false,
      },
      
      compatibility: {
        'Chrome': true,
        'Firefox': true,
        'Safari': true,
        'Edge': true,
        'Node.js': true,
        'Deno': false,
        'React Native': false,
        'Electron': true,
        'Web Workers': true,
        'Service Workers': true,
      },
      
      limitations: {
        'Max Database Size': 'Memory limit',
        'Max Document Size': 'N/A',
        'Max Collections': 'Unlimited',
        'Max Indexes': 'Unlimited',
        'Max Connections': '1',
        'Max Query Complexity': 'High',
        'Memory Usage': 'High',
        'CPU Usage': 'Medium',
        'Network Overhead': 'None',
        'Browser Storage Quota': 'No',
      },
    },
    pros: [
      'Full SQLite compatibility',
      'Complex SQL queries',
      'ACID transactions',
      'Window functions',
      'CTEs support',
      'Triggers and views'
    ],
    cons: [
      'In-memory only',
      'Large WASM size (1MB+)',
      'No persistence',
      'High memory usage',
      'Single connection'
    ],
    bestFor: [
      'Complex SQL queries',
      'Data analysis',
      'Reporting tools',
      'Migration from SQLite',
      'Temporary calculations'
    ]
  },
  
  localstorage: {
    name: 'LocalStorage',
    version: '1.0',
    type: 'Key-Value Store',
    features: {
      storage: {
        'In-Memory Storage': false,
        'Persistent Storage': true,
        'IndexedDB Backend': false,
        'LocalStorage Backend': true,
        'WebSQL Backend': false,
        'OPFS Support': false,
        'Memory Mapped Files': false,
        'Compression': false,
        'Encryption': false,
      },
      
      dataModel: {
        'JSON Documents': true,
        'Relational Tables': false,
        'Key-Value Pairs': true,
        'Graph Data': false,
        'Time Series': false,
        'Geospatial': false,
        'Binary Data': false,
        'Schema Validation': false,
        'Schema-less': true,
      },
      
      querying: {
        'SQL Support': false,
        'MongoDB-style Queries': false,
        'Full-text Search': false,
        'Regex Search': false,
        'Fuzzy Search': false,
        'GraphQL': false,
        'Aggregation Pipeline': false,
        'Map-Reduce': false,
        'Stored Procedures': false,
        'Views': false,
      },
      
      indexing: {
        'Primary Keys': true,
        'Secondary Indexes': false,
        'Compound Indexes': false,
        'Unique Indexes': false,
        'Partial Indexes': false,
        'Full-text Indexes': false,
        'Hash Indexes': false,
        'B-Tree Indexes': false,
        'GiST Indexes': false,
        'Auto-indexing': false,
      },
      
      transactions: {
        'ACID Compliance': false,
        'Multi-document Transactions': false,
        'Nested Transactions': false,
        'Savepoints': false,
        'Two-phase Commit': false,
        'Optimistic Locking': false,
        'Pessimistic Locking': false,
        'MVCC': false,
        'Isolation Levels': false,
        'Deadlock Detection': false,
      },
      
      replication: {
        'Master-Slave': false,
        'Master-Master': false,
        'Peer-to-Peer': false,
        'Cross-tab Sync': true,
        'Offline Support': true,
        'Conflict Resolution': false,
        'Change Streams': true,
        'Event Sourcing': false,
        'CRDT Support': false,
        'Sync Protocol': 'Storage events',
      },
      
      performance: {
        'Query Optimization': false,
        'Query Caching': false,
        'Result Caching': false,
        'Connection Pooling': false,
        'Lazy Loading': false,
        'Batch Operations': false,
        'Bulk Insert': false,
        'Streaming Results': false,
        'Parallel Queries': false,
        'WebAssembly': false,
      },
      
      developer: {
        'TypeScript Support': true,
        'React Hooks': false,
        'Vue Integration': false,
        'Observable Queries': false,
        'Migrations': false,
        'Debugging Tools': true,
        'Query Builder': false,
        'ORM/ODM': false,
        'REST API': false,
        'GraphQL API': false,
      },
      
      security: {
        'Authentication': false,
        'Authorization': false,
        'Row-level Security': false,
        'Column-level Security': false,
        'Audit Logging': false,
        'Data Encryption': false,
        'SSL/TLS': false,
        'Field-level Encryption': false,
        'GDPR Compliance': false,
        'Data Masking': false,
      },
      
      // AI/LLM Integration (None - JSONIC Exclusive)
      ai: {
        'Vector Search': false,
        'OpenAI Integration': false,
        'Anthropic Integration': false,
        'Local LLM Support': false,
        'RAG Pipeline': false,
        'Agent Memory': false,
        'Embedding Generation': false,
        'Semantic Search': false,
        'AI-powered Queries': false,
        'Knowledge Graphs': false,
      },
      
      compatibility: {
        'Chrome': true,
        'Firefox': true,
        'Safari': true,
        'Edge': true,
        'Node.js': false,
        'Deno': false,
        'React Native': false,
        'Electron': true,
        'Web Workers': false,
        'Service Workers': false,
      },
      
      limitations: {
        'Max Database Size': '5-10MB',
        'Max Document Size': '5MB',
        'Max Collections': '1',
        'Max Indexes': '0',
        'Max Connections': 'N/A',
        'Max Query Complexity': 'None',
        'Memory Usage': 'Low',
        'CPU Usage': 'Low',
        'Network Overhead': 'None',
        'Browser Storage Quota': 'Yes',
      },
    },
    pros: [
      'Extremely simple API',
      'Synchronous operations',
      'Cross-tab events',
      'Universal support',
      'No dependencies',
      'Instant reads'
    ],
    cons: [
      '5-10MB limit',
      'Strings only',
      'No querying',
      'No transactions',
      'Blocking I/O',
      'No structure'
    ],
    bestFor: [
      'User preferences',
      'Small config data',
      'Session storage',
      'Simple caching',
      'Quick prototypes'
    ]
  }
};

/**
 * Get feature comparison for specific category
 */
export function getFeatureComparison(category) {
  const comparison = {};
  
  for (const [db, info] of Object.entries(FEATURE_MATRIX)) {
    if (info.features[category]) {
      comparison[db] = info.features[category];
    }
  }
  
  return comparison;
}

/**
 * Calculate feature scores (excluding features with zero support across all databases)
 */
export function calculateFeatureScores() {
  const databases = Object.keys(FEATURE_MATRIX);
  const allFeatures = {};
  
  // Collect all features and their support across databases
  for (const [dbName, dbInfo] of Object.entries(FEATURE_MATRIX)) {
    for (const [category, features] of Object.entries(dbInfo.features)) {
      if (!allFeatures[category]) allFeatures[category] = {};
      for (const [feature, support] of Object.entries(features)) {
        if (typeof support === 'boolean') {
          if (!allFeatures[category][feature]) {
            allFeatures[category][feature] = {};
          }
          allFeatures[category][feature][dbName] = support;
        }
      }
    }
  }
  
  // Identify meaningful features (at least one database supports it)
  const meaningfulFeatures = [];
  for (const [category, features] of Object.entries(allFeatures)) {
    for (const [feature, support] of Object.entries(features)) {
      const supportCount = Object.values(support).filter(s => s === true).length;
      if (supportCount > 0) {
        meaningfulFeatures.push({ category, feature });
      }
    }
  }
  
  // Calculate scores based only on meaningful features
  const scores = {};
  for (const [db, info] of Object.entries(FEATURE_MATRIX)) {
    let supportedFeatures = 0;
    
    for (const { category, feature } of meaningfulFeatures) {
      if (info.features[category] && info.features[category][feature] === true) {
        supportedFeatures++;
      }
    }
    
    scores[db] = {
      supported: supportedFeatures,
      total: meaningfulFeatures.length,
      percentage: Math.round((supportedFeatures / meaningfulFeatures.length) * 100),
      excluded: getTotalFeatures(info) - meaningfulFeatures.length // How many non-differentiating features were excluded
    };
  }
  
  return scores;
}

/**
 * Get total feature count including non-differentiating ones
 */
function getTotalFeatures(dbInfo) {
  let total = 0;
  for (const category of Object.values(dbInfo.features)) {
    for (const [feature, supported] of Object.entries(category)) {
      if (typeof supported === 'boolean') {
        total++;
      }
    }
  }
  return total;
}

/**
 * Get list of non-differentiating features (excluded from scoring)
 */
export function getNonDifferentiatingFeatures() {
  const databases = Object.keys(FEATURE_MATRIX);
  const allFeatures = {};
  
  // Collect all features
  for (const [dbName, dbInfo] of Object.entries(FEATURE_MATRIX)) {
    for (const [category, features] of Object.entries(dbInfo.features)) {
      if (!allFeatures[category]) allFeatures[category] = {};
      for (const [feature, support] of Object.entries(features)) {
        if (typeof support === 'boolean') {
          if (!allFeatures[category][feature]) {
            allFeatures[category][feature] = {};
          }
          allFeatures[category][feature][dbName] = support;
        }
      }
    }
  }
  
  // Find features with zero support
  const excluded = [];
  for (const [category, features] of Object.entries(allFeatures)) {
    for (const [feature, support] of Object.entries(features)) {
      const supportCount = Object.values(support).filter(s => s === true).length;
      if (supportCount === 0) {
        excluded.push({ category, feature });
      }
    }
  }
  
  return excluded;
}

/**
 * Get recommendations based on use case
 */
export function getRecommendation(useCase) {
  const recommendations = {
    'complex-queries': ['jsonic', 'sqljs'],
    'large-storage': ['indexeddb', 'jsonic'],
    'simple-storage': ['localstorage'],
    'offline-first': ['jsonic', 'indexeddb'],
    'real-time': ['jsonic'], // JSONIC exclusive (WebSocket/WebRTC)
    'sql-required': ['jsonic', 'sqljs'], // JSONIC now has full SQL
    'mongodb-queries': ['jsonic'], // JSONIC exclusive
    'dual-syntax': ['jsonic'], // JSONIC exclusive (MongoDB + SQL)
    'no-dependencies': ['localstorage', 'indexeddb'],
    'transactions': ['jsonic', 'indexeddb', 'sqljs'],
    'cross-tab': ['jsonic', 'localstorage'], // JSONIC now supports this
    'binary-data': ['indexeddb', 'jsonic', 'sqljs'],
    'ai-integration': ['jsonic'], // JSONIC exclusive
    'vector-search': ['jsonic'], // JSONIC exclusive
    'reactive-views': ['jsonic'], // JSONIC exclusive
    'web-assembly': ['jsonic', 'sqljs'],
    'typescript-first': ['jsonic'], // Best TypeScript support
    'framework-integration': ['jsonic'], // React hooks + Vue composables
    'collaborative-apps': ['jsonic'], // Real-time sync + conflict resolution
    'pwa-development': ['jsonic'], // Offline-first + cross-tab sync
    'enterprise-apps': ['jsonic', 'sqljs'], // ACID + security features
  };
  
  return recommendations[useCase] || ['jsonic'];
}