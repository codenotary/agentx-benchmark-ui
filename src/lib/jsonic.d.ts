declare module './jsonic.js' {
  export interface JsonicDatabase {
    insert(json: string): any;
    get(id: string): any;
    update(id: string, json: string): any;
    delete(id: string): any;
    list_ids(): any;
    stats(): any;
    query?(filter: any): any;
  }

  export interface JSONIC {
    createDatabase(): Promise<JsonicDatabase>;
  }

  const JSONIC: JSONIC;
  export default JSONIC;
}