import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {head,del} from '@vercel/blob';
import {localUser} from './local-auth';
import {sameOrigin} from './runtime';

export const MAX_IMAGE_BYTES=10_000_000;
export function imageType(bytes:Uint8Array){
  if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'image/png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
  return '';
}
export function validateUploadPath(pathname:string){
  if(!/^studpb\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(pathname))throw Error('Arquivo inválido.');
  return pathname;
}
export async function blobUpload(request:Request,db:D1Database){
  const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return json({error:'Método inválido.'},405);
  if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:'Configure o armazenamento de imagens Vercel Blob.'},503);
  try{
    if(Number(request.headers.get('content-length')||0)>20000)return json({error:'Solicitação inválida.'},413);
    const body=await request.json() as HandleUploadBody;
    const response=await handleUpload({request,body,
      onBeforeGenerateToken:async pathname=>{
        if(!sameOrigin(request))throw Error('Origem inválida.');
        const user=await localUser(request,db);if(!user)throw Error('Acesso não autorizado.');
        validateUploadPath(pathname);
        return {allowedContentTypes:['image/png','image/jpeg','image/webp'],maximumSizeInBytes:MAX_IMAGE_BYTES,addRandomSuffix:true,
          validUntil:Date.now()+10*60*1000,
          tokenPayload:JSON.stringify({userId:user.userId,id:crypto.randomUUID()})};
      },
      // The SDK verifies the signed callback. It does not use the user's cookie.
      onUploadCompleted:async({blob,tokenPayload})=>{
        const payload=JSON.parse(tokenPayload||'{}');
        if(typeof payload.id!=='string'||typeof payload.userId!=='string')throw Error('Retorno inválido.');
        const meta=await head(blob.url);
        const response=await fetch(blob.url,{headers:{Range:'bytes=0-11'}});
        if(!response.ok)throw Error('Não foi possível validar a imagem.');
        const bytes=new Uint8Array(await response.arrayBuffer());
        if(meta.size===0||meta.size>MAX_IMAGE_BYTES||imageType(bytes)!==meta.contentType){await del(blob.url);throw Error('Formato de imagem inválido.');}
        await db.prepare('INSERT OR IGNORE INTO media (id,url,mime,bytes,created_at) VALUES (?,?,?,?,?)').bind(payload.id,blob.url,meta.contentType,meta.size,new Date().toISOString()).run();
      }
    });
    return json(response);
  }catch(error){
    const msg=error instanceof Error?error.message:'';
    return json({error:/inválid|autorizad/.test(msg)?msg:'Não foi possível concluir o envio. Confira o armazenamento e tente novamente.'},/autorizad/.test(msg)?401:400);
  }
}
