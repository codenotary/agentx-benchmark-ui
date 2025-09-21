#!/usr/bin/env node

/**
 * REST API Client for JSONIC Benchmarks
 * Example usage of the REST API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:3000';

class BenchmarkRESTClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get server status
   */
  async getStatus() {
    const response = await fetch(`${this.baseUrl}/api/status`);
    return response.json();
  }

  /**
   * Run benchmarks
   */
  async runBenchmark(config = {}) {
    const response = await fetch(`${this.baseUrl}/api/benchmark/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSize: 'medium',
        iterations: 3,
        warmup: 1,
        adapters: ['jsonic', 'indexeddb'],
        scenarios: ['insert', 'query'],
        ...config
      })
    });
    return response.json();
  }

  /**
   * Get benchmark results by session ID
   */
  async getResults(sessionId) {
    const response = await fetch(`${this.baseUrl}/api/benchmark/results/${sessionId}`);
    return response.json();
  }

  /**
   * Get benchmark history
   */
  async getHistory(limit = 10) {
    const response = await fetch(`${this.baseUrl}/api/benchmark/history?limit=${limit}`);
    return response.json();
  }

  /**
   * Compare benchmark runs
   */
  async compareBenchmarks(runs) {
    const response = await fetch(`${this.baseUrl}/api/benchmark/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ runs })
    });
    return response.json();
  }

  /**
   * Stream benchmark progress using Server-Sent Events
   */
  async streamBenchmark(config = {}, onProgress) {
    const params = new URLSearchParams({
      dataSize: config.dataSize || 'medium',
      iterations: config.iterations || 3,
      warmup: config.warmup || 1,
      adapters: (config.adapters || ['jsonic', 'indexeddb']).join(','),
      scenarios: (config.scenarios || ['insert', 'query']).join(',')
    });

    const eventSource = new EventSource(`${this.baseUrl}/api/benchmark/stream?${params}`);
    
    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (onProgress) {
          onProgress(data);
        }
        
        if (data.event === 'complete') {
          eventSource.close();
          resolve(data);
        } else if (data.event === 'error') {
          eventSource.close();
          reject(new Error(data.error));
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        reject(error);
      };
    });
  }
}

// Example usage
async function main() {
  const client = new BenchmarkRESTClient();
  
  console.log('📊 JSONIC Benchmark REST Client\n');
  
  // Get status
  console.log('Getting server status...');
  const status = await client.getStatus();
  console.log('Status:', status);
  console.log('');
  
  // Run benchmark
  console.log('Running benchmark...');
  const result = await client.runBenchmark({
    dataSize: 'small',
    iterations: 2,
    adapters: ['jsonic', 'indexeddb'],
    scenarios: ['insert', 'query']
  });
  
  if (result.success) {
    console.log('✅ Benchmark completed!');
    console.log('Winner:', result.summary.winner);
    console.log('Rankings:', result.summary.rankings);
  } else {
    console.log('❌ Benchmark failed:', result.error);
  }
  
  // Stream benchmark with progress
  console.log('\nStreaming benchmark with progress...');
  try {
    const streamResult = await client.streamBenchmark(
      {
        dataSize: 'small',
        iterations: 1,
        scenarios: ['insert']
      },
      (update) => {
        console.log('Progress:', update);
      }
    );
    console.log('Stream complete:', streamResult.summary);
  } catch (error) {
    console.error('Stream error:', error);
  }
}

// Export for use as module
export { BenchmarkRESTClient };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}