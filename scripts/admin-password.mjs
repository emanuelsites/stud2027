import {randomUUID} from 'node:crypto';
import {connect,hash} from './db-common.mjs';
const db=connect();
try{
  const username=(process.env.ADMIN_USERNAME||'admin').trim().toLowerCase();
  if(!/^[-a-z0-9_.]{3,80}$/.test(username))throw Error('Usuário inválido.');
  const {salt,password_hash,iterations}=await hash(process.env.ADMIN_NEW_PASSWORD);
  const row=await db.execute({sql:'SELECT id FROM admin_users WHERE username=?',args:[username]});
  const id=row.rows[0]?.id||randomUUID();
  await db.batch([
    {sql:"INSERT INTO admin_users (id,username,password_hash,salt,iterations,role,email,display_name,active,created_at) VALUES (?,?,?,?,?,'admin','','Administrador',1,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,active=1",args:[id,username,password_hash,salt,iterations,new Date().toISOString()]},
    {sql:'DELETE FROM admin_sessions WHERE user_id=?',args:[id]}
  ],'write');
  console.log('Senha atualizada. Sessões anteriores revogadas.');
}catch(error){console.error(error instanceof Error?error.message:'Falha ao atualizar senha.');process.exitCode=1}finally{db.close()}
