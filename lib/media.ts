export type AnimalVideo={youtubeId:string;title:string;cover:string};
export function youtubeId(value:string){
 if(typeof value!=='string')return '';
 if(/^[A-Za-z0-9_-]{11}$/.test(value))return value;
 try{const url=new URL(value);if(url.protocol!=='https:')return '';const host=url.hostname.toLowerCase();let id='';if(host==='youtu.be')id=url.pathname.slice(1).split('/')[0];else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){id=url.searchParams.get('v')||(/^\/(?:embed|shorts|live)\//.test(url.pathname)?url.pathname.split('/')[2]:'');}return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';}catch{return '';}
}
export function normalizeVideos(input:any):AnimalVideo[]{
 if(input===undefined)return [];
 if(!Array.isArray(input)||input.length>10)throw Error('Use até 10 vídeos do YouTube.');
 const seen=new Set<string>();const videos:AnimalVideo[]=[];
 for(const v of input){const id=youtubeId(typeof v==='string'?v:v?.youtubeId||v?.url);if(!id)throw Error('Link de vídeo inválido. Use uma URL do YouTube.');const title=typeof v==='object'&&typeof v.title==='string'?v.title:'Vídeo do animal';const cover=typeof v==='object'&&typeof v.cover==='string'?v.cover:'';if(title.length>180||cover.length>2000||cover&&!/^(?:\/(?:assets|media)\/|https:\/\/[^\s<>"']+$)/.test(cover))throw Error('Título ou capa de vídeo inválido.');if(!seen.has(id)){videos.push({youtubeId:id,title,cover});seen.add(id);}}
 return videos;
}
