import {createClient} from '@libsql/client';
import {readFile} from 'node:fs/promises';
const url=process.env.TURSO_DATABASE_URL;
if(!url)throw Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.');
const client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 const existing=await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
 if(existing.rows.length)throw Error('Banco não vazio. Importação cancelada para preservar os dados existentes. Use um banco novo.');
 const sql=await readFile(new URL('../database/studpb-producao-2026-11-01.sql',import.meta.url),'utf8');
 const transaction=await client.transaction('write');
 try{await transaction.executeMultiple(sql);await transaction.commit();}catch(error){await transaction.rollback();throw error;}finally{transaction.close();}
 console.log('Banco importado:',(await client.execute('SELECT count(*) AS total FROM entries')).rows[0].total,'cadastros.');
}finally{client.close();}
