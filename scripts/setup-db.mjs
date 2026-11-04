import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {connect,hash,insert,TABLES} from './db-common.mjs';

const db=connect();
try{
  const schema=await fs.readFile(new URL('../database/schema.sql',import.meta.url),'utf8');
  const content=JSON.parse(await fs.readFile(new URL('../database/content.json',import.meta.url),'utf8'));
  await db.executeMultiple(schema);
  const existing=await db.execute('SELECT count(*) n FROM entries');
  if(Number(existing.rows[0].n)>0){
    console.log('Banco já contém cadastros: conteúdo preservado, sem reimportação.');
  }else{
    // Auth provisioning must be validated before any content is written.
    const username=(process.env.ADMIN_INITIAL_USERNAME||'admin').trim().toLowerCase();
    if(!/^[-a-z0-9_.]{3,80}$/.test(username))throw Error('Usuário inicial inválido.');
    const credentials=await hash(process.env.ADMIN_INITIAL_PASSWORD);
    const tx=await db.transaction('write');
    try{
      // A second setup started in parallel must not overwrite the first one.
      const check=await tx.execute('SELECT count(*) n FROM entries');
      if(Number(check.rows[0].n)>0)throw Error('Outro processo inicializou o banco. Execute novamente.');
      for(const table of TABLES){
        const rows=content[table]||[];
        for(let i=0;i<rows.length;i+=40)await tx.batch(rows.slice(i,i+40).map(row=>insert(table,row)));
      }
      await tx.execute(insert('admin_users',{id:randomUUID(),username,...credentials,role:'admin',email:process.env.ADMIN_INITIAL_EMAIL||'',display_name:'Administrador',active:1,created_at:new Date().toISOString()}));
      await tx.execute({sql:"INSERT INTO settings (key,value) VALUES ('vercel_snapshot_20261104_v36','1')",args:[]});
      await tx.commit();console.log(`Importação concluída: ${content.entries.length} cadastros, ${content.source_records.length} fontes e conta administrativa.`);
    }catch(error){if(!tx.closed)await tx.rollback();throw error}finally{tx.close()}
  }
  const admins=await db.execute("SELECT count(*) n FROM admin_users WHERE role='admin' AND active=1");
  if(Number(admins.rows[0].n)===0)throw Error('Banco sem administrador ativo: execute npm run admin:password.');
  console.log('Banco pronto. Painel em /admin/.');
}catch(error){console.error(error instanceof Error?error.message:'Não foi possível preparar o banco.');process.exitCode=1}finally{db.close()}
