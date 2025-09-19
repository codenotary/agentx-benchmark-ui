#!/bin/bash

# Update SQLite database for GitHub Pages deployment

echo "Updating benchmark database for static deployment..."

# Check if database exists locally
if [ -f "../benchmark_history.db" ]; then
    # Copy from parent directory (when in agentx repo)
    cp ../benchmark_history.db public/benchmark.db
elif [ -f "benchmark_history.db" ]; then
    # Copy from current directory (standalone)
    cp benchmark_history.db public/benchmark.db
elif [ -f "public/benchmark.db" ]; then
    echo "Using existing public/benchmark.db"
else
    echo "Warning: No benchmark database found. Please provide benchmark_history.db"
    echo "You can:"
    echo "1. Copy benchmark_history.db from AgentX repo"
    echo "2. Download it from a benchmark run"
    echo "3. Use the sample database (if provided)"
    exit 1
fi

# Optimize database for read-only access
if command -v sqlite3 &> /dev/null; then
    sqlite3 public/benchmark.db << SQL
VACUUM;
ANALYZE;
SQL
fi

# Get file size
SIZE=$(ls -lh public/benchmark.db | awk '{print $5}')
DB_SIZE=$SIZE
echo "Database updated: public/benchmark.db (${DB_SIZE})"

# Generate metadata
if command -v sqlite3 &> /dev/null; then
    sqlite3 public/benchmark.db << SQL > public/db-info.json
.mode json
SELECT 
  COUNT(*) as total_runs,
  MAX(timestamp) as latest_run,
  (SELECT COUNT(DISTINCT provider || '/' || model) FROM model_performance) as model_count
FROM benchmark_runs;
SQL
    echo "Database metadata generated: public/db-info.json"
fi

# Generate metadata for HTTP VFS
node scripts/split-db.js

# Convert database to JSON for static serving
echo "Converting database to JSON..."
node scripts/db-to-json.js

echo "Ready for deployment!"
