const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS with proper configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow any origin in development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// SQLite database path - adjust this to your actual database location
const DB_PATH = path.resolve(__dirname, '../benchmark_history.db');

// Open database connection
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.log('Attempting to create/open database at:', DB_PATH);
  } else {
    console.log('Connected to the SQLite database at:', DB_PATH);
  }
});

// API Routes

// Get all benchmark runs
app.get('/api/benchmark/runs', (req, res) => {
  const query = `
    SELECT * FROM benchmark_runs 
    ORDER BY timestamp DESC 
    LIMIT 100
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get model performance for a specific run or latest
app.get('/api/benchmark/performance/:runId?', (req, res) => {
  const { runId } = req.params;
  
  let query;
  let params = [];
  
  if (runId && runId !== 'latest') {
    query = `
      SELECT * FROM model_performance 
      WHERE run_id = ? 
      ORDER BY provider, model
    `;
    params = [runId];
  } else {
    query = `
      SELECT * FROM model_performance 
      WHERE run_id = (
        SELECT run_id FROM benchmark_runs 
        ORDER BY timestamp DESC 
        LIMIT 1
      )
      ORDER BY provider, model
    `;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get test results for a specific run
app.get('/api/benchmark/results/:runId', (req, res) => {
  const { runId } = req.params;
  
  const query = `
    SELECT * FROM test_results 
    WHERE run_id = ? 
    ORDER BY timestamp DESC
    LIMIT 500
  `;
  
  db.all(query, [runId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get performance trends
app.get('/api/benchmark/trends', (req, res) => {
  const query = `
    SELECT * FROM performance_trends 
    WHERE recorded_at >= datetime('now', '-7 days')
    ORDER BY recorded_at DESC
    LIMIT 100
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get category performance
app.get('/api/benchmark/categories/:runId?', (req, res) => {
  const { runId } = req.params;
  
  let query;
  let params = [];
  
  if (runId && runId !== 'latest') {
    query = `
      SELECT 
        category,
        provider,
        model,
        AVG(time_to_first_token_ms) as avg_ttft_ms,
        AVG(total_time_ms) as avg_total_time_ms,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        COUNT(*) as total_tests
      FROM test_results
      WHERE run_id = ?
      GROUP BY category, provider, model
      ORDER BY category, provider, model
    `;
    params = [runId];
  } else {
    query = `
      SELECT 
        category,
        provider,
        model,
        AVG(time_to_first_token_ms) as avg_ttft_ms,
        AVG(total_time_ms) as avg_total_time_ms,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        COUNT(*) as total_tests
      FROM test_results
      WHERE run_id = (
        SELECT run_id FROM benchmark_runs 
        ORDER BY timestamp DESC 
        LIMIT 1
      )
      GROUP BY category, provider, model
      ORDER BY category, provider, model
    `;
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get summary statistics
app.get('/api/benchmark/stats', (req, res) => {
  const queries = {
    totalRuns: `SELECT COUNT(*) as count FROM benchmark_runs`,
    totalTests: `SELECT SUM(total_runs) as count FROM benchmark_runs`,
    avgSuccessRate: `
      SELECT AVG(successful_runs * 100.0 / total_runs) as rate 
      FROM benchmark_runs
    `,
    modelCount: `SELECT COUNT(DISTINCT provider || '/' || model) as count FROM model_performance`,
    latestRun: `SELECT * FROM benchmark_runs ORDER BY timestamp DESC LIMIT 1`
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [], (err, row) => {
      if (!err) {
        results[key] = row;
      }
      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: DB_PATH });
});

// Start server on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on http://0.0.0.0:${PORT}`);
  console.log(`Available at: http://localhost:${PORT} and http://<your-ip>:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});