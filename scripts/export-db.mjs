import fs from 'node:fs/promises';
import path from 'node:path';
import {connect,insert,quote,TABLES} from './db-common.mjs';
const db=connect();
try{
  const directory=path.resolve('backups');await fs.mkdir(directory,{recursive:true,mode:0o700});
  let sql='-- Stud PB / Turso e SQLite / '+new Date().toISOString()+'\n'+await fs.readFile(new URL('../database/schema.sql',import.meta.url),'utf8')+'\n';
  const tx=await db.transaction('read');
  try{for(const table of TABLES){const result=await tx.execute('SELECT * FROM "'+table+'"');for(const row of result.rows){const item=insert(table,Object.fromEntries(Object.entries(row)));let i=0;sql+=item.sql.replace(/\?/g,()=>quote(item.args[i++]))+';\n';}}}finally{tx.close()}
  const output=path.join(directory,'studpb-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sql');
  await fs.writeFile(output,sql,{mode:0o600});console.log('Backup criado em '+output+'. Inclui hashes de contas: mantenha-o privado. Sessões não incluídas.');
}catch(error){console.error(error instanceof Error?error.message:'Não foi possível exportar.');process.exitCode=1}finally{db.close()}
