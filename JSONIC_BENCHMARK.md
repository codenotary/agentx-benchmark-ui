# JSONIC Benchmark Integration

The AgentX Benchmark UI now includes integrated JSONIC performance benchmarks, accessible at `/jsonic-bench`.

## Features

### Performance Benchmarks
- Compare JSONIC with IndexedDB, SQL.js, and LocalStorage
- Test different dataset sizes (1K, 10K, 100K documents)
- Measure operations: Insert, Query, Update, Delete, Aggregate, Transactions
- Memory usage analysis
- Real-time progress tracking

### Feature Comparison Matrix
- Side-by-side feature comparison of browser storage solutions
- Query capabilities analysis
- Storage limits and performance characteristics
- API complexity comparison

### Smart Recommendations
- Use-case based database recommendations
- Decision guide for selecting the right storage solution
- Pros and cons analysis for each database

## Access

From the main dashboard, click the **"JSONIC Benchmarks"** button in the header to access the benchmark suite.

Direct URL: `https://[your-domain]/agentx-benchmark-ui/jsonic-bench`

## Running Benchmarks

1. Select dataset size (Small/Medium/Large)
2. Choose databases to compare
3. Select test scenarios
4. Click "Run Benchmarks"
5. View real-time results and export in JSON/CSV/Markdown formats

## Technical Integration

The benchmark suite is integrated as:
- Standalone HTML/JS files in `/public/jsonic-bench/`
- React Router route at `/jsonic-bench`
- Iframe-based integration for isolation
- Automatic copying to dist during build

## Build Process

The benchmark files are automatically included in production builds:
```bash
npm run build  # Includes jsonic-bench directory
```

Files are served from the same GitHub Pages deployment as the main app.