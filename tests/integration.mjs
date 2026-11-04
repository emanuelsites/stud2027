import {build} from 'esbuild';
import {createClient} from '@libsql/client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'studpb-vercel-test-'));
const databaseURL='file:'+path.join(temp,'integration.db');
const password='Test-'+randomUUID();
const setupEnv={...process.env,TURSO_DATABASE_URL:databaseURL,TURSO_AUTH_TOKEN:'',ADMIN_INITIAL_USERNAME:'admin',ADMIN_INITIAL_PASSWORD:password,SITE_URL:'https://stud.test'};
const run=(file,env=setupEnv)=>{const result=spawnSync(process.execPath,[file],{env,encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);return result.stdout};
let client;
try{
  run('scripts/setup-db.mjs');
  process.env.TURSO_DATABASE_URL=databaseURL;process.env.TURSO_AUTH_TOKEN='';process.env.SITE_URL='https://stud.test';
  await build({entryPoints:['lib/server.ts'],bundle:true,platform:'node',packages:'external',format:'esm',outfile:'tests/.server-test.mjs'});
  const {handle}=await import('./.server-test.mjs?'+Date.now());
  client=createClient({url:databaseURL,intMode:'number'});
  const get=(url,cookie='')=>handle(new Request('https://stud.test'+url,{headers:{Cookie:cookie}}));
  const post=(url,data,cookie='',origin='https://stud.test',extra={})=>handle(new Request('https://stud.test'+url,{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(data)}));
  const body=async response=>{assert.equal(response.status,200);return response.text()};
  assert.equal((await get('/api/admin')).status,401);
  assert.equal((await get('/admin/pedigree/wp-2750/')).status,401);
  assert((await body(await get('/admin/'))).includes('admin-login-form'));
  assert.equal((await post('/api/auth/login',{username:'admin',password:'wrong'})).status,401);
  assert.equal((await post('/api/auth/login',{username:'admin',password},'','https://attacker.test')).status,403);
  const login=await post('/api/auth/login',{username:'admin',password});assert.equal(login.status,200);
  const header=login.headers.get('set-cookie');assert(header.includes('HttpOnly; Secure; SameSite=Strict'));
  const cookie=header.split(';')[0];
  const admin=await(await get('/api/admin',cookie)).json();assert.equal(admin.entries.length,73);assert.equal(admin.user.role,'admin');
  assert(!JSON.stringify(admin.members).includes('password_hash'));
  const userHash=await client.execute('SELECT password_hash FROM admin_users');assert(!String(userHash.rows[0].password_hash).includes(password));
  const home=await body(await get('/'));assert(!home.includes('O futuro já tem nome.'));assert(!home.includes('id="foal-grid"'));assert(home.includes('href="/potros/"'));assert(home.includes('u=https%3A%2F%2Fstud.test'));
  for(const page of ['/potros/','/gestacoes/','/embrioes/congelados/','/eguas/pb-matriz/','/nossa-historia/','/contato/','/noticias/'])await body(await get(page));
  const paths=new Set();
  let trees=0;
  const visitTree=(tree,depth=0)=>{assert(tree?.name?.trim());assert(!/Não informad/i.test(tree.name));if(depth<3){visitTree(tree.father,depth+1);visitTree(tree.mother,depth+1)}};
  for(const entry of admin.entries.filter(e=>e.status==='published')){
    const prefix=entry.kind==='animal'?'/animais/':entry.kind==='crossing'?'/cruzamentos/':entry.kind==='article'?'/noticias/':'/';
    const html=await body(await get(prefix+entry.slug+'/'));
    if(['animal','crossing'].includes(entry.kind)){
      const match=html.match(/<script id="pedigree-data" type="application\/json">([\s\S]*?)<\/script>/);assert(match,entry.title);visitTree(JSON.parse(match[1]).record);trees++;
    }
    for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+|\/[^"/?]+\.(?:css|js))"/g))paths.add(match[1]);
  }
  assert.equal(trees,63);
  for(const asset of paths)assert(fs.existsSync('public'+asset),'Missing asset: '+asset);
  const uricas=await body(await get('/cruzamentos/proxima-geracao-01/'));for(const name of ['Uriko','T-Cassina','Untouchable','Wizzard 23','Cassini I','Chika’s Way'])assert(uricas.includes(name));
  const guinness=admin.entries.find(e=>e.slug==='guinness-de-la-violle');assert(guinness.image.includes('1920x1080'));
  const gest19=await body(await get('/cruzamentos/proxima-geracao-19/'));assert(gest19.includes('<dd>2025</dd>'));
  const foals=admin.entries.filter(e=>e.status==='published'&&e.categories.includes('potros'));assert.equal(foals.length,17);
  assert.equal((await get('/home/potros/')).status,301);
  const first=structuredClone(admin.entries.find(e=>e.kind==='animal'&&e.status==='published'));
  first.body='Texto persistente de verificação Vercel.';
  assert.equal((await post('/api/entries',first,cookie,'https://attacker.test')).status,403);
  assert.equal((await post('/api/entries',first,cookie)).status,200);
  assert.equal((await post('/api/entries',first,cookie)).status,409);
  assert.equal((await client.execute({sql:'SELECT body FROM entries WHERE id=?',args:[first.id]})).rows[0].body,first.body);
  assert((await body(await get('/admin/pedigree/'+first.id+'/',cookie))).includes('saveSite'));
  assert((await body(await get('/admin/visual/?path=%2F',cookie))).includes('visual-frame'));
  const visual=await(await get('/api/visual/context?path=%2F',cookie)).json();
  const patch={path:'/',revision:visual.revision,globalRevision:visual.globalRevision,operationId:randomUUID(),patches:[],globalPatches:[],records:[{id:first.id,version:first.version+1,changes:{bodyHtml:'<p>Texto do editor visual Vercel.</p>'}}]};
  assert.equal((await post('/api/visual/save',patch,cookie)).status,200);
  assert.equal((await client.execute({sql:'SELECT body FROM entries WHERE id=?',args:[first.id]})).rows[0].body,'Texto do editor visual Vercel.');
  assert.equal((await post('/api/visual/save',patch,cookie)).status,409);
  // Adapter transactions must roll back all writes if one statement fails.
  const {adaptDatabase}=await import('./.database-test.mjs').catch(async()=>{
    await build({entryPoints:['lib/database.ts'],bundle:true,platform:'node',packages:'external',format:'esm',outfile:'tests/.database-test.mjs'});return import('./.database-test.mjs');
  });
  const db=adaptDatabase(client);
  await assert.rejects(db.batch([db.prepare("INSERT INTO settings(key,value) VALUES ('rollback_test','1')"),db.prepare('INSERT INTO no_such_table(x) VALUES (1)')]));
  assert.equal(await db.prepare("SELECT * FROM settings WHERE key='rollback_test'").first(),null);
  // Editor accounts use their own sessions and cannot elevate their role.
  const editorPass='Editor-'+randomUUID();
  assert.equal((await post('/api/members',{username:'editor',password:editorPass,role:'editor',email:'editor@example.test',active:1},cookie)).status,200);
  const editorLogin=await post('/api/auth/login',{username:'editor',password:editorPass});assert.equal(editorLogin.status,200);const editorCookie=editorLogin.headers.get('set-cookie').split(';')[0];
  assert.equal((await get('/api/admin',editorCookie)).status,200);
  assert.equal((await post('/api/settings',{welcome:'test'},editorCookie)).status,403);
  assert.equal((await post('/api/members',{username:'badadmin',password:editorPass,role:'admin',email:'',active:1},editorCookie)).status,403);
  assert.equal((await get('/api/export.sql',editorCookie)).status,403);
  assert.equal((await post('/api/members',{username:'editor',email:'editor@example.test',role:'editor',active:0},cookie)).status,200);
  assert.equal((await get('/api/admin',editorCookie)).status,401);
  assert.equal((await post('/api/members',{username:'admin',email:'',role:'editor',active:0},cookie)).status,400);
  assert.equal((await post('/api/inquiries',{name:'Visitante',email:'visitante@example.test',phone:'',interest:'Potros',message:'Quero informações sobre os potros.',consent:true})).status,200);
  assert.equal((await client.execute('SELECT count(*) n FROM inquiries')).rows[0].n,1);
  // Upload authorization and forged callback checks run without cloud credentials.
  process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_test_dummy';
  const uploadRequest={type:'blob.generate-client-token',payload:{pathname:'studpb/'+randomUUID()+'.png',multipart:false,clientPayload:null}};
  assert.equal((await post('/api/blob/upload',uploadRequest)).status,401);
  assert.equal((await post('/api/blob/upload',uploadRequest,cookie,'https://attacker.test')).status,400);
  assert.equal((await post('/api/blob/upload',{...uploadRequest,payload:{...uploadRequest.payload,pathname:'outside/payload.html'}},cookie)).status,400);
  assert.equal((await post('/api/blob/upload',{type:'blob.upload-completed',payload:{blob:{url:'https://attacker.test/a.png'},tokenPayload:'{}'}},cookie)).status,400);
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const exportSQL=await body(await get('/api/export.sql',cookie));assert(!exportSQL.includes('INSERT INTO "admin_sessions"'));assert(exportSQL.includes('Turso'));
  const restore=createClient({url:'file:'+path.join(temp,'restore.db')});await restore.executeMultiple(exportSQL);assert.equal((await restore.execute('SELECT count(*) n FROM entries')).rows[0].n,73);restore.close();
  // Re-running installation must preserve new editorial content.
  run('scripts/setup-db.mjs');assert.equal((await client.execute({sql:'SELECT body FROM entries WHERE id=?',args:[first.id]})).rows[0].body,'Texto do editor visual Vercel.');
  assert.equal((await post('/api/auth/logout',{},cookie)).status,200);assert.equal((await get('/api/admin',cookie)).status,401);
  for(let i=0;i<8;i++)assert.equal((await post('/api/auth/login',{username:'  unknown  ',password:'wrong'})).status,401);
  assert.equal((await post('/api/auth/login',{username:'unknown',password:'wrong'})).status,429);
  const resetPassword='Reset-'+randomUUID();run('scripts/admin-password.mjs',{...setupEnv,ADMIN_USERNAME:'admin',ADMIN_NEW_PASSWORD:resetPassword});
  assert.equal((await post('/api/auth/login',{username:'admin',password:resetPassword})).status,200);
  console.log('PASS: Turso/libSQL real local adapter, 73 records, 63 complete pedigrees, 17 foals, static assets, Vercel home, own login, sessions, CSRF, roles, revocation, edits, conflicts, visual/pedigree editors, atomic rollback, inquiries, SQL backup/restore, repeat-safe setup and password recovery.');
}finally{
  client?.close();for(const file of ['tests/.server-test.mjs','tests/.database-test.mjs'])if(fs.existsSync(file))fs.unlinkSync(file);
  fs.rmSync(temp,{recursive:true,force:true});
}
