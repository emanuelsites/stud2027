import references from './content/hippomundo-completions-20261104.json';
import {key} from './catalog';

type Node={name:string;sex:string;father:Node|null;mother:Node|null};
type Reference={name:string;aliases:string[];source:string;sourceLabel:string;pedigree:Node};
const known=references as Reference[];
const index=new Map(known.flatMap(r=>[r.name,...r.aliases].map(name=>[key(name),r] as const)));
const missing=(node:any)=>!node?.name||/^(?:não informad[oa]|unknown|[-—])$/i.test(String(node.name).trim());
const same=(a:string,b:string)=>key(a)===key(b)||index.get(key(a))===index.get(key(b))&&index.has(key(a));

// Fill absent nodes only. A named editorial ancestor takes precedence, including conflicting values.
export function completeVerifiedPedigree(record:any){
 const sources=new Set<string>(),labels=new Set<string>();let filled=0;
 function walk(node:any,depth=0,ref?:Node,owner?:Reference):any{
  if(depth>3)return null;
  if(missing(node)){
   if(!ref)return node;
   filled++;if(owner){sources.add(owner.source);labels.add(owner.sourceLabel);}
   node={name:ref.name,sex:ref.sex,father:null,mother:null};
  }
  const own=index.get(key(node.name));
  if(own){ref=own.pedigree;owner=own;}
  else if(ref&&!same(node.name,ref.name)){ref=undefined;owner=undefined;}
  if(depth===3)return node;
  return {...node,father:walk(node.father,depth+1,ref?.father||undefined,owner),mother:walk(node.mother,depth+1,ref?.mother||undefined,owner)};
 }
 return {pedigree:walk(record),filled,sources:[...sources],labels:[...labels]};
}

export async function applyVerifiedPedigreeCompletions(db:D1Database){
 const marker='initialized_hippomundo_completions_20261104_v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(marker).first())return;
 const rows=(await db.prepare('SELECT id,kind,categories,info,pedigree,version FROM entries').all<{id:string;kind:string;categories:string;info:string;pedigree:string;version:number}>()).results;
 const statements:D1PreparedStatement[]=[];
 for(const row of rows){
  const original=JSON.parse(row.pedigree),result=completeVerifiedPedigree(original);
  const maternal=row.kind==='crossing'&&JSON.parse(row.categories).includes('congelados')?completeVerifiedPedigree(original?.mother):null;
  if(!result.filled&&!maternal?.filled)continue;
  const info=JSON.parse(row.info);
  info.pedigreeSources=[...new Set([...(info.pedigreeSources||[]),...result.sources])];
  info.pedigreeCompletionsReviewedAt='2026-11-04';
  info.pedigreeCompletionCount=result.filled;
  if(maternal?.filled){
   info.maternalPedigreeSources=[...new Set([...(info.maternalPedigreeSources||[info.maternalPedigreeSource||'']).filter(Boolean),...maternal.sources])];
   info.maternalPedigreeVerification=info.maternalPedigreeVerification||'partial';
   info.maternalPedigreeReviewNote='Ascendentes antes ausentes conferidos no Hippomundo em 04/11/2026.'+(maternal.labels.includes('ABCCH via BrazHorse')?' Regina Metodo: filiação do studbook ABCCH reproduzido no BrazHorse; cadastro não localizado no Hippomundo.':'');
  }
  if(!info.pedigreeVerification||info.pedigreeVerification==='legacy')info.pedigreeVerification='partial';
  const note='Ascendentes antes ausentes conferidos no Hippomundo em 04/11/2026.'+(result.labels.includes('ABCCH via BrazHorse')?' Regina Metodo: filiação do studbook ABCCH reproduzido no BrazHorse; cadastro não localizado no Hippomundo.':'');
  info.pedigreeReviewNote=[info.pedigreeReviewNote,note].filter(Boolean).join(' ');
  statements.push(db.prepare('UPDATE entries SET pedigree=?,info=?,updated_at=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(result.pedigree),JSON.stringify(info),new Date().toISOString(),row.id,row.version));
 }
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(marker,'1'));
 await db.batch(statements);
}
