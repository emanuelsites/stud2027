import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'studpb-http-'));
const password='HTTP-'+randomUUID(),port=43173,base='http://127.0.0.1:'+port;
const env={...process.env,TURSO_DATABASE_URL:'file:'+path.join(temp,'http.db'),TURSO_AUTH_TOKEN:'',ADMIN_INITIAL_USERNAME:'admin',ADMIN_INITIAL_PASSWORD:password,SITE_URL:base,NEXT_TELEMETRY_DISABLED:'1'};
const setup=spawnSync(process.execPath,['scripts/setup-db.mjs'],{env,encoding:'utf8'});assert.equal(setup.status,0,setup.stdout+setup.stderr);
let output='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
server.stdout.on('data',b=>output+=b.toString());server.stderr.on('data',b=>output+=b.toString());
try{
  // Bounded readiness checks, not an arbitrary browser pause.
  let ready=false;
  for(let i=0;i<50;i++){try{const response=await fetch(base+'/admin');if(response.status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert(ready,output);
  const home=await fetch(base+'/');assert.equal(home.status,200);const text=await home.text();assert(!text.includes('O futuro já tem nome.'));assert(text.includes('Genética selecionada'));
  assert.equal((await fetch(base+'/assets/logo.svg')).status,200);
  assert.equal((await fetch(base+'/admin-upload.js')).status,200);
  assert.equal((await fetch(base+'/api/admin')).status,401);
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});assert.equal(login.status,200,await login.clone().text());
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const panel=await fetch(base+'/api/admin',{headers:{Cookie:cookie}});assert.equal(panel.status,200);assert.equal((await panel.json()).entries.length,73);
  assert.equal((await fetch(base+'/admin/visual?path=%2F',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await fetch(base+'/cruzamentos/proxima-geracao-01')).status,200);
  const redirect=await fetch(base+'/home/potros',{redirect:'manual'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),base+'/potros/');
  const sql=await fetch(base+'/api/export.sql',{headers:{Cookie:cookie}});assert.equal(sql.status,200);assert(Number(sql.headers.get('content-length')||0)<4_500_000);assert((await sql.text()).includes('Turso'));
  // Sensitive data folders and repository source are not public static files.
  for(const url of ['/database/content.json','/database/studpb.sqlite','/.env.local'])assert.equal((await fetch(base+url)).status,404);
  console.log('PASS: actual Next.js production server: public pages, assets, login/cookie, admin API, visual editor, pedigree page, SQL export, and no public database/source files.');
}finally{
  server.kill('SIGTERM');await new Promise(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',resolve)});
  fs.rmSync(temp,{recursive:true,force:true});
}
