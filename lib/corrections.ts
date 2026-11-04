import updates from './content/corrections-20261028.json';
import newFoals from './content/foals-20261101.json';
import {suppliedFatherPhoto,suppliedMotherPhoto,isPhotoTemplate} from './catalog';
export const correctionMarker='initialized_corrections_20261028_v1';
// Data backfill, separate from schema migrations. Compare editorial fields before replacement.
export async function applyCorrections(db:D1Database){
 await replaceEclypsePhoto(db);
 await addSuppliedFatherPhotos(db);
 await addSuppliedMotherImages(db);
 await replacePortraitTemplate(db);
 await replaceNajaLandscapePhoto(db);
 await addNewFoals(db);
 await replaceGuinnessLandscapePhoto(db);
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(correctionMarker).first())return;
 const statements:D1PreparedStatement[]=[];
 for(const draft of updates.drafts){const columns=['id','slug','kind','title','body','image','gallery','info','pedigree','categories','status','source_url','published_at','updated_at','version'];statements.push(db.prepare('INSERT OR IGNORE INTO entries ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').bind(...columns.map(k=>['info','gallery','pedigree','categories'].includes(k)?JSON.stringify((draft as any)[k]):(draft as any)[k])));}
 for(const patch of updates.entries as any[]){const row=await db.prepare('SELECT * FROM entries WHERE id=?').bind(patch.id).first<any>();if(!row)continue;const info=JSON.parse(row.info);let changed=false;
  for(const [k,v] of Object.entries(patch.info||{}))if(info[k]===undefined){info[k]=v;changed=true;}
  const values:any={};for(const [k,v] of Object.entries(patch.changes||{}))if(row[k]===patch.expected[k]){values[k]=v;changed=true;}
  if(values.image){values.gallery=JSON.stringify([...new Set([row.image,...JSON.parse(row.gallery)])].filter(u=>u&&u!==values.image));}
  if(values.body!==undefined)delete info.bodyHtml;
  if(values.title&&row.kind==='animal')values.pedigree=JSON.stringify({...JSON.parse(row.pedigree),name:values.title});
  if(patch.id==='wp-1056'&&Array.isArray(info.videos))info.videos=info.videos.map((v:any)=>({...v,title:String(v.title||'').replace(/\s*[–-]\s*Vendido/gi,'')}));
  if(patch.changes.slug){const from=(row.kind==='crossing'?'/cruzamentos/':'/')+patch.expected.slug;statements.push(db.prepare('INSERT OR IGNORE INTO url_redirects (from_path,entry_id,target_path) VALUES (?,?,?)').bind(from,row.id,''));}
  if(patch.redirect)statements.push(db.prepare('INSERT OR IGNORE INTO url_redirects (from_path,entry_id,target_path) VALUES (?,NULL,?)').bind('/'+row.slug,patch.redirect));
  if(changed){values.info=JSON.stringify(info);values.updated_at='2026-10-28T18:00:00Z';const keys=Object.keys(values);statements.push(db.prepare('UPDATE entries SET '+keys.map(k=>k+'=?').join(',')+',version=version+1 WHERE id=? AND version=?').bind(...keys.map(k=>values[k]),row.id,row.version));}
 }
 for(const [k,v] of Object.entries(updates.settings))statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(k,v));
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(correctionMarker,'1'));
 await db.batch(statements);
}

async function addNewFoals(db:D1Database){
 const marker='initialized_foals_20261101_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const columns=['id','slug','kind','title','body','image','gallery','info','pedigree','categories','status','source_url','published_at','updated_at','version'];
 const statements=newFoals.map(entry=>db.prepare('INSERT OR IGNORE INTO entries ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').bind(...columns.map(k=>['info','gallery','pedigree','categories'].includes(k)?JSON.stringify((entry as any)[k]):(entry as any)[k])));
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}

async function replaceNajaLandscapePhoto(db:D1Database){
 const marker='initialized_ec_naja_landscape_20261101_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const oldURL='/assets/parents/ec-naja-20261101.png',newURL='/assets/parents/ec-naja-16x9-20261101.png';
 await db.batch([
  db.prepare('UPDATE entries SET image=replace(image,?,?),gallery=replace(gallery,?,?),info=replace(info,?,?),version=version+1 WHERE image=? OR instr(gallery,?)>0 OR instr(info,?)>0').bind(oldURL,newURL,oldURL,newURL,oldURL,newURL,oldURL,oldURL,oldURL),
  db.prepare('UPDATE visual_pages SET patches=replace(patches,?,?),revision=revision+1 WHERE instr(patches,?)>0').bind(oldURL,newURL,oldURL),
  db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1')
 ]);
}

