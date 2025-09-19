# AgentX Benchmark UI

A standalone benchmark dashboard for [AgentX](https://github.com/codenotary/agentx) - visualizing and comparing performance metrics across multiple LLM providers (OpenAI, Anthropic, Google Gemini, Ollama).

🌐 **[View Live Dashboard](https://codenotary.github.io/agentx-benchmark-ui/)**

## Features

- 📊 **Real-time Performance Metrics**: TTFT, throughput, success rates
- 📈 **Historical Trend Analysis**: Track performance over time
- 💰 **Cost Comparison**: Compare pricing across providers
- 🎯 **Category Breakdown**: Performance by task type (math, coding, reasoning)
- 🚀 **Static Deployment**: Runs entirely in browser with SQL.js
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

### Option 1: Use Hosted Version
Visit the live dashboard at: https://codenotary.github.io/agentx-benchmark-ui/

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/codenotary/agentx-benchmark-ui.git
cd agentx-benchmark-ui

# Install dependencies
npm install

# Run development server
npm run dev:static

# Open http://localhost:5173
```

## Updating Benchmark Data

### From AgentX Repository

If you have AgentX running benchmarks:

```bash
# Copy latest benchmark database from AgentX
cp ../agentx/benchmark_history.db .

# Update and optimize for web
npm run update-db

# Deploy to GitHub Pages
npm run deploy
```

### Manual Database Upload

1. Place your `benchmark_history.db` file in the root directory
2. Run `npm run update-db`
3. Deploy with `npm run deploy`

## GitHub Pages Deployment

### Initial Setup

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages
   - Path: / (root)

3. **Update configuration**:
   ```bash
   # Edit package.json and vite.config.ts
   # Replace codenotary with your GitHub username
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

Your dashboard will be available at: `https://codenotary.github.io/agentx-benchmark-ui/`

### Automated Updates with GitHub Actions

Create `.github/workflows/update-dashboard.yml`:

```yaml
name: Update Dashboard

on:
  workflow_dispatch:
    inputs:
      database_url:
        description: 'URL to benchmark_history.db file'
        required: false
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Download database (if URL provided)
        if: github.event.inputs.database_url
        run: |
          wget -O benchmark_history.db "${{ github.event.inputs.database_url }}"
          
      - name: Update and deploy
        run: |
          npm run update-db
          npm run build:static
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Tailwind CSS + Recharts
- **Database**: SQLite via SQL.js-httpvfs
- **Deployment**: GitHub Pages (static hosting)

## Architecture

```
┌─────────────────┐
│  GitHub Pages   │
│   (Static CDN)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  React  │
    │   SPA   │
    └────┬────┘
         │
    ┌────▼────────┐
    │  SQL.js     │
    │  Web Worker │
    └────┬────────┘
         │
    ┌────▼────────┐
    │ benchmark.db │
    │   (96KB)     │
    └─────────────┘
```

## Data Schema

The dashboard reads from these main tables:
- `benchmark_runs`: Overall benchmark execution metadata
- `test_results`: Individual test results with timings
- `model_performance`: Aggregated performance metrics
- `category_performance`: Performance breakdown by category

## Development

### Project Structure
```
agentx-benchmark-ui/
├── src/
│   ├── components/     # React components
│   ├── services/       # SQLite and API services
│   └── types/          # TypeScript definitions
├── public/
│   ├── benchmark.db    # SQLite database
│   └── sql-wasm.wasm   # SQL.js WebAssembly
├── scripts/
│   └── update-db.sh    # Database update script
└── vite.config.ts      # Vite configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run dev:static` - Development with static SQLite
- `npm run build` - Build for production
- `npm run build:static` - Build with embedded database
- `npm run deploy` - Deploy to GitHub Pages
- `npm run update-db` - Update and optimize database

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0.

## Related Projects

- [AgentX](https://github.com/codenotary/agentx) - The main multi-agent orchestration system
- [AgentX Benchmark Tool](https://github.com/codenotary/agentx/tree/main/cmd/benchmark) - CLI tool for running benchmarks

---

**Copyright © 2025 Codenotary Inc**
