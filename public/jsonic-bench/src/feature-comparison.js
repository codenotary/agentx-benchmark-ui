/**
 * Feature comparison visualization component
 */

import { FEATURE_MATRIX, calculateFeatureScores, getRecommendation } from './feature-matrix.js';

export class FeatureComparison {
  constructor() {
    this.matrix = FEATURE_MATRIX;
  }

  /**
   * Render feature comparison table
   */
  renderComparisonTable() {
    const categories = [
      { key: 'storage', name: '💾 Storage', icon: '💾' },
      { key: 'dataModel', name: '📊 Data Model', icon: '📊' },
      { key: 'querying', name: '🔍 Querying', icon: '🔍' },
      { key: 'indexing', name: '📇 Indexing', icon: '📇' },
      { key: 'transactions', name: '🔐 Transactions', icon: '🔐' },
      { key: 'replication', name: '🔄 Replication & Sync', icon: '🔄' },
      { key: 'performance', name: '⚡ Performance', icon: '⚡' },
      { key: 'developer', name: '👩‍💻 Developer Experience', icon: '👩‍💻' },
      { key: 'ai', name: '🤖 AI/LLM Integration', icon: '🤖' },
      { key: 'security', name: '🔒 Security', icon: '🔒' },
      { key: 'compatibility', name: '🌐 Compatibility', icon: '🌐' }
    ];

    let html = '<div class="feature-comparison">';
    
    // Overall scores
    html += this.renderOverallScores();
    
    // Feature categories
    for (const category of categories) {
      html += this.renderCategory(category);
    }
    
    // Pros and Cons
    html += this.renderProsAndCons();
    
    // Best Use Cases
    html += this.renderBestUseCases();
    
    // Recommendations
    html += this.renderRecommendations();
    
    html += '</div>';
    
    return html;
  }