async function replacePortraitTemplate(db:D1Database){
 const marker='initialized_placeholder_16x9_20261101_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const oldURL='/assets/parents/bhetania-jmen-template-20261101-vercel.webp',newURL='/assets/templates/photo-unavailable-16x9-vercel.webp';
 await db.batch([
  db.prepare('UPDATE entries SET image=replace(image,?,?),gallery=replace(gallery,?,?),info=replace(info,?,?),version=version+1 WHERE image=? OR instr(gallery,?)>0 OR instr(info,?)>0').bind(oldURL,newURL,oldURL,newURL,oldURL,newURL,oldURL,oldURL,oldURL),
  db.prepare('UPDATE visual_pages SET patches=replace(patches,?,?),revision=revision+1 WHERE instr(patches,?)>0').bind(oldURL,newURL,oldURL),
  db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1')
 ]);
}

// Keep a supplied named template distinct from an actual animal photograph.
async function addSuppliedMotherImages(db:D1Database){
 const marker='initialized_mother_images_20261101_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const rows=(await db.prepare('SELECT id,kind,title,image,info,version FROM entries').all<{id:string;kind:string;title:string;image:string;info:string;version:number}>()).results;
 const statements:D1PreparedStatement[]=[];
 for(const row of rows){
  const info=JSON.parse(row.info),ownImage=row.kind==='animal'&&!row.image?suppliedMotherPhoto(row.title):'',motherImage=!info.motherImage?suppliedMotherPhoto(info.mother):'';
  if(!ownImage&&!motherImage)continue;
  if(motherImage)info.motherImage=motherImage;
  if(ownImage)info.photoPlaceholder=isPhotoTemplate(ownImage);
  statements.push(db.prepare('UPDATE entries SET image=?,info=?,updated_at=?,version=version+1 WHERE id=? AND version=?').bind(ownImage||row.image,JSON.stringify(info),'2026-11-01T08:30:00Z',row.id,row.version));
 }
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}

// Import the supplied parent photographs once; later admin edits remain authoritative.
async function addSuppliedFatherPhotos(db:D1Database){
 const marker='initialized_father_photos_20261031_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const rows=(await db.prepare('SELECT id,info,version FROM entries').all<{id:string;info:string;version:number}>()).results;
 const statements:D1PreparedStatement[]=[];
 for(const row of rows){
  const info=JSON.parse(row.info),image=suppliedFatherPhoto(info.father);
  if(!image||info.fatherImage)continue;
  info.fatherImage=image;
  statements.push(db.prepare('UPDATE entries SET info=?,updated_at=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(info),'2026-10-31T23:10:00Z',row.id,row.version));
 }
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}

// Replace this exact photograph everywhere, while preserving other editorial media.
async function replaceEclypsePhoto(db:D1Database){
 const marker='initialized_eclypse_photo_20261028_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const oldURL='/assets/imported/dd0d5e6fd6b242ed32.webp';
 const newURL='/assets/imported/eclypse-des-forets-20261028.jpeg';
 await db.batch([
  db.prepare('UPDATE entries SET image=replace(image,?,?),gallery=replace(gallery,?,?),info=replace(info,?,?),version=version+1 WHERE image=? OR instr(gallery,?)>0 OR instr(info,?)>0').bind(oldURL,newURL,oldURL,newURL,oldURL,newURL,oldURL,oldURL,oldURL),
  db.prepare('UPDATE visual_pages SET patches=replace(patches,?,?),revision=revision+1 WHERE instr(patches,?)>0').bind(oldURL,newURL,oldURL),
  db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1')
 ]);
}

// Replace only the approved original cover once, preserving later editorial uploads.
async function replaceGuinnessLandscapePhoto(db:D1Database){
 const marker='initialized_guinness_landscape_20261104_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const row=await db.prepare('SELECT image,info,version FROM entries WHERE id=?').bind('wp-643').first<{image:string;info:string;version:number}>();
 if(!row)return;
 const statements:D1PreparedStatement[]=[];
 if(row.image==='/assets/imported/5663cf91475f64eb4f.webp'){
  const info={...JSON.parse(row.info),coverReviewPending:false};
  statements.push(db.prepare('UPDATE entries SET image=?,info=?,updated_at=?,version=version+1 WHERE id=? AND version=?').bind('/assets/imported/guinness-de-la-violle-1920x1080-20261104-vercel.webp',JSON.stringify(info),'2026-11-04T15:00:00Z','wp-643',row.version));
 }
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}
