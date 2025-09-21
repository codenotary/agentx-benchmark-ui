#!/usr/bin/env node

/**
 * Universal Benchmark Server
 * Provides multiple interfaces for running JSONIC benchmarks
 * - REST API
 * - WebSocket
 * - GraphQL
 * - gRPC
 * - Server-Sent Events (SSE)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { BenchmarkRunner } from './src/runner.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store for active benchmark sessions
const sessions = new Map();

// =============================================================================
// REST API
// =============================================================================

/**
 * GET /api/status
 * Get server status and available endpoints
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ready',
    version: '1.0.0',
    endpoints: {
      rest: `http://localhost:${PORT}/api`,
      websocket: `ws://localhost:${PORT}`,
      graphql: `http://localhost:${PORT}/graphql`,
      grpc: `localhost:${PORT + 1}`,
      sse: `http://localhost:${PORT}/api/benchmark/stream`
    },
    availableDatabases: ['jsonic', 'indexeddb', 'sqljs', 'localstorage'],
    availableScenarios: ['insert', 'query', 'update', 'delete', 'aggregate', 'transaction', 'memory']
  });
});

/**
 * POST /api/benchmark/run
 * Run benchmarks with configuration
 */
app.post('/api/benchmark/run', async (req, res) => {
  try {
    const config = {
      dataSize: req.body.dataSize || 'medium',
      iterations: req.body.iterations || 3,
      warmup: req.body.warmup || 1,
      adapters: req.body.adapters || ['jsonic', 'indexeddb'],
      scenarios: req.body.scenarios || ['insert', 'query'],
      ...req.body
    };

    const runner = new BenchmarkRunner(config);
    const results = await runner.run();

    res.json({
      success: true,
      results,
      summary: generateSummary(results)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/benchmark/results/:id
 * Get benchmark results by ID
 */
app.get('/api/benchmark/results/:id', async (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    results: session.results,
    status: session.status
  });
});

/**
 * GET /api/benchmark/history
 * Get historical benchmark results
 */
app.get('/api/benchmark/history', async (req, res) => {
  try {
    const resultsDir = path.join(__dirname, 'results');
    const files = await fs.readdir(resultsDir);
    const history = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(resultsDir, file), 'utf-8');
        history.push(JSON.parse(content));
      }
    }

    res.json({
      success: true,
      history: history.sort((a, b) => 
        new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/benchmark/compare
 * Compare multiple benchmark runs
 */
app.post('/api/benchmark/compare', async (req, res) => {
  try {
    const { runs } = req.body;
    const comparison = compareRuns(runs);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// Server-Sent Events (SSE)
// =============================================================================

/**
 * GET /api/benchmark/stream
 * Stream benchmark progress in real-time
 */
app.get('/api/benchmark/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const config = {
    dataSize: req.query.dataSize || 'medium',
    iterations: parseInt(req.query.iterations) || 3,
    warmup: parseInt(req.query.warmup) || 1,
    adapters: req.query.adapters?.split(',') || ['jsonic', 'indexeddb'],
    scenarios: req.query.scenarios?.split(',') || ['insert', 'query']
  };

  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    status: 'running',
    results: null
  };
  sessions.set(sessionId, session);

  // Send initial event
  res.write(`data: ${JSON.stringify({ 
    event: 'start', 
    sessionId,
    config 
  })}\n\n`);

  try {
    const runner = new BenchmarkRunner(config);
    
    // Mock progress events (in real implementation, runner would emit events)
    const scenarios = config.scenarios;
    const adapters = config.adapters;
    let completed = 0;
    const total = scenarios.length * adapters.length;

    for (const scenario of scenarios) {
      for (const adapter of adapters) {
        res.write(`data: ${JSON.stringify({
          event: 'progress',
          scenario,
          adapter,
          progress: (++completed / total) * 100
        })}\n\n`);
      }
    }

    const results = await runner.run();
    session.results = results;
    session.status = 'completed';

    res.write(`data: ${JSON.stringify({
      event: 'complete',
      results,
      summary: generateSummary(results)
    })}\n\n`);
  } catch (error) {
    session.status = 'error';
    res.write(`data: ${JSON.stringify({
      event: 'error',
      error: error.message
    })}\n\n`);
  }

  res.end();
});

// =============================================================================
// WebSocket Interface
// =============================================================================

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.action) {
        case 'run':
          await handleWebSocketRun(ws, data.config);
          break;
        
        case 'status':
          ws.send(JSON.stringify({
            type: 'status',
            sessions: Array.from(sessions.values())
          }));
          break;
        
        case 'cancel':
          handleWebSocketCancel(ws, data.sessionId);
          break;
        
        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Unknown action'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

async function handleWebSocketRun(ws, config) {
  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    status: 'running',
    results: null,
    ws
  };
  sessions.set(sessionId, session);

  ws.send(JSON.stringify({
    type: 'started',
    sessionId,
    config
  }));

  try {
    const runner = new BenchmarkRunner(config || {});
    
    // Send progress updates
    const interval = setInterval(() => {
      if (session.status !== 'running') {
        clearInterval(interval);
        return;
      }
      
      ws.send(JSON.stringify({
        type: 'progress',
        sessionId,
        message: 'Benchmark in progress...'
      }));
    }, 1000);

    const results = await runner.run();
    clearInterval(interval);
    
    session.results = results;
    session.status = 'completed';

    ws.send(JSON.stringify({
      type: 'complete',
      sessionId,
      results,
      summary: generateSummary(results)
    }));
  } catch (error) {
    session.status = 'error';
    ws.send(JSON.stringify({
      type: 'error',
      sessionId,
      error: error.message
    }));
  }
}

function handleWebSocketCancel(ws, sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'cancelled';
    ws.send(JSON.stringify({
      type: 'cancelled',
      sessionId
    }));
  }
}

// =============================================================================
// GraphQL Interface
// =============================================================================

const graphqlSchema = buildSchema(`
  type Query {
    status: Status!
    benchmarkResults(id: String!): BenchmarkSession
    benchmarkHistory(limit: Int): [BenchmarkResult!]!
    availableDatabases: [String!]!
    availableScenarios: [String!]!
  }

  type Mutation {
    runBenchmark(config: BenchmarkConfig!): BenchmarkResult!
    compareBenchmarks(ids: [String!]!): ComparisonResult!
  }

  type Subscription {
    benchmarkProgress(sessionId: String!): ProgressUpdate!
  }

  type Status {
    ready: Boolean!
    version: String!
    activeSessions: Int!
  }

  type BenchmarkSession {
    id: String!
    status: String!
    results: BenchmarkResult
  }

  type BenchmarkResult {
    metadata: Metadata!
    tests: JSON!
    summary: Summary!
  }

  type Metadata {
    timestamp: String!
    platform: JSON!
    config: JSON!
  }

  type Summary {
    winner: String!
    rankings: [Ranking!]!
  }

  type Ranking {
    database: String!
    score: Float!
    relative: Float!
  }

  type ComparisonResult {
    databases: [String!]!
    scenarios: [String!]!
    comparison: JSON!
  }

  type ProgressUpdate {
    sessionId: String!
    status: String!
    progress: Float!
    message: String
  }

  input BenchmarkConfig {
    dataSize: String
    iterations: Int
    warmup: Int
    adapters: [String!]
    scenarios: [String!]
  }

  scalar JSON
`);

const graphqlRoot = {
  status: () => ({
    ready: true,
    version: '1.0.0',
    activeSessions: sessions.size
  }),

  benchmarkResults: ({ id }) => {
    const session = sessions.get(id);
    return session || null;
  },

  benchmarkHistory: async ({ limit = 10 }) => {
    const resultsDir = path.join(__dirname, 'results');
    const files = await fs.readdir(resultsDir);
    const history = [];

    for (const file of files.slice(0, limit)) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(resultsDir, file), 'utf-8');
        history.push(JSON.parse(content));
      }
    }

    return history;
  },

  availableDatabases: () => ['jsonic', 'indexeddb', 'sqljs', 'localstorage'],
  availableScenarios: () => ['insert', 'query', 'update', 'delete', 'aggregate', 'transaction', 'memory'],

  runBenchmark: async ({ config }) => {
    const runner = new BenchmarkRunner(config);
    const results = await runner.run();
    return {
      ...results,
      summary: generateSummary(results)
    };
  },

  compareBenchmarks: async ({ ids }) => {
    const runs = ids.map(id => sessions.get(id)?.results).filter(Boolean);
    return compareRuns(runs);
  }
};

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlRoot,
  graphiql: true
}));

