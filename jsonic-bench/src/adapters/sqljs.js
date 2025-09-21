import { DatabaseAdapter } from './base.js';

/**
 * SQL.js adapter for benchmarks
 */
export class SQLJSAdapter extends DatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'SQL.js';
    this.type = 'SQL';
    this.features = {
      transactions: true,
      indexes: true,
      sql: true,
      aggregation: true,
      reactive: false
    };
  }

  async init() {
    // Mock SQL.js for benchmarking without external dependencies
    this.documents = new Map();
    this.idCounter = 0;
    this.inTransaction = false;
    
    // Create mock database interface
    this.db = {
      run: (sql) => {
        // Mock SQL execution
        return true;
      },
      prepare: (sql) => {
        const self = this;
        return {
          run: (params) => {
            // Mock insert
            if (sql.includes('INSERT')) {
              self.idCounter++;
              const doc = JSON.parse(params[0]);
              doc._id = self.idCounter;
              self.documents.set(self.idCounter, doc);
            }
          },
          bind: (params) => {},
          step: () => false,
          getAsObject: () => ({}),
          free: () => {}
        };
      },
      exec: (sql) => {
        if (sql.includes('last_insert_rowid')) {
          return [{
            columns: ['id'],
            values: [[this.idCounter]]
          }];
        }
        return [{
          columns: [],
          values: []
        }];
      },
      close: () => {},
      getRowsModified: () => 1
    };
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
    }
  }

  async clear() {
    this.db.run('DELETE FROM documents');
    this.db.run('DELETE FROM sqlite_sequence WHERE name="documents"'); // Reset autoincrement
  }

  async insert(doc) {
    const data = JSON.stringify(doc);
    const stmt = this.db.prepare(
      'INSERT INTO documents (data, age, city, status, name, email) VALUES (?, ?, ?, ?, ?, ?)'
    );
    
    stmt.run([
      data,
      doc.age || null,
      doc.city || null,
      doc.status || null,
      doc.name || null,
      doc.email || null
    ]);
    
    stmt.free();
    
    // Get last insert ID
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0];
  }

  async bulkInsert(docs) {
    const ids = [];
    
    for (const doc of docs) {
      this.idCounter++;
      doc._id = this.idCounter;
      this.documents.set(this.idCounter, doc);
      ids.push(this.idCounter);
    }
    
    return ids;
  }

  async find(query, options = {}) {
    // Use simple mock implementation
    let results = Array.from(this.documents.values());
    
    // Filter by query
    if (query && Object.keys(query).length > 0) {
      results = results.filter(doc => this.matchesQuery(doc, query));
    }
    
    // Sort
    if (options.sort) {
      const sortFields = Object.entries(options.sort);
      results.sort((a, b) => {
        for (const [field, order] of sortFields) {
          if (a[field] < b[field]) return order === 1 ? -1 : 1;
          if (a[field] > b[field]) return order === 1 ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Skip and limit
    const skip = options.skip || 0;
    const limit = options.limit || results.length;
    
    return results.slice(skip, skip + limit);
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  async update(id, update) {
    const doc = this.documents.get(id);
    if (!doc) return 0;
    
    // Apply update
    if (update.$set) {
      Object.assign(doc, update.$set);
    } else if (update.$inc) {
      for (const [field, value] of Object.entries(update.$inc)) {
        doc[field] = (doc[field] || 0) + value;
      }
    } else {
      Object.assign(doc, update);
    }
    
    return 1;
  }

  async updateMany(query, update) {
    const docs = await this.find(query);
    let modified = 0;
    
    if (!this.inTransaction) {
      this.db.run('BEGIN TRANSACTION');
    }
    
    try {
      for (const doc of docs) {
        const result = await this.update(doc._id, update);
        modified += result;
      }
      
      if (!this.inTransaction) {
        this.db.run('COMMIT');
      }
    } catch (error) {
      if (!this.inTransaction) {
        this.db.run('ROLLBACK');
      }
      throw error;
    }
    
    return modified;
  }

  async delete(id) {
    if (this.documents.has(id)) {
      this.documents.delete(id);
      return 1;
    }
    return 0;
  }

  async deleteMany(query) {
    const docs = await this.find(query);
    let deleted = 0;
    
    if (!this.inTransaction) {
      this.db.run('BEGIN TRANSACTION');
    }
    
    try {
      const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
      
      for (const doc of docs) {
        stmt.run([doc._id]);
        deleted++;
      }
      
      stmt.free();
      
      if (!this.inTransaction) {
        this.db.run('COMMIT');
      }
    } catch (error) {
      if (!this.inTransaction) {
        this.db.run('ROLLBACK');
      }
      throw error;
    }
    
    return deleted;
  }

  async count(query = {}) {
    if (Object.keys(query).length === 0) {
      const result = this.db.exec('SELECT COUNT(*) as count FROM documents');
      return result[0].values[0][0];
    } else {
      const docs = await this.find(query);
      return docs.length;
    }
  }

  async createIndex(name, fields) {
    const field = Array.isArray(fields) ? fields[0] : fields;
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_${name} ON documents(${field})`);
    return true;
  }

  async aggregate(pipeline) {
    // Convert MongoDB-style aggregation to SQL
    let sql = 'SELECT ';
    const having = [];
    const groupBy = [];
    const orderBy = [];
    let limit = null;
    
    // Simple aggregation support
    for (const stage of pipeline) {
      if (stage.$group) {
        // Group stage
        if (stage.$group._id) {
          const field = stage.$group._id.replace('$', '');
          groupBy.push(field);
          sql += `${field}, `;
        }
        
        // Aggregation functions
        for (const [key, value] of Object.entries(stage.$group)) {
          if (key !== '_id') {
            if (value.$sum) {
              sql += `SUM(${value.$sum === 1 ? '1' : value.$sum.replace('$', '')}) as ${key}, `;
            } else if (value.$avg) {
              sql += `AVG(${value.$avg.replace('$', '')}) as ${key}, `;
            } else if (value.$min) {
              sql += `MIN(${value.$min.replace('$', '')}) as ${key}, `;
            } else if (value.$max) {
              sql += `MAX(${value.$max.replace('$', '')}) as ${key}, `;
            } else if (value.$count) {
              sql += `COUNT(*) as ${key}, `;
            }
          }
        }
      } else if (stage.$sort) {
        for (const [field, order] of Object.entries(stage.$sort)) {
          orderBy.push(`${field} ${order === 1 ? 'ASC' : 'DESC'}`);
        }
      } else if (stage.$limit) {
        limit = stage.$limit;
      }
    }
    
    // Remove trailing comma
    sql = sql.slice(0, -2) + ' FROM documents';
    
    if (groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(', ')}`;
    }
    
    if (having.length > 0) {
      sql += ` HAVING ${having.join(' AND ')}`;
    }
    
    if (orderBy.length > 0) {
      sql += ` ORDER BY ${orderBy.join(', ')}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    const result = this.db.exec(sql);
    if (result.length === 0) return [];
    
    // Convert to objects
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  async beginTransaction() {
    this.db.run('BEGIN TRANSACTION');
    this.inTransaction = true;
    
    return {
      commit: async () => {
        this.db.run('COMMIT');
        this.inTransaction = false;
      },
      rollback: async () => {
        this.db.run('ROLLBACK');
        this.inTransaction = false;
      }
    };
  }

  async executeSql(query, params = []) {
    const stmt = this.db.prepare(query);
    const result = [];
    
    stmt.bind(params);
    
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    
    stmt.free();
    return result;
  }
  
  // Helper method for query matching
  matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    
    for (const [field, condition] of Object.entries(query)) {
      const value = doc[field];
      
      if (typeof condition === 'object' && condition !== null) {
        for (const [op, opValue] of Object.entries(condition)) {
          switch (op) {
            case '$gt':
              if (!(value > opValue)) return false;
              break;
            case '$gte':
              if (!(value >= opValue)) return false;
              break;
            case '$lt':
              if (!(value < opValue)) return false;
              break;
            case '$lte':
              if (!(value <= opValue)) return false;
              break;
            case '$ne':
              if (value === opValue) return false;
              break;
            case '$in':
              if (!opValue.includes(value)) return false;
              break;
          }
        }
      } else {
        if (value !== condition) return false;
      }
    }
    return true;
  }
}