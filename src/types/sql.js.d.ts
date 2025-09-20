declare module 'sql.js' {
  interface SqlJsStatic {
    Database: typeof Database;
  }

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  class Database {
    constructor(data?: Uint8Array);
    run(sql: string, params?: any[]): void;
    exec(sql: string): QueryResults[];
    prepare(sql: string): Statement;
    close(): void;
  }

  class Statement {
    bind(params?: any[]): void;
    step(): boolean;
    get(): any[];
    getAsObject(): any;
    free(): void;
    getColumnNames(): string[];
  }

  interface QueryResults {
    columns: string[];
    values: any[][];
  }

  function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
  
  export default initSqlJs;
}