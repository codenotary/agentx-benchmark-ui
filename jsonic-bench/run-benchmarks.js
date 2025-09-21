#!/usr/bin/env node

/**
 * Command-line benchmark runner
 * Run benchmarks from the terminal and save results
 */

import { BenchmarkRunner } from './src/runner.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dataSize: 'medium',
  iterations: 3,
  warmup: 1,
  adapters: ['jsonic', 'indexeddb', 'sqljs', 'localstorage'],
  scenarios: ['insert', 'query', 'update', 'delete'],
  output: 'console',
  save: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--size':
    case '-s':
      options.dataSize = args[++i];
      break;
    
    case '--iterations':
    case '-i':
      options.iterations = parseInt(args[++i]);
      break;
    
    case '--warmup':
    case '-w':
      options.warmup = parseInt(args[++i]);
      break;
    
    case '--adapters':
    case '-a':
      options.adapters = args[++i].split(',');
      break;
    
    case '--scenarios':
    case '-sc':
      options.scenarios = args[++i].split(',');
      break;
    
    case '--output':
    case '-o':
      options.output = args[++i];
      break;
    
    case '--save':
      options.save = true;
      break;
    
    case '--help':
    case '-h':
      printHelp();
      process.exit(0);
  }
}

function printHelp() {
  console.log(`
JSONIC Benchmark Runner

Usage: node run-benchmarks.js [options]

Options:
  -s, --size <size>          Dataset size (small|medium|large|xlarge) [default: medium]
  -i, --iterations <n>       Number of iterations [default: 3]
  -w, --warmup <n>          Number of warmup runs [default: 1]
  -a, --adapters <list>      Comma-separated list of adapters [default: all]
  -sc, --scenarios <list>    Comma-separated list of scenarios [default: basic]
  -o, --output <format>      Output format (console|json|csv|markdown|html) [default: console]
  --save                     Save results to file
  -h, --help                Display this help message

Examples:
  # Run quick benchmark
  node run-benchmarks.js -s small -i 1

  # Run full benchmark and save results
  node run-benchmarks.js -s large -i 5 --save -o json

  # Test specific databases
  node run-benchmarks.js -a jsonic,indexeddb -sc insert,query

  # Generate markdown report
  node run-benchmarks.js -o markdown --save
  `);
}

async function main() {
  console.log('🚀 JSONIC Benchmark Suite');
  console.log('═'.repeat(50));
  console.log('');
  console.log('Configuration:');
  console.log(JSON.stringify(options, null, 2));
  console.log('');
  
  try {
    // Create benchmark runner
    const runner = new BenchmarkRunner(options);
    
    // Run benchmarks
    const results = await runner.run();
    
    // Output results
    const output = runner.exportResults(options.output);
    
    if (options.output === 'console') {
      console.log(output);
    } else {
      console.log(output);
    }
    
    // Save results if requested
    if (options.save) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = options.output === 'console' ? 'txt' : options.output;
      const filename = `benchmark-results-${timestamp}.${ext}`;
      const filepath = path.join(__dirname, 'results', filename);
      
      // Ensure results directory exists
      await fs.mkdir(path.join(__dirname, 'results'), { recursive: true });
      
      // Save results
      await fs.writeFile(filepath, output);
      console.log(`\n📁 Results saved to: ${filepath}`);
      
      // Also save raw JSON
      const jsonFile = path.join(__dirname, 'results', 'latest.json');
      await fs.writeFile(jsonFile, JSON.stringify(results, null, 2));
    }
    
    console.log('\n✨ Benchmark completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}