  /**
   * Render overall feature scores
   */
  renderOverallScores() {
    const scores = calculateFeatureScores();
    
    let html = `
      <div class="feature-section">
        <h2>📊 Overall Feature Coverage</h2>
        <div class="scores-grid">
    `;
    
    for (const [db, score] of Object.entries(scores)) {
      const info = this.matrix[db];
      const color = this.getScoreColor(score.percentage);
      
      html += `
        <div class="score-card">
          <h3>${info.name}</h3>
          <div class="score-circle" style="background: conic-gradient(${color} ${score.percentage}%, #e9ecef ${score.percentage}%)">
            <div class="score-value">${score.percentage}%</div>
          </div>
          <div class="score-details">
            <span>${score.supported}/${score.total} features</span>
          </div>
          <div class="db-type">${info.type}</div>
        </div>
      `;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Render feature category
   */
  renderCategory(category) {
    let html = `
      <div class="feature-section">
        <h3>${category.icon} ${category.name}</h3>
        <table class="feature-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>JSONIC</th>
              <th>IndexedDB</th>
              <th>SQL.js</th>
              <th>LocalStorage</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Get all features for this category
    const features = {};
    for (const db of Object.keys(this.matrix)) {
      const dbFeatures = this.matrix[db].features[category.key];
      if (dbFeatures) {
        Object.keys(dbFeatures).forEach(feature => {
          features[feature] = true;
        });
      }
    }
    
    // Render each feature
    for (const feature of Object.keys(features)) {
      html += '<tr>';
      html += `<td class="feature-name">${feature}</td>`;
      
      for (const db of ['jsonic', 'indexeddb', 'sqljs', 'localstorage']) {
        const value = this.matrix[db].features[category.key]?.[feature];
        html += `<td class="feature-value">${this.renderFeatureValue(value)}</td>`;
      }
      
      html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Render pros and cons
   */
  renderProsAndCons() {
    let html = `
      <div class="feature-section">
        <h2>👍 Pros & 👎 Cons</h2>
        <div class="pros-cons-grid">
    `;
    
    for (const [db, info] of Object.entries(this.matrix)) {
      html += `
        <div class="pros-cons-card">
          <h3>${info.name}</h3>
          <div class="pros">
            <h4>✅ Pros</h4>
            <ul>
              ${info.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
          </div>
          <div class="cons">
            <h4>❌ Cons</h4>
            <ul>
              ${info.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Render best use cases
   */
  renderBestUseCases() {
    let html = `
      <div class="feature-section">
        <h2>🎯 Best Use Cases</h2>
        <div class="use-cases-grid">
    `;
    
    for (const [db, info] of Object.entries(this.matrix)) {
      html += `
        <div class="use-case-card">
          <h3>${info.name}</h3>
          <ul class="use-case-list">
            ${info.bestFor.map(use => `<li>✓ ${use}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Render recommendations
   */
  renderRecommendations() {
    const useCases = [
      { id: 'complex-queries', name: 'Complex Queries', icon: '🔍' },
      { id: 'large-storage', name: 'Large Storage', icon: '💾' },
      { id: 'offline-first', name: 'Offline First', icon: '📴' },
      { id: 'real-time', name: 'Real-time Sync', icon: '⚡' },
      { id: 'sql-required', name: 'SQL Required', icon: '📊' },
      { id: 'transactions', name: 'Transactions', icon: '🔐' },
      { id: 'cross-tab', name: 'Cross-tab Sync', icon: '🔄' },
      { id: 'binary-data', name: 'Binary Data', icon: '📁' }
    ];
    
    let html = `
      <div class="feature-section">
        <h2>💡 Recommendations by Use Case</h2>
        <div class="recommendations-grid">
    `;
    
    for (const useCase of useCases) {
      const recommended = getRecommendation(useCase.id);
      html += `
        <div class="recommendation-card">
          <h4>${useCase.icon} ${useCase.name}</h4>
          <div class="recommended-dbs">
            ${recommended.map(db => `
              <span class="db-badge ${db === recommended[0] ? 'primary' : 'secondary'}">
                ${this.matrix[db].name}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Render feature value
   */
  renderFeatureValue(value) {
    if (typeof value === 'boolean') {
      return value ? 
        '<span class="feature-yes">✅</span>' : 
        '<span class="feature-no">❌</span>';
    } else if (typeof value === 'string') {
      return `<span class="feature-text">${value}</span>`;
    } else {
      return '<span class="feature-na">—</span>';
    }
  }

  /**
   * Get score color based on percentage
   */
  getScoreColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  }

  /**
   * Render feature matrix styles
   */
  static getStyles() {
    return `
      .feature-comparison {
        padding: 20px;
      }
      
      .feature-section {
        margin-bottom: 40px;
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      }
      
      .feature-section h2 {
        color: #2c3e50;
        margin-bottom: 20px;
        font-size: 1.8em;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
      }
      
      .feature-section h3 {
        color: #495057;
        margin-bottom: 15px;
        font-size: 1.3em;
      }
      
      /* Scores Grid */
      .scores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 25px;
        margin-top: 20px;
      }
      
      .score-card {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
      }
      
      .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        margin: 20px auto;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .score-value {
        position: absolute;
        background: white;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8em;
        font-weight: bold;
      }
      
      .score-details {
        color: #6c757d;
        font-size: 0.9em;
        margin-top: 10px;
      }
      
      .db-type {
        color: #667eea;
        font-weight: 600;
        margin-top: 5px;
      }
      
      /* Feature Table */
      .feature-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      
      .feature-table th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      
      .feature-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .feature-table tr:hover {
        background: #f8f9fa;
      }
      
      .feature-name {
        font-weight: 500;
        color: #495057;
      }
      
      .feature-value {
        text-align: center;
      }
      
      .feature-yes {
        color: #28a745;
        font-size: 1.2em;
      }
      
      .feature-no {
        color: #dc3545;
        font-size: 1.2em;
      }
      
      .feature-text {
        color: #6c757d;
        font-size: 0.9em;
      }
      
      .feature-na {
        color: #adb5bd;
      }
      
      /* Pros and Cons */
      .pros-cons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .pros-cons-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
      }
      
      .pros-cons-card h3 {
        color: #667eea;
        margin-bottom: 15px;
      }
      
      .pros, .cons {
        margin-bottom: 15px;
      }
      
      .pros h4 {
        color: #28a745;
        font-size: 1.1em;
        margin-bottom: 8px;
      }
      
      .cons h4 {
        color: #dc3545;
        font-size: 1.1em;
        margin-bottom: 8px;
      }
      
      .pros ul, .cons ul {
        list-style: none;
        padding: 0;
      }
      
      .pros li, .cons li {
        padding: 5px 0;
        font-size: 0.95em;
      }
      
      /* Use Cases */
      .use-cases-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .use-case-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }
      
      .use-case-card h3 {
        color: #667eea;
        margin-bottom: 15px;
      }
      
      .use-case-list {
        list-style: none;
        padding: 0;
      }
      
      .use-case-list li {
        padding: 8px 0;
        color: #495057;
      }
      
      /* Recommendations */
      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
      }
      
      .recommendation-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }
      
      .recommendation-card h4 {
        color: #495057;
        margin-bottom: 10px;
        font-size: 1.1em;
      }
      
      .recommended-dbs {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .db-badge {
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 600;
      }
      
      .db-badge.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .db-badge.secondary {
        background: #e9ecef;
        color: #495057;
      }
      
      @media (max-width: 768px) {
        .scores-grid,
        .pros-cons-grid,
        .use-cases-grid,
        .recommendations-grid {
          grid-template-columns: 1fr;
        }
        
        .feature-table {
          font-size: 0.9em;
        }
        
        .feature-table th,
        .feature-table td {
          padding: 8px;
        }
      }
    `;
  }
}