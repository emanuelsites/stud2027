import {upload} from '@vercel/blob/client';
declare global {interface Window{StudUpload:(file:File)=>Promise<{url:string}>}}
window.StudUpload=async(file:File)=>{
  if(!file||file.size===0||file.size>10_000_000)throw Error('Envie uma imagem de até 10 MB.');
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  const type=png?'image/png':jpg?'image/jpeg':webp?'image/webp':'';
  if(!type||file.type!==type)throw Error('Formato inválido. Use PNG, JPEG ou WebP.');
  const path='studpb/'+crypto.randomUUID()+'.'+(png?'png':jpg?'jpg':'webp');
  const result=await upload(path,file,{access:'public',handleUploadUrl:'/api/blob/upload',contentType:type});
  return {url:result.url};
};
