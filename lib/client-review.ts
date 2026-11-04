import {key,genetics} from './catalog';
import type {Entry} from './store';

const source='https://www.hippomundo.com/en/pedigree/performance/49178-chacco-blue';
const ancestor=(name:string,sex:string,father:any=null,mother:any=null)=>({name,sex,father,mother});
const chacco=ancestor('Chacco Blue','male',
 ancestor('Chambertin','male',ancestor('Cambridge','male'),ancestor('Desiree VII','female')),
 ancestor('MoM’s Contara','female',ancestor('Contender','male'),ancestor('Godahra II','female')));
const unknown=(node:any)=>!node?.name||/^(?:não informad[oa]|unknown|[-—])$/i.test(node.name.trim());
// Only fill missing ancestors, and keep the site's three-generation depth limit.
export function completeChaccoPedigree(record:any){
 let changed=false;
 function fill(node:any,reference:any,depth:number):any{
  if(depth>3)return null;
  if(unknown(node)&&reference){changed=true;node={name:reference.name,sex:reference.sex,father:null,mother:null};}
  if(!node)return node;
  const out={...node};
  for(const side of ['father','mother'])if(depth<3)out[side]=fill(node[side],reference?.[side],depth+1);
  return out;
 }
 function walk(node:any,depth=0):any{
  if(!node||depth>3)return node;
  if(key(node.name)==='chaccoblue')return fill(node,chacco,depth);
  const out={...node};
  if(depth<3)for(const side of ['father','mother'])out[side]=walk(node[side],depth+1);
  return out;
 }
 const pedigree=walk(record);return {pedigree,changed};
}
export async function applyClientReview(db:D1Database){
 const marker='initialized_client_review_20261104_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const rows=(await db.prepare('SELECT id,kind,title,categories,info,pedigree,version FROM entries').all<any>()).results;
 const statements:D1PreparedStatement[]=[];
 for(const row of rows){
  const info=JSON.parse(row.info),categories=JSON.parse(row.categories);
  const result=completeChaccoPedigree(JSON.parse(row.pedigree));
  let changed=result.changed;
  if(row.kind==='crossing'&&categories.includes('gestacoes')&&/^Próxima geração\s*\d+$/i.test(info.commercialName||row.title)){
   const name=genetics({...row,info} as Entry);if(name){info.commercialName=name;changed=true;}
  }
  if(result.changed){
   info.pedigreeSources=[...new Set([...(info.pedigreeSources||[]),source])];
   info.pedigreeReviewNote=[info.pedigreeReviewNote,'Ascendentes ausentes de Chacco Blue preenchidos conforme Hippomundo em 04/11/2026.'].filter(Boolean).join(' ');
  }
  if(changed)statements.push(db.prepare('UPDATE entries SET info=?,pedigree=?,updated_at=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(info),JSON.stringify(result.pedigree),'2026-11-04T12:00:00Z',row.id,row.version));
 }
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}
