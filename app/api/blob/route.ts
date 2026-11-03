import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {head} from '@vercel/blob';
import {localUser} from '../../../lib/local-auth';
import {env} from '../../../lib/runtime';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  if(Number(request.headers.get('Content-Length')||0)>32000)return Response.json({error:'Solicitação muito grande.'},{status:413});
  const body=await request.json() as HandleUploadBody;
  const result=await handleUpload({request,body,
   onBeforeGenerateToken:async(pathname)=>{
    if(request.headers.get('Origin')!==new URL(request.url).origin)throw Error('Origem inválida.');
    await env.ready();if(!await localUser(request,env.DB))throw Error('Acesso restrito.');
    if(!/^studpb\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(pathname))throw Error('Nome de imagem inválido.');
    return {allowedContentTypes:['image/png','image/jpeg','image/webp'],maximumSizeInBytes:10_000_000,addRandomSuffix:false,tokenPayload:JSON.stringify({pathname})};
   },
   onUploadCompleted:async({blob,tokenPayload})=>{
    const expected=JSON.parse(tokenPayload||'{}').pathname;if(expected!==blob.pathname)throw Error('Imagem inválida.');
    await env.ready();const id=blob.pathname.slice(7).split('.')[0],metadata=await head(blob.url);
    await env.DB.prepare('INSERT OR IGNORE INTO media (id,url,mime,bytes,created_at) VALUES (?,?,?,?,?)').bind(id,blob.url,blob.contentType,metadata.size,new Date().toISOString()).run();
   }
  });
  return Response.json(result);
 }catch(error){console.error('Upload:',error instanceof Error?error.message:'falha');return Response.json({error:'Não foi possível autorizar o envio. Verifique o login e a configuração do Blob.'},{status:400});}
}