// =============================================================================
// gRPC Interface
// =============================================================================

const PROTO_PATH = path.join(__dirname, 'benchmark.proto');

// Create proto file
const protoContent = `
syntax = "proto3";

package benchmark;

service BenchmarkService {
  rpc RunBenchmark (BenchmarkRequest) returns (BenchmarkResponse);
  rpc StreamBenchmark (BenchmarkRequest) returns (stream ProgressUpdate);
  rpc GetResults (ResultsRequest) returns (BenchmarkResponse);
  rpc GetStatus (Empty) returns (StatusResponse);
}

message Empty {}

message BenchmarkRequest {
  string dataSize = 1;
  int32 iterations = 2;
  int32 warmup = 3;
  repeated string adapters = 4;
  repeated string scenarios = 5;
}

message BenchmarkResponse {
  bool success = 1;
  string results = 2;
  string error = 3;
}

message ProgressUpdate {
  string sessionId = 1;
  string status = 2;
  float progress = 3;
  string message = 4;
}

message ResultsRequest {
  string sessionId = 1;
}

message StatusResponse {
  bool ready = 1;
  string version = 2;
  int32 activeSessions = 3;
}
`;

await fs.writeFile(PROTO_PATH, protoContent);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const benchmarkProto = grpc.loadPackageDefinition(packageDefinition).benchmark;

