#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

const dbPath = path.join(__dirname, '../public/benchmark_history.db');
const outputPath = path.join(__dirname, '../public/data/database.json');
const minOutputPath = path.join(__dirname, '../public/data/database.min.json');
const metadataPath = path.join(__dirname, '../public/data/metadata.json');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const db = new sqlite3Verbose.Database(dbPath, sqlite3Verbose.OPEN_READONLY);

async function exportData() {
  const data = {
    benchmark_runs: [],
    test_results: [],
    model_performance: [],
    performance_trends: []
  };

  return new Promise((resolve, reject) => {
    // Export benchmark_runs
    db.all("SELECT * FROM benchmark_runs ORDER BY timestamp DESC", (err, rows) => {
      if (err) {
        console.error('Error reading benchmark_runs:', err);
        reject(err);
        return;
      }
      data.benchmark_runs = rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
      console.log(`Exported ${rows.length} benchmark runs`);

      // Export test_results with all fields
      db.all(`SELECT 
        id,
        run_id,
        timestamp,
        provider,
        model,
        prompt_id,
        prompt_text,
        category,
        iteration,
        time_to_first_token_ms,
        total_time_ms,
        tokens_generated,
        tokens_per_second,
        quality_score,
        accuracy_score,
        relevance_score,
        completeness_score,
        coherence_score,
        passed_keywords,
        passed_patterns,
        passed_length,
        passed_format,
        estimated_cost_usd,
        success,
        error_message,
        response
      FROM test_results 
      ORDER BY timestamp DESC`, (err, rows) => {
        if (err) {
          console.error('Error reading test_results:', err);
          reject(err);
          return;
        }
        data.test_results = rows.map(row => ({
          ...row,
          passed_keywords: row.passed_keywords === 1,
          passed_patterns: row.passed_patterns === 1,
          passed_length: row.passed_length === 1,
          passed_format: row.passed_format === 1,
          success: row.success === 1,
          quality_score: row.quality_score !== null ? parseFloat(row.quality_score) : null,
          accuracy_score: row.accuracy_score !== null ? parseFloat(row.accuracy_score) : null,
          relevance_score: row.relevance_score !== null ? parseFloat(row.relevance_score) : null,
          completeness_score: row.completeness_score !== null ? parseFloat(row.completeness_score) : null,
          coherence_score: row.coherence_score !== null ? parseFloat(row.coherence_score) : null,
          tokens_per_second: row.tokens_per_second !== null ? parseFloat(row.tokens_per_second) : null,
          estimated_cost_usd: row.estimated_cost_usd !== null ? parseFloat(row.estimated_cost_usd) : null
        }));
        console.log(`Exported ${rows.length} test results`);

        // Export model_performance
        db.all(`SELECT 
          id,
          run_id,
          provider,
          model,
          timestamp,
          total_tests,
          successful_tests,
          failed_tests,
          success_rate,
          avg_ttft_ms,
          min_ttft_ms,
          max_ttft_ms,
          avg_total_time_ms,
          avg_tokens_per_second,
          total_tokens_generated,
          avg_quality_score,
          avg_accuracy_score,
          avg_relevance_score,
          avg_completeness_score,
          avg_coherence_score,
          total_cost_usd,
          avg_cost_per_test,
          cost_per_1k_tokens
        FROM model_performance 
        ORDER BY run_id DESC`, (err, rows) => {
          if (err) {
            console.error('Error reading model_performance:', err);
            reject(err);
            return;
          }
          data.model_performance = rows.map(row => ({
            ...row,
            success_rate: row.success_rate !== null ? parseFloat(row.success_rate) : null,
            avg_tokens_per_second: row.avg_tokens_per_second !== null ? parseFloat(row.avg_tokens_per_second) : null,
            avg_quality_score: row.avg_quality_score !== null ? parseFloat(row.avg_quality_score) : null,
            avg_accuracy_score: row.avg_accuracy_score !== null ? parseFloat(row.avg_accuracy_score) : null,
            avg_relevance_score: row.avg_relevance_score !== null ? parseFloat(row.avg_relevance_score) : null,
            avg_completeness_score: row.avg_completeness_score !== null ? parseFloat(row.avg_completeness_score) : null,
            avg_coherence_score: row.avg_coherence_score !== null ? parseFloat(row.avg_coherence_score) : null,
            total_cost_usd: row.total_cost_usd !== null ? parseFloat(row.total_cost_usd) : null,
            avg_cost_per_test: row.avg_cost_per_test !== null ? parseFloat(row.avg_cost_per_test) : null,
            cost_per_1k_tokens: row.cost_per_1k_tokens !== null ? parseFloat(row.cost_per_1k_tokens) : null
          }));
          console.log(`Exported ${rows.length} model performance records`);

          // Export performance_trends
          db.all(`SELECT 
            id,
            provider,
            model,
            metric_name,
            metric_value,
            recorded_at,
            category,
            prompt_id,
            previous_value,
            change_percentage,
            is_regression
          FROM performance_trends 
          ORDER BY recorded_at DESC`, (err, rows) => {
            if (err) {
              console.error('Error reading performance_trends:', err);
              reject(err);
              return;
            }
            data.performance_trends = rows.map(row => ({
              ...row,
              metric_value: parseFloat(row.metric_value),
              previous_value: row.previous_value !== null ? parseFloat(row.previous_value) : null,
              change_percentage: row.change_percentage !== null ? parseFloat(row.change_percentage) : null,
              is_regression: row.is_regression === 1
            }));
            console.log(`Exported ${rows.length} performance trend records`);

            // Write full JSON
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Full data written to ${outputPath}`);

            // Write minified JSON
            fs.writeFileSync(minOutputPath, JSON.stringify(data));
            console.log(`Minified data written to ${minOutputPath}`);

            // Write metadata
            const metadata = {
              lastUpdated: new Date().toISOString(),
              recordCounts: {
                benchmark_runs: data.benchmark_runs.length,
                test_results: data.test_results.length,
                model_performance: data.model_performance.length,
                performance_trends: data.performance_trends.length
              }
            };
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            console.log(`Metadata written to ${metadataPath}`);

            resolve(data);
          });
        });
      });
    });
  });
}

exportData()
  .then(() => {
    console.log('Export completed successfully');
    db.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Export failed:', err);
    db.close();
    process.exit(1);
  });