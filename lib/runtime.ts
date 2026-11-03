import {createClient,type Client,type InValue,type ResultSet} from '@libsql/client';
import {put,head} from '@vercel/blob';

function projected(r:ResultSet){return {results:r.rows.map(row=>Object.fromEntries(r.columns.map(column=>[column,row[column]]))),success:true,meta:{changes:r.rowsAffected,last_row_id:Number(r.lastInsertRowid||0)}};}
export class SQLStatement {
 constructor(readonly client:Client,readonly sql:string,readonly args:InValue[]=[]){ }
 bind(...values:any[]){return new SQLStatement(this.client,this.sql,values);}
 async all<T=Record<string,unknown>>(){return projected(await this.client.execute({sql:this.sql,args:this.args})) as unknown as D1Result<T>;}
 async first<T=Record<string,unknown>>(column?:string):Promise<T|null>{const r=await this.all<any>();return (column?r.results[0]?.[column]:r.results[0])??null;}
 async run(){return this.all();}
}
export class SQLDatabase {
 constructor(readonly client:Client){}
 prepare(sql:string){return new SQLStatement(this.client,sql);}
 async batch(statements:SQLStatement[]){return (await this.client.batch(statements.map(s=>({sql:s.sql,args:s.args})),'write')).map(projected);}
}
let database:SQLDatabase|undefined;
export function getDatabase(){
 if(!database){
  const url=process.env.TURSO_DATABASE_URL;
  if(!url)throw Error('Configure TURSO_DATABASE_URL e importe o banco antes de publicar.');
  if(process.env.VERCEL&&url.startsWith('file:'))throw Error('Use um banco Turso remoto na Vercel.');
  database=new SQLDatabase(createClient({url,authToken:process.env.TURSO_AUTH_TOKEN,intMode:'number'}));
 }
 return database;
}
const bucket={
 async put(key:string,bytes:Uint8Array,options:any){return put('studpb/'+key,Buffer.from(bytes),{access:'public',addRandomSuffix:false,contentType:options.httpMetadata.contentType});},
 async get(key:string){
  try{const object=await head('studpb/'+key);const r=await fetch(object.url);if(!r.ok)return null;return {body:r.body,httpMetadata:{contentType:object.contentType}};}catch{return null;}
 }
};
let ready:Promise<void>|undefined;
export const env={
 get DB(){return getDatabase() as unknown as D1Database;},
 get BUCKET(){return process.env.BLOB_READ_WRITE_TOKEN?bucket:undefined;},
 ready(){return ready??=getDatabase().client.execute("SELECT value FROM settings WHERE key='initialized_v1'").then(r=>{if(!r.rows.length)throw Error('Execute npm run db:import antes de publicar.');}).catch(e=>{ready=undefined;throw e;});}
};
