import {getDatabase} from './database';
export const env={get DB(){return getDatabase()}};

export function siteOrigin(){
  const origin=process.env.SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:'http://localhost:3000');
  return new URL(origin).origin;
}
export function clientAddress(req:Request){
  // Vercel overwrites this header. Never trust oai/Cloudflare identity headers here.
  return req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()||'anonymous';
}

function allowedOrigins(){
  return [siteOrigin(),process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL]
    .filter(Boolean).map(value=>value!.startsWith('http')?new URL(value!).origin:'https://'+value);
}
export function sameOrigin(req:Request){
  const origin=req.headers.get('Origin');
  return !!origin&&(origin===new URL(req.url).origin||allowedOrigins().includes(origin));
}
export function externalOrigin(req:Request){
  // Next's internal Request URL may use localhost behind the hosting proxy.
  // Only recognized deployment/canonical hosts are used in redirects.
  const host=req.headers.get('x-forwarded-host')||req.headers.get('host');
  const origins=allowedOrigins();
  const known=origins.find(origin=>new URL(origin).host===host);
  if(known)return known;
  if(!process.env.VERCEL&&host&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))return 'http://'+host;
  return siteOrigin();
}
