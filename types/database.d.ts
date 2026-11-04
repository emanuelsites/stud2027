// Interface estrutural preservada do banco original; implementação libSQL no runtime.
type D1Result<T=Record<string,unknown>>={results:T[];meta:{changes:number}};
interface D1PreparedStatement {
  bind(...values:any[]):D1PreparedStatement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<D1Result<T>>;
  run():Promise<D1Result>;
}
interface D1Database {
  prepare(sql:string):D1PreparedStatement;
  batch(statements:D1PreparedStatement[]):Promise<D1Result[]>;
}
