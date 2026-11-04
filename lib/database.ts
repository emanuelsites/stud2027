import {createClient,type Client,type InValue,type ResultSet} from '@libsql/client';

const values=(items:any[]):InValue[]=>items.map(v=>v===undefined?null:v);
const result=<T>(r:ResultSet):D1Result<T>=>({results:r.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='bigint'?Number(v):v]))) as T[],meta:{changes:r.rowsAffected}});
class Statement implements D1PreparedStatement {
  constructor(readonly client:Client,readonly sql:string,readonly args:InValue[]=[]){}
  bind(...args:any[]){return new Statement(this.client,this.sql,values(args))}
  async first<T=Record<string,unknown>>(){return (await this.all<T>()).results[0]??null}
  async all<T=Record<string,unknown>>(){return result<T>(await this.client.execute({sql:this.sql,args:this.args}))}
  async run(){return this.all()}
}
export function adaptDatabase(client:Client):D1Database {
  return {
    prepare:sql=>new Statement(client,sql),
    async batch(statements){
      if(!statements.length)return [];
      const queries=statements.map(s=>{if(!(s instanceof Statement)||s.client!==client)throw Error('Transação inválida.');return {sql:s.sql,args:s.args}});
      // libSQL batch('write') is atomic: failed edits never leave half a save.
      return (await client.batch(queries,'write')).map(r=>result(r));
    }
  };
}
let database:D1Database;
export function getDatabase(){
  if(!database){
    const url=process.env.TURSO_DATABASE_URL;
    if(!url)throw Error('Configure TURSO_DATABASE_URL e execute npm run db:setup.');
    if(process.env.VERCEL&& !/^(libsql|https):\/\//.test(url))throw Error('A Vercel precisa de banco remoto persistente.');
    database=adaptDatabase(createClient({url,authToken:process.env.TURSO_AUTH_TOKEN||undefined,intMode:'number'}));
  }
  return database;
}