const grpcServer = new grpc.Server();

grpcServer.addService(benchmarkProto.BenchmarkService.service, {
  RunBenchmark: async (call, callback) => {
    try {
      const config = call.request;
      const runner = new BenchmarkRunner(config);
      const results = await runner.run();
      
      callback(null, {
        success: true,
        results: JSON.stringify(results)
      });
    } catch (error) {
      callback(null, {
        success: false,
        error: error.message
      });
    }
  },

  StreamBenchmark: async (call) => {
    const config = call.request;
    const sessionId = generateSessionId();
    
    call.write({
      sessionId,
      status: 'started',
      progress: 0,
      message: 'Benchmark started'
    });

    try {
      const runner = new BenchmarkRunner(config);
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        call.write({
          sessionId,
          status: 'running',
          progress: i,
          message: `Progress: ${i}%`
        });
        await new Promise(r => setTimeout(r, 100));
      }

      const results = await runner.run();
      
      call.write({
        sessionId,
        status: 'completed',
        progress: 100,
        message: JSON.stringify(results)
      });
      
      call.end();
    } catch (error) {
      call.write({
        sessionId,
        status: 'error',
        progress: 0,
        message: error.message
      });
      call.end();
    }
  },

  GetResults: (call, callback) => {
    const session = sessions.get(call.request.sessionId);
    if (session) {
      callback(null, {
        success: true,
        results: JSON.stringify(session.results)
      });
    } else {
      callback(null, {
        success: false,
        error: 'Session not found'
      });
    }
  },

  GetStatus: (call, callback) => {
    callback(null, {
      ready: true,
      version: '1.0.0',
      activeSessions: sessions.size
    });
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateSummary(results) {
  const rankings = {};
  
  for (const [testName, testResults] of Object.entries(results.tests)) {
    const sorted = Object.entries(testResults)
      .filter(([_, r]) => r.stats)
      .sort((a, b) => a[1].stats.mean - b[1].stats.mean);
    
    if (sorted.length > 0) {
      rankings[testName] = sorted.map(([db, result], index) => ({
        database: db,
        rank: index + 1,
        mean: result.stats.mean,
        relative: (sorted[0][1].stats.mean / result.stats.mean)
      }));
    }
  }
  
  // Calculate overall winner
  const scores = {};
  for (const test of Object.values(rankings)) {
    for (const entry of test) {
      scores[entry.database] = (scores[entry.database] || 0) + (test.length - entry.rank + 1);
    }
  }
  
  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  
  return {
    winner: winner ? winner[0] : 'unknown',
    rankings,
    scores
  };
}

function compareRuns(runs) {
  const comparison = {
    databases: new Set(),
    scenarios: new Set(),
    results: {}
  };
  
  for (const run of runs) {
    for (const [test, results] of Object.entries(run.tests)) {
      comparison.scenarios.add(test);
      
      for (const [db, result] of Object.entries(results)) {
        comparison.databases.add(db);
        
        if (!comparison.results[test]) {
          comparison.results[test] = {};
        }
        
        if (!comparison.results[test][db]) {
          comparison.results[test][db] = [];
        }
        
        comparison.results[test][db].push(result.stats.mean);
      }
    }
  }
  
  return {
    databases: Array.from(comparison.databases),
    scenarios: Array.from(comparison.scenarios),
    comparison: comparison.results
  };
}

// =============================================================================
// Server Startup
// =============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         JSONIC Universal Benchmark Server              ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  REST API:     http://localhost:${PORT}/api              ║
║  WebSocket:    ws://localhost:${PORT}                    ║
║  GraphQL:      http://localhost:${PORT}/graphql          ║
║  gRPC:         localhost:${PORT + 1}                     ║
║  SSE:          http://localhost:${PORT}/api/benchmark/stream ║
║  Web UI:       http://localhost:${PORT}                  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

Ready to benchmark! 🚀
  `);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Start gRPC server
grpcServer.bindAsync(
  `0.0.0.0:${PORT + 1}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    grpcServer.start();
    console.log(`gRPC server running on port ${PORT + 1}`);
  }
);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  server.close();
  grpcServer.forceShutdown();
  process.exit(0);
});

export { server, wss, grpcServer };