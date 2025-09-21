/**
 * Feature comparison matrix for database adapters
 */

export const FEATURE_MATRIX = {
  jsonic: {
    name: 'JSONIC',
    version: '1.0.0',
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
        'Encryption': false,
      },
      
      // Data Model
      dataModel: {
        'JSON Documents': true,
        'Relational Tables': true,
        'Key-Value Pairs': true,
        'Graph Data': false,
        'Time Series': false,
        'Geospatial': false,
        'Binary Data': true,
        'Schema Validation': true,
        'Schema-less': true,
      },
      
      // Query Capabilities
      querying: {
        'SQL Support': true,
        'MongoDB-style Queries': true,
        'Full-text Search': true,
        'Regex Search': true,
        'Fuzzy Search': false,
        'GraphQL': false,
        'Aggregation Pipeline': true,
        'Map-Reduce': false,
        'Stored Procedures': false,
        'Views': true,
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
        'Master-Slave': false,
        'Master-Master': false,
        'Peer-to-Peer': true,
        'Cross-tab Sync': true,
        'Offline Support': true,
        'Conflict Resolution': true,
        'Change Streams': true,
        'Event Sourcing': false,
        'CRDT Support': false,
        'Sync Protocol': 'WebSocket',
      },
      
      // Performance
      performance: {
        'Query Optimization': true,
        'Query Caching': true,
        'Result Caching': true,
        'Connection Pooling': false,
        'Lazy Loading': true,
        'Batch Operations': true,
        'Bulk Insert': true,
        'Streaming Results': true,
        'Parallel Queries': true,
        'WebAssembly': true,
      },
      
      // Developer Experience
      developer: {
        'TypeScript Support': true,
        'React Hooks': true,
        'Vue Integration': true,
        'Observable Queries': true,
        'Migrations': true,
        'Debugging Tools': true,
        'Query Builder': true,
        'ORM/ODM': true,
        'REST API': false,
        'GraphQL API': false,
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
      
      // Compatibility
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
      'WebAssembly performance',
      'SQL and NoSQL support',
      'ACID transactions',
      'Rich query language',
      'Cross-tab synchronization',
      'TypeScript-first design',
      'Reactive queries',
      'MVCC concurrency control'
    ],
    cons: [
      'Browser-only (no Node.js)',
      '2GB practical limit',
      'No built-in auth',
      'Young ecosystem',
      'Limited community'
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
 * Calculate feature scores
 */
export function calculateFeatureScores() {
  const scores = {};
  
  for (const [db, info] of Object.entries(FEATURE_MATRIX)) {
    let totalFeatures = 0;
    let supportedFeatures = 0;
    
    for (const category of Object.values(info.features)) {
      for (const [feature, supported] of Object.entries(category)) {
        if (typeof supported === 'boolean') {
          totalFeatures++;
          if (supported) supportedFeatures++;
        }
      }
    }
    
    scores[db] = {
      supported: supportedFeatures,
      total: totalFeatures,
      percentage: Math.round((supportedFeatures / totalFeatures) * 100)
    };
  }
  
  return scores;
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
    'real-time': ['jsonic'],
    'sql-required': ['jsonic', 'sqljs'],
    'no-dependencies': ['localstorage', 'indexeddb'],
    'transactions': ['jsonic', 'indexeddb', 'sqljs'],
    'cross-tab': ['jsonic', 'localstorage'],
    'binary-data': ['indexeddb', 'jsonic', 'sqljs']
  };
  
  return recommendations[useCase] || ['jsonic'];
}