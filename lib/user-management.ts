import {passwordHash,randomHex} from './local-auth';
export async function saveMember(db:D1Database,user:any,d:any){
  if(typeof d.username!=='string'||!/^[-a-z0-9_.]{3,80}$/.test(d.username)||!['admin','editor'].includes(d.role)||![0,1].includes(d.active)||typeof d.email!=='string'||(d.email&&!/^\S+@\S+\.\S+$/.test(d.email))||d.email.length>200)throw Error('Usuário inválido.');
  const old=await db.prepare('SELECT id FROM admin_users WHERE username=?').bind(d.username).first<{id:string}>();
  if(old?.id===user.userId&&(d.active!==1||d.role!=='admin'))throw Error('Alteração inválida: você não pode remover seu próprio acesso de administrador.');
  if(d.password!==undefined&&d.password!==''&&(typeof d.password!=='string'||d.password.length<16||d.password.length>200))throw Error('Senha inválida: use 16 a 200 caracteres.');
  if(!old&&!d.password)throw Error('Preencha a senha do novo usuário.');
  const salt=d.password?randomHex(16):'',hash=d.password?await passwordHash(d.password,salt):'';
  const statements:D1PreparedStatement[]=[];
  if(old){
    statements.push(db.prepare('UPDATE admin_users SET email=?,role=?,active=? WHERE id=?').bind(d.email,d.role,d.active,old.id));
    if(d.password)statements.push(db.prepare('UPDATE admin_users SET salt=?,password_hash=?,iterations=210000 WHERE id=?').bind(salt,hash,old.id));
    // Role/access/password changes revoke existing sessions immediately.
    statements.push(db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(old.id));
  }else{
    statements.push(db.prepare('INSERT INTO admin_users (id,username,password_hash,salt,iterations,role,email,display_name,active,created_at) VALUES (?,?,?,?,210000,?,?,?,?,?)').bind(crypto.randomUUID(),d.username,hash,salt,d.role,d.email,d.username,d.active,new Date().toISOString()));
  }
  await db.batch(statements);
}
