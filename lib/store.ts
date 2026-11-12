import seed from './content/seed.json';
import {normalizeVideos} from './media';
import {forecastDate} from './catalog';
export type Entry={id:string;slug:string;kind:string;title:string;body:string;image:string;gallery:string[];info:Record<string,any>;pedigree:any;categories:string[];status:string;source_url:string;published_at:string;updated_at:string;version:number};
export const initial=seed;
export const isEditorialImage=(url:string)=>!/(?:c66cf9b382e738721d|gototopbtn)/i.test(url);
export const entryColumns=['id','slug','kind','title','body','image','gallery','info','pedigree','categories','status','source_url','published_at','updated_at','version'];
export function entryValues(e:Entry){return entryColumns.map(k=>['gallery','info','pedigree','categories'].includes(k)?JSON.stringify(e[k as keyof Entry]):e[k as keyof Entry]);}
export function decodeEntry(r:any):Entry{const e={...r};for(const k of ['gallery','info','pedigree','categories']){try{e[k]=JSON.parse(e[k]);}catch{e[k]=k==='gallery'||k==='categories'?[]:{}}}if(Array.isArray(e.gallery))e.gallery=e.gallery.filter(isEditorialImage);return e;}
export async function initialize(db:D1Database){
 const ready=await db.prepare("SELECT value FROM settings WHERE key='initialized_v1'").first();
 if(!ready)throw new Error('Importe o banco aprovado com npm run db:import antes de iniciar o site.');
}
export async function listEntries(db:D1Database,all=false){const r=await db.prepare('SELECT * FROM entries'+(all?'':" WHERE status='published'")+' ORDER BY published_at DESC,title').all();return r.results.map(decodeEntry);}
export async function readSettings(db:D1Database){const r=await db.prepare('SELECT key,value FROM settings').all<{key:string;value:string}>();return Object.fromEntries(r.results.filter(x=>!x.key.startsWith('initialized')).map(x=>[x.key,x.value]));}
export function validateEntry(input:any):Entry{
 if(!input||typeof input!=='object')throw Error('Cadastro inválido.');
 const e={...input};
 for(const k of ['title','slug','kind','body','image','status'])if(typeof e[k]!=='string')throw Error('Preencha os dados do cadastro.');
 if(e.title.length<1||e.title.length>180||!/^[-a-z0-9]{1,180}$/.test(e.slug)||e.body.length>80000)throw Error('Nome, endereço ou texto inválido.');
 if(!['animal','crossing','article','page'].includes(e.kind)||!['published','draft','archived'].includes(e.status))throw Error('Tipo ou situação inválida.');
 const safeImage=(s:any)=>typeof s==='string'&&s.length<2000&&(s===''||s.startsWith('/assets/')||s.startsWith('/media/')||/^https:\/\/[^\s<>"']+$/.test(s));
 if(!safeImage(e.image)||!Array.isArray(e.gallery)||e.gallery.length>20||!e.gallery.every(safeImage))throw Error('Imagem inválida.');
 e.gallery=e.gallery.filter(isEditorialImage);
 if(!Array.isArray(e.categories)||!e.categories.every((v:any)=>['esporte','matriz','futuras','potros','congelados','gestacoes'].includes(v)))throw Error('Categoria inválida.');
 if(!e.info||typeof e.info!=='object'||Array.isArray(e.info)||JSON.stringify(e.info).length>15000)throw Error('Ficha técnica inválida.');
 e.info={...e.info,videos:normalizeVideos(e.info.videos)};
 for(const k of ['fatherImage','motherImage'])if(e.info[k]!==undefined&&!safeImage(e.info[k]))throw Error('Imagem parental inválida.');
 if(e.info.commercialName!==undefined&&(typeof e.info.commercialName!=='string'||e.info.commercialName.length>100))throw Error('Nome comercial inválido.');
 if(e.info.featureOrder!==undefined&&(!Number.isInteger(e.info.featureOrder)||e.info.featureOrder<0||e.info.featureOrder>999))throw Error('Ordem de destaque inválida.');
 if(e.info.pregnancyStatus&&!['active','review','born','closed'].includes(e.info.pregnancyStatus))throw Error('Situação da gestação inválida.');
 if(e.info.forecast&&!forecastDate(e.info.forecast))throw Error('Previsão inválida. Use DD/MM/AAAA ou AAAA.');
 e.gallery=[...new Set(e.gallery)].filter(u=>u!==e.image);
 const walk=(n:any,d=0):boolean=>n===null||n===undefined||(d<=3&&typeof n==='object'&&typeof n.name==='string'&&n.name.length<=180&&['male','female','unknown'].includes(n.sex)&&walk(n.mother,d+1)&&walk(n.father,d+1));
 if(!walk(e.pedigree))throw Error('Pedigree inválido: até três gerações.');
 if(e.kind==='crossing'&&e.info.father&&e.info.mother){e.title=e.info.father+' × '+e.info.mother;e.info.genetics=e.title;e.pedigree={...e.pedigree,name:e.title};}
 if(e.kind==='animal'){
 e.pedigree={...e.pedigree,name:e.title};
 e.info.mother=e.pedigree?.mother?.name||'';e.info.father=e.pedigree?.father?.name||'';
 }
 if(!Number.isInteger(e.version)||e.version<0)throw Error('Versão inválida. Reabra a ficha.');
 return e;
}
export function sqlQuote(v:any){if(v===null||v===undefined)return 'NULL';if(typeof v==='number')return String(v);return "'"+String(v).replaceAll("'","''")+"'";}
export function insertSQL(table:string,row:Record<string,any>){return `INSERT INTO "${table}" (${Object.keys(row).map(k=>'"'+k+'"').join(',')}) VALUES (${Object.values(row).map(sqlQuote).join(',')});`;}
