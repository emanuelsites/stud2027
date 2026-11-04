import type {Entry} from './store';
import fatherPhotos from './content/father-photos-20261031.json';
import motherPhotos from './content/mother-photos-20261101.json';
import parentLandscapes from './content/parent-landscapes-20261104.json';
export function suppliedMotherPhoto(name:string){return (motherPhotos as Record<string,{image:string;placeholder:boolean}>)[key(name)]?.image||'';}
export const photoPlaceholder='/assets/templates/photo-unavailable-16x9-vercel.webp';
export function isPhotoTemplate(url:string){return url===photoPlaceholder||url==='/assets/parents/bhetania-jmen-template-20261101-vercel.webp';}
export function suppliedFatherPhoto(name:string){return (fatherPhotos as Record<string,{image:string}>)[key(name)]?.image||'';}
export const key=(s:string)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
export function displayName(e:Entry){if(e.kind!=='crossing')return e.title;const name=e.info.commercialName||e.title;return e.categories.includes('gestacoes')&&/^Próxima geração\s*\d+$/i.test(name)?genetics(e)||name:name;}
export function genetics(e:Entry){return [e.info.father,e.info.mother].filter(Boolean).join(' × ');}
export function codeCategory(e:Entry){return e.categories.includes('congelados')?'congelados':'gestacoes';}
export function defaultCommercialName(e:Entry,n:number){return codeCategory(e)==='congelados'?'Embrião congelado '+String(n).padStart(2,'0'):genetics(e)||'Gestação';}
export function parentAnimal(name:string,all:Entry[]){const k=key(name);return all.find(e=>e.kind==='animal'&&[e.title,e.info.registeredName,...(e.info.nameAliases||[])].filter(Boolean).some(n=>key(n)===k));}
// Landscape extensions are used only in parent frames; preserve original animal photos and admin uploads.
const parentLandscape:Record<string,string>=parentLandscapes;
export function parentImages(e:Entry,all:Entry[]){
 const father=e.info.fatherImage||suppliedFatherPhoto(e.info.father)||parentAnimal(e.info.father,all)?.image||(key(e.info.father)==='chaccoblue'?'/assets/chacco.webp':''),mother=e.info.motherImage||parentAnimal(e.info.mother,all)?.image||suppliedMotherPhoto(e.info.mother)||'';
 return {fatherImage:parentLandscape[father]||father,motherImage:parentLandscape[mother]||mother};
}
export function forecastDate(value:any){if(typeof value!=='string')return null;if(/^\d{4}$/.test(value))return value+'-12-31';const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);if(!m)return null;const iso=m[3]+'-'+m[2]+'-'+m[1],date=new Date(iso+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:null;}
export function pregnancyPending(e:Entry,today=new Date().toISOString().slice(0,10)){if(e.kind!=='crossing'||!e.categories.includes('gestacoes'))return false;const date=forecastDate(e.info.forecast);return !['born','closed'].includes(e.info.pregnancyStatus)&&(!date||date<today);}
export function available(e:Entry){return e.status==='published'&&e.info.availability!=='sold'&&!['born','closed'].includes(e.info.pregnancyStatus)&&!pregnancyPending(e);}
export function statusLabel(e:Entry){if(e.info.availability==='sold')return 'Vendido';if(e.info.pregnancyStatus==='born')return 'Nascimento registrado';if(e.info.pregnancyStatus==='closed')return 'Gestação encerrada';return pregnancyPending(e)?'Situação em confirmação':'Sob consulta';}
export function reviewIssues(entries:Entry[]){const out:any[]=[];for(const e of entries){if(e.status==='archived')continue;const push=(type:string,note:string)=>out.push({id:e.id,title:displayName(e),genetics:genetics(e),type,note});if(e.kind==='animal'&&(!e.image||isPhotoTemplate(e.image)))push('foto',isPhotoTemplate(e.image)?'Template provisório; adicionar fotografia real.':'Adicionar foto própria.');if(e.info.coverReviewPending)push('capa','Acervo com capa vertical; enviar alternativa horizontal.');if(pregnancyPending(e))push('gestacao','Previsão '+(e.info.forecast||'não informada')+'. Confirmar com o Stud antes de oferecer como gestação ativa.');if(e.info.pedigreeVerification==='conflict'||e.info.pedigreeVerification==='pending')push('pedigree',e.info.pedigreeReviewNote||'Conferir genealogia.');if(e.info.editorialReviewPending)push('texto','Resumo factual preparado; revisar com o Stud.');if(e.kind==='crossing'){const photos=parentImages(e,entries);if(!photos.fatherImage)push('pai','Adicionar foto correta do garanhão.');if(!photos.motherImage)push('mae','Adicionar foto correta da matriz.');else if(isPhotoTemplate(photos.motherImage))push('mae','Template provisório de Bhetania JMen; fotografia real pendente.');}if(e.status==='draft')push('rascunho','Cadastro preparado, aguardando confirmação antes de publicar.');}return out;}
