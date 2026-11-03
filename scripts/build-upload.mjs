import {build} from 'esbuild';
await build({entryPoints:['client/upload.ts'],bundle:true,format:'iife',platform:'browser',target:'es2020',minify:true,outfile:'public/upload-client.js'});
