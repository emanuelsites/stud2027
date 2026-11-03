import {upload} from '@vercel/blob/client';
declare global {interface Window{StudUpload:(file:File)=>Promise<{url:string}>}}
window.StudUpload=async(file:File)=>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size===0||file.size>10_000_000)throw Error('Envie PNG, JPEG ou WebP de até 10 MB.');
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if((file.type==='image/png'&&!png)||(file.type==='image/jpeg'&&!jpg)||(file.type==='image/webp'&&!webp))throw Error('O conteúdo do arquivo não corresponde ao formato da imagem.');
 const ext=png?'png':jpg?'jpg':'webp';
 const blob=await upload('studpb/'+crypto.randomUUID()+'.'+ext,file,{access:'public',handleUploadUrl:'/api/blob',contentType:file.type,multipart:file.size>4_000_000});
 return {url:blob.url};
};
