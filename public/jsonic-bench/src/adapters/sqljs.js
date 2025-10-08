import { DatabaseAdapter } from './base.js';

/**
 * SQL.js adapter for benchmarks - REAL SQL.js WASM Implementation
 * Uses actual SQL.js library for accurate SQL performance benchmarking
 */
export class SQLJSAdapter extends DatabaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'SQL.js';
    this.type = 'SQL (WebAssembly)';
    this.features = {
      transactions: true,
      indexes: true,
      sql: true,
      aggregation: true,
      reactive: false,
      bulkOperations: true
    };
  }

  async init() {
    // Load real SQL.js WASM library using script tag approach (more reliable for UMD modules)
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const SQL = await window.initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
    });

    // Create real SQL.js database
    this.db = new SQL.Database();

    // Create schema
    this.db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        age INTEGER,
        city TEXT,
        status TEXT,
        name TEXT,
        email TEXT,
        department TEXT,
        salary INTEGER,
        score REAL,
        category INTEGER
      )
    `);

    console.log('✅ SQL.js WASM database initialized with schema');

    this.inTransaction = false;
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
    this.db.run(
      'INSERT INTO documents (data, age, city, status, name, email, department, salary, score, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data,
        doc.age || null,
        doc.city || null,
        doc.status || null,
        doc.name || null,
        doc.email || null,
        doc.department || null,
        doc.salary || null,
        doc.score || null,
        doc.category || null
      ]
    );

    // Get last insert ID
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0];
  }

  async bulkInsert(docs) {
    // Real SQL.js batch insert using transaction
    this.db.run('BEGIN TRANSACTION');

    try {
      const stmt = this.db.prepare(
        'INSERT INTO documents (data, age, city, status, name, email, department, salary, score, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      for (const doc of docs) {
        const data = JSON.stringify(doc);
        stmt.run([
          data,
          doc.age || null,
          doc.city || null,
          doc.status || null,
          doc.name || null,
          doc.email || null,
          doc.department || null,
          doc.salary || null,
          doc.score || null,
          doc.category || null
        ]);
      }

      stmt.free();
      this.db.run('COMMIT');

      // Get inserted IDs
      const result = this.db.exec('SELECT id FROM documents ORDER BY id DESC LIMIT ?', [docs.length]);
      return result[0] ? result[0].values.map(row => row[0]).reverse() : [];
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  async find(query, options = {}) {
    // Build real SQL SELECT query
    let sql = 'SELECT id, data FROM documents';
    const params = [];
    const whereClauses = [];

    // Build WHERE clause from MongoDB-style query
    if (query && Object.keys(query).length > 0) {
      for (const [field, condition] of Object.entries(query)) {
        if (typeof condition === 'object' && condition !== null) {
          // Handle query operators
          for (const [op, value] of Object.entries(condition)) {
            switch (op) {
              case '$gt':
                whereClauses.push(`${field} > ?`);
                params.push(value);
                break;
              case '$gte':
                whereClauses.push(`${field} >= ?`);
                params.push(value);
                break;
              case '$lt':
                whereClauses.push(`${field} < ?`);
                params.push(value);
                break;
              case '$lte':
                whereClauses.push(`${field} <= ?`);
                params.push(value);
                break;
              case '$ne':
                whereClauses.push(`${field} != ?`);
                params.push(value);
                break;
              case '$in':
                whereClauses.push(`${field} IN (${value.map(() => '?').join(', ')})`);
                params.push(...value);
                break;
            }
          }
        } else {
          // Simple equality
          whereClauses.push(`${field} = ?`);
          params.push(condition);
        }
      }
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Add ORDER BY
    if (options.sort) {
      const sortClauses = [];
      for (const [field, order] of Object.entries(options.sort)) {
        sortClauses.push(`${field} ${order === 1 ? 'ASC' : 'DESC'}`);
      }
      sql += ' ORDER BY ' + sortClauses.join(', ');
    }

    // Add LIMIT and OFFSET
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    if (options.skip) {
      sql += ` OFFSET ${options.skip}`;
    }

    // Execute query
    const result = this.db.exec(sql, params);
    if (!result || result.length === 0) return [];

    // Parse results
    return result[0].values.map(row => {
      const doc = JSON.parse(row[1]); // data column
      doc._id = row[0]; // id column
      return doc;
    });
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  async update(id, update) {
    // Get current document
    const result = this.db.exec('SELECT data FROM documents WHERE id = ?', [id]);
    if (!result || result.length === 0 || result[0].values.length === 0) return 0;

    const doc = JSON.parse(result[0].values[0][0]);

    // Apply MongoDB-style update operators
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    if (update.$inc) {
      for (const [field, value] of Object.entries(update.$inc)) {
        doc[field] = (doc[field] || 0) + value;
      }
    }
    if (!update.$set && !update.$inc) {
      Object.assign(doc, update);
    }

    // Update document
    this.db.run(
      'UPDATE documents SET data = ?, age = ?, city = ?, status = ?, name = ?, email = ?, department = ?, salary = ?, score = ? WHERE id = ?',
      [JSON.stringify(doc), doc.age, doc.city, doc.status, doc.name, doc.email, doc.department, doc.salary, doc.score, id]
    );

    return 1;
  }

  async updateMany(query, update) {
    const docs = await this.find(query);
    if (docs.length === 0) return 0;

    this.db.run('BEGIN TRANSACTION');

    try {
      for (const doc of docs) {
        await this.update(doc._id, update);
      }

      this.db.run('COMMIT');
      return docs.length;
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  async delete(id) {
    this.db.run('DELETE FROM documents WHERE id = ?', [id]);
    return this.db.getRowsModified();
  }

  async deleteMany(query) {
    // Build DELETE with WHERE clause
    let sql = 'DELETE FROM documents';
    const params = [];
    const whereClauses = [];

    if (query && Object.keys(query).length > 0) {
      for (const [field, condition] of Object.entries(query)) {
        if (typeof condition === 'object' && condition !== null) {
          for (const [op, value] of Object.entries(condition)) {
            switch (op) {
              case '$lt':
                whereClauses.push(`${field} < ?`);
                params.push(value);
                break;
              case '$lte':
                whereClauses.push(`${field} <= ?`);
                params.push(value);
                break;
              case '$gt':
                whereClauses.push(`${field} > ?`);
                params.push(value);
                break;
              case '$gte':
                whereClauses.push(`${field} >= ?`);
                params.push(value);
                break;
            }
          }
        } else {
          whereClauses.push(`${field} = ?`);
          params.push(condition);
        }
      }

      if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
      }
    }

    this.db.run(sql, params);
    return this.db.getRowsModified();
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
    const result = this.db.exec(query, params);
    if (!result || result.length === 0) return [];

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
}