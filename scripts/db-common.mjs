import {createClient} from '@libsql/client';
import {webcrypto} from 'node:crypto';
export function connect(){
  const url=process.env.TURSO_DATABASE_URL;
  if(!url)throw Error('Defina TURSO_DATABASE_URL em .env.local.');
  if(process.env.VERCEL&&!/^(libsql|https):\/\//.test(url))throw Error('Use banco remoto na Vercel.');
  return createClient({url,authToken:process.env.TURSO_AUTH_TOKEN||undefined,intMode:'number'});
}
export async function hash(password){
  if(typeof password!=='string'||password.length<16||password.length>200)throw Error('Defina uma senha com 16 a 200 caracteres.');
  const salt=Buffer.from(webcrypto.getRandomValues(new Uint8Array(16))).toString('hex');
  const key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const password_hash=Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:Buffer.from(salt,'hex'),iterations:210000,hash:'SHA-256'},key,256)).toString('hex');
  return {salt,password_hash,iterations:210000};
}
export const TABLES=['entries','settings','source_records','media','members','inquiries','audit','admin_users','visual_pages','url_redirects'];
export function insert(table,row){
  if(!TABLES.includes(table))throw Error('Tabela inválida.');
  const columns=Object.keys(row);if(columns.some(k=>!/^[_a-z]+$/.test(k)))throw Error('Coluna inválida.');
  return {sql:`INSERT INTO "${table}" (${columns.map(k=>'"'+k+'"').join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,args:Object.values(row)};
}
export const quote=v=>v===null||v===undefined?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
