import {build} from 'esbuild';
import {createClient} from '@libsql/client';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'studpb-vercel-'));
process.env.TURSO_DATABASE_URL='file:'+join(directory,'test.db');
const imported=spawnSync(process.execPath,['scripts/import-db.mjs'],{env:process.env,encoding:'utf8'});assert.equal(imported.status,0,imported.stderr);
const refused=spawnSync(process.execPath,['scripts/import-db.mjs'],{env:process.env,encoding:'utf8'});assert.notEqual(refused.status,0,'Refuse destructive import into existing database');
await build({entryPoints:['lib/server.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:'tests/.runtime-test.mjs'});
const {handle}=await import('./.runtime-test.mjs?'+Date.now());
const client=createClient({url:process.env.TURSO_DATABASE_URL,intMode:'number'});
const host='https://studpb.test';let session='';
const get=(path,headers={})=>handle(new Request(host+path,{headers:{Cookie:session,...headers}}));
const post=(path,data,origin=host)=>handle(new Request(host+path,{method:'POST',headers:{Origin:origin,Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(data)}));
try{
 const all=(await client.execute('SELECT * FROM entries')).rows;assert.equal(all.length,73);
 for(const path of ['/','/potros','/eguas','/embrioes/congelados','/gestacoes','/noticias','/nossa-historia','/contato','/admin'])assert.equal((await get(path)).status,200,path);
 for(const e of all.filter(e=>e.status==='published')){
  const prefix=e.kind==='animal'?'/animais/':e.kind==='crossing'?'/cruzamentos/':e.kind==='article'?'/noticias/':'/';
  assert.equal((await get(prefix+e.slug)).status,200,e.title);
 }
 assert.equal((await get('/api/admin',{'oai-authenticated-user-email':'owner@example.test','oai-authenticated-user-id':'owner'})).status,401);
 assert.equal((await get('/admin/pedigree/wp-2750')).status,401);
 const password='Synthetic-test-only-831!',salt='a1'.repeat(24);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const hash=Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Buffer.from(salt,'hex'),iterations:100000,hash:'SHA-256'},key,256)).toString('hex');
 await client.execute({sql:"UPDATE admin_users SET password_hash=?,salt=? WHERE username='admin'",args:[hash,salt]});
 assert.equal((await post('/api/auth/login',{username:'admin',password},'https://foreign.test')).status,403);
 assert.equal((await post('/api/auth/login',{username:'admin',password:'wrong'})).status,401);
 const login=await post('/api/auth/login',{username:'admin',password});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie');for(const attr of ['Secure','HttpOnly','SameSite=Strict'])assert(cookie.includes(attr));session=cookie.split(';')[0];
 const panel=await(await get('/api/admin')).json();assert.equal(panel.user.role,'admin');assert.equal(panel.entries.length,73);
 const entry=panel.entries.find(e=>e.slug==='hello-my-dame-pb');
 assert.equal((await get('/admin/pedigree/'+entry.id)).status,200);assert.equal((await get('/admin/visual')).status,200);
 const profile=await(await get('/animais/'+entry.slug)).text();assert(profile.includes('gallery-thumbnails'));assert(profile.includes('paternal-first'));assert(profile.includes(entry.gallery[0]));
 entry.body='Texto revisto no admin e persistido no Turso.';
 assert.equal((await post('/api/entries',entry,'https://foreign.test')).status,403);
 assert.equal((await post('/api/entries',entry)).status,200);assert.equal((await post('/api/entries',entry)).status,409);
 assert((await(await get('/animais/'+entry.slug)).text()).includes(entry.body));
 const other=createClient({url:process.env.TURSO_DATABASE_URL});assert.equal((await other.execute({sql:'SELECT body FROM entries WHERE id=?',args:[entry.id]})).rows[0].body,entry.body);other.close();
 const context=await(await get('/api/visual/context?path=%2F')).json();
 const visual={path:'/',revision:context.revision,globalRevision:context.globalRevision,patches:[{key:'main/h2:0',kind:'text',html:'Título editado',styles:{color:'#725432'}}],globalPatches:[],records:[]};
 assert.equal((await post('/api/visual/save',visual)).status,200);assert.equal((await post('/api/visual/save',visual)).status,409);
 assert((await(await get('/')).text()).includes('Título editado'));
 const badFile=new FormData();badFile.set('file',new File(['not an image'],'fake.png',{type:'image/png'}));
 assert.equal((await handle(new Request(host+'/api/upload',{method:'POST',headers:{Origin:host,Cookie:session},body:badFile}))).status,400);
 try{await client.batch([{sql:'INSERT INTO settings (key,value) VALUES (?,?)',args:['atomic-test','yes']},{sql:'INSERT INTO entries (id) VALUES (?)',args:[entry.id]}],'write');assert.fail('Batch must roll back');}catch(error){assert.equal((await client.execute("SELECT * FROM settings WHERE key='atomic-test'")).rows.length,0);}
 const sql=await(await get('/api/export.sql')).text();const restored=new DatabaseSync(':memory:');restored.exec(sql);assert.equal(restored.prepare('SELECT count(*) n FROM entries').get().n,73);assert.equal(restored.prepare('SELECT count(*) n FROM admin_sessions').get().n,0);restored.close();
 assert.equal((await post('/api/auth/logout',{})).status,200);assert.equal((await get('/api/admin')).status,401);
 assert((await readFile('public/upload-client.js','utf8')).length>1000);
 console.log('PASS: import 73 records, reject overwrite, real libSQL adapter, public pages, login/session/CSRF, spoofed-header rejection, catalog and visual persistence, gallery/pedigree, conflict detection, atomic rollback, SQL backup/restore, logout.');
}finally{client.close();await rm(directory,{recursive:true,force:true});await rm('tests/.runtime-test.mjs',{force:true});}
