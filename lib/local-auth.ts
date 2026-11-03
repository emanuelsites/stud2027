import bootstrap from './content/admin-bootstrap.json';
export const cookieName='studpb_admin';
const encoder=new TextEncoder();
export const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const hashToken=async(token:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(token)));
export async function passwordHash(password:string,salt:string,iterations=100000){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g)||[],s=>parseInt(s,16)),iterations,hash:'SHA-256'},key,256));}
function same(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export async function seedAdmin(db:D1Database){await db.prepare('INSERT OR IGNORE INTO admin_users (id,username,password_hash,salt,iterations,active,created_at) VALUES (?,?,?,?,?,?,?)').bind(bootstrap.id,bootstrap.username,bootstrap.password_hash,bootstrap.salt,bootstrap.iterations,bootstrap.active,bootstrap.created_at).run();}
export async function localUser(req:Request,db:D1Database){const token=(req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=await db.prepare('SELECT u.id,u.username FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(await hashToken(token),new Date().toISOString()).first<{id:string;username:string}>();return row?{userId:row.id,email:row.username+'@studpb.local',displayName:'Administrador',role:'admin',local:true}:null;}
export async function login(req:Request,db:D1Database){
 const data:any=await req.json();if(typeof data.username!=='string'||data.username.length>80||typeof data.password!=='string'||data.password.length>200)return {status:400,error:'Confira o usuário e a senha.'};
 const ip=req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'anonymous';const bucket=Math.floor(Date.now()/900000);const key='login:'+await hashToken(ip+'|'+data.username.toLowerCase()+'|'+bucket);
 const count=await db.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,new Date((bucket+1)*900000).toISOString()).first<{count:number}>();
 if((count?.count||0)>8)return {status:429,error:'Muitas tentativas. Aguarde 15 minutos para tentar novamente.'};
 const row=await db.prepare('SELECT * FROM admin_users WHERE username=? AND active=1').bind(data.username.trim().toLowerCase()).first<any>();const computed=await passwordHash(data.password,row?.salt||bootstrap.salt,row?.iterations||bootstrap.iterations);
 if(!row||!same(computed,row.password_hash))return {status:401,error:'Usuário ou senha incorretos.'};
 const token=hex(crypto.getRandomValues(new Uint8Array(32)).buffer);const now=new Date();
 await db.batch([db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now.toISOString()),db.prepare('INSERT INTO admin_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(await hashToken(token),row.id,new Date(now.getTime()+8*3600000).toISOString(),now.toISOString()),db.prepare('DELETE FROM rate_limits WHERE key=?').bind(key)]);
 return {status:200,cookie:cookieName+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800'};
}
export async function logout(req:Request,db:D1Database){const token=(req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(token)await db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hashToken(token)).run();return cookieName+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';}